import { useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FundingChart } from "@/components/funding-chart";
import { formatCurrency } from "@/lib/utils";
import {
  Building2,
  MapPin,
  Factory,
  Users,
  Target,
  CheckCircle2,
  Download,
  CalendarDays,
  BarChart3,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

type CalcData = {
  location?: string;
  industry?: string;
  employees?: string;
  revenue?: string;

  projectTypes?: string[];
  mainGoal?: string;

  budgetItems?: Array<{ id: string; name: string; cost: number }>;

  companyName?: string;
  email?: string;

  complexityPreference?: string; // "simple" | "max" etc (optional)
  projectDetailLevel?: string;
};

const safeArray = <T,>(v: any, fallback: T[] = []) =>
  Array.isArray(v) ? v : fallback;

const toNumber = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

const mapLocationLabel = (loc?: string) => {
  if (!loc) return "-";
  const map: Record<string, string> = {
    montreal: "Montréal",
    quebec_city: "Québec City",
    laval: "Laval",
    monteregie: "Montérégie",
    laurentides: "Laurentides",
    lanaudiere: "Lanaudière",
    estrie: "Estrie",
    outaouais: "Outaouais",
    mauricie: "Mauricie",
    saguenay: "Saguenay–Lac-Saint-Jean",
    bas_st_laurent: "Bas-Saint-Laurent",
    gaspesie: "Gaspésie–Îles-de-la-Madeleine",
    abitibi: "Abitibi-Témiscamingue",
    cote_nord: "Côte-Nord",
    nord_du_quebec: "Nord-du-Québec",
    outside_qc: "Outside Québec",
  };
  return map[loc] || loc.replace(/_/g, " ");
};

const mapIndustryLabel = (ind?: string) => {
  if (!ind) return "-";
  const map: Record<string, string> = {
    manufacturing: "Manufacturing / industrial",
    retail: "Retail (physical stores)",
    ecommerce: "E-commerce / online retail",
    professional_services: "Professional services / consulting",
    construction: "Construction / real estate",
    hospitality: "Hospitality / tourism / restaurants",
    logistics: "Transportation / logistics",
    agri_food: "Agriculture / agri-food",
    tech: "Technology / software / digital services",
    health: "Health / social services",
    education: "Education / training",
    other: "Other",
  };
  return map[ind] || ind;
};

const mapEmployeesLabel = (emp?: string) => {
  if (!emp) return "-";
  return emp.replace("-", "–");
};

const mapProjectFocus = (projectTypes: string[], mainGoal?: string) => {
  const wantsWebsite =
    projectTypes.some((p) => p.toLowerCase().includes("website")) ||
    projectTypes.some((p) => p.toLowerCase().includes("e-commerce")) ||
    projectTypes.some((p) => p.toLowerCase().includes("marketing"));

  const wantsProduction =
    projectTypes.some((p) => p.toLowerCase().includes("production")) ||
    projectTypes.some((p) => p.toLowerCase().includes("industry 4.0")) ||
    projectTypes.some((p) => p.toLowerCase().includes("automation"));

  if (wantsWebsite && wantsProduction) return "Online presence + production process";
  if (wantsWebsite) return "Online presence / sales";
  if (wantsProduction) return "Production process / automation";

  if (mainGoal?.toLowerCase().includes("online")) return "Online presence / sales";
  if (mainGoal?.toLowerCase().includes("production")) return "Production process / automation";

  return projectTypes.length ? projectTypes.slice(0, 2).join(" + ") : "Digital transformation";
};

function escapeHtml(str: string) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default function Results() {
  const [calc, setCalc] = useState<CalcData | null>(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem("qc-funding-calc");
        if (saved) setCalc(JSON.parse(saved) || {});
        else setCalc({});
      } catch (e) {
        console.error("Failed to read calculator data", e);
        setCalc({});
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const totalBudget = useMemo(() => {
    const items = safeArray(calc?.budgetItems, []);
    return items.reduce((acc, it) => acc + toNumber(it?.cost), 0);
  }, [calc]);

  // Simple stable estimate rules (POC)
  const estimates = useMemo(() => {
    const budget = totalBudget || 250000;

    const complexityPref = calc?.complexityPreference === "simple" ? 0.35 : 0.5; // 35%–50%
    const readinessBoost =
      calc?.projectDetailLevel?.toLowerCase().includes("quotes")
        ? 0.05
        : calc?.projectDetailLevel?.toLowerCase().includes("roadmap")
        ? 0.03
        : 0.0;

    const lowIntensity = Math.max(0.25, complexityPref - 0.15 + readinessBoost);
    const highIntensity = Math.min(0.6, complexityPref + readinessBoost);

    const grantsLow = Math.round(budget * 0.22);
    const grantsHigh = Math.round(budget * 0.30);
    const taxLow = Math.round(budget * 0.12);
    const taxHigh = Math.round(budget * 0.18);

    const totalSupportLow = Math.round(budget * lowIntensity);
    const totalSupportHigh = Math.round(budget * highIntensity);

    const netLow = Math.max(0, budget - totalSupportHigh);
    const netHigh = Math.max(0, budget - totalSupportLow);

    return {
      budget,
      totalSupportLow,
      totalSupportHigh,
      grantsLow,
      grantsHigh,
      taxLow,
      taxHigh,
      netLow,
      netHigh,
      intensityLow: Math.round(lowIntensity * 100),
      intensityHigh: Math.round(highIntensity * 100),
    };
  }, [calc, totalBudget]);

  const chartData = useMemo(() => {
    const budget = Number(estimates.budget || 250000);
    const grantsMid = Math.round((estimates.grantsLow + estimates.grantsHigh) / 2);
    const taxMid = Math.round((estimates.taxLow + estimates.taxHigh) / 2);
    const netMid = Math.max(0, budget - (grantsMid + taxMid));

    return [
      { name: "Total project budget", value: budget, color: "hsl(var(--foreground))" },
      { name: "Grants & funds (est.)", value: grantsMid, color: "hsl(var(--primary))" },
      { name: "Tax credits (est.)", value: taxMid, color: "hsl(var(--secondary))" },
      { name: "Your net cost (approx.)", value: netMid, color: "hsl(var(--muted-foreground))" },
    ];
  }, [estimates]);

  const companyName = calc?.companyName || "Your company";
  const locationLabel = mapLocationLabel(calc?.location);
  const industryLabel = mapIndustryLabel(calc?.industry);
  const employeesLabel = mapEmployeesLabel(calc?.employees);
  const focus = mapProjectFocus(safeArray(calc?.projectTypes, []), calc?.mainGoal);

  const topPrograms = useMemo(() => {
    const budget = estimates.budget || 250000;

    return [
      {
        id: "essor",
        title: "ESSOR – Digital transformation & productivity",
        type: "Non-repayable grant",
        fit: "⭐⭐⭐⭐☆ (Very strong)",
        cover: [
          "Part of your production automation project (machines, software, integration)",
          "Part of your digital roadmap / consulting",
        ],
        amount: {
          low: Math.min(60000, Math.round(budget * 0.12)),
          high: Math.min(90000, Math.round(budget * 0.24)),
        },
        conditions: [
          "Manufacturing SME in Québec ✅",
          "Clear productivity gains (time saved, cost per unit, defects)",
          "Project size usually above $100,000 ✅",
        ],
        cta: "View details & next steps",
      },
      {
        id: "automation",
        title: "Industrial automation / Industry 4.0 support",
        type: "Grant or combined grant + loan (program-dependent)",
        fit: "⭐⭐⭐⭐☆",
        cover: [
          "Smart machines, sensors, data capture on the production line",
          "Integration with your ERP / BI to track production in real time",
        ],
        amount: {
          low: Math.min(50000, Math.round(budget * 0.10)),
          high: Math.min(80000, Math.round(budget * 0.20)),
        },
        conditions: [
          "Manufacturing plant in Québec ✅",
          "Clear link to automation and productivity ✅",
        ],
        cta: "View details & next steps",
      },
      {
        id: "tax",
        title: "Digital investment / productivity tax credit (C3i-type)",
        type: "Refundable tax credit",
        fit: "⭐⭐⭐⭐☆",
        cover: ["Part of your software, hardware, and equipment costs"],
        amount: {
          low: Math.min(40000, Math.round(budget * 0.08)),
          high: Math.min(60000, Math.round(budget * 0.16)),
        },
        conditions: [
          "Investments in approved digital / manufacturing tech ✅",
          "Company taxable in Québec ✅",
        ],
        cta: "See how this tax credit works for you",
      },
    ];
  }, [estimates]);

  const actionChecklist = useMemo(() => {
    const simple = calc?.complexityPreference === "simple";
    return [
      "Lock your project scope and budget.",
      "Define the exact machines, software, and website work we will include.",
      "Apply for the main grant (ESSOR / main program).",
      "Prepare a short digital transformation plan and basic financials.",
      "We help write this in the format the program expects.",
      "Structure the project so it also qualifies for tax credits.",
      "Tag which expenses are eligible (equipment vs software vs services).",
      "Check if an automation or regional program can be stacked.",
      "If yes, we adjust the timeline to avoid conflicts.",
      "Final step: decide your preferred option.",
      simple
        ? "Option B: 1–2 programs only (less paperwork, lower funding but simpler)."
        : "Option A: Maximise funding (more programs, more paperwork).",
    ];
  }, [calc]);

  /**
   * Client-only, no API:
   * Opens a basic print page (simple CSS), user chooses "Save as PDF".
   * This is the ONLY reliable way without server routes.
   */
 const exportPdf = async () => {
  try {
    const payload = {
      calc: {
        companyName,
        locationLabel: `${locationLabel}, Québec`,
        industryLabel,
        employeesLabel,
        focus,
      },
      estimates,
      topPrograms,
      checklist: actionChecklist,
    };

    const res = await fetch("/api/report-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "PDF generation failed");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${(companyName || "funding-report")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}-funding-report.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("Failed to download PDF. Check console for details.");
  }
};


  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-pulse space-y-4 max-w-lg mx-auto">
            <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
            <div className="h-64 bg-slate-200 rounded mt-8"></div>
          </div>
          <h2 className="text-xl font-semibold mt-8 text-slate-600">
            Building your personalized funding summary...
          </h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen pb-20">
        {/* Sticky Top Bar */}
        <div className="bg-white border-b sticky top-16 z-30 shadow-sm">
          <div className="container mx-auto px-4 py-5">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900">
                  Funding summary for your project
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                    High Confidence
                  </Badge>
                  <span className="text-slate-400">•</span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {companyName}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {locationLabel}, Québec
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={exportPdf} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download full report (PDF)
                </Button>

                <Link href="/book-call">
                  <Button className="gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Book a funding strategy call
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* On-screen report (can stay fancy) */}
        <div ref={reportRef}>
          <div className="container mx-auto px-4 py-8">
            <div className="grid lg:grid-cols-[1fr_420px] gap-8">
              <div className="space-y-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Funding summary for your project
                    </CardTitle>
                    <CardDescription>
                      Based on the info you provided in the calculator.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    <div className="grid md:grid-cols-5 gap-4">
                      <div className="md:col-span-3 space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-start gap-2">
                            <Factory className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div>
                              <div className="text-slate-500">Sector</div>
                              <div className="font-semibold text-slate-900">{industryLabel}</div>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div>
                              <div className="text-slate-500">Employees</div>
                              <div className="font-semibold text-slate-900">{employeesLabel}</div>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 sm:col-span-2">
                            <Target className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div>
                              <div className="text-slate-500">Project focus</div>
                              <div className="font-semibold text-slate-900">{focus}</div>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="grid sm:grid-cols-3 gap-3">
                          <div className="p-3 rounded-lg bg-slate-50 border">
                            <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                              Estimated eligible funding
                            </div>
                            <div className="text-lg font-bold text-slate-900 mt-1">
                              {formatCurrency(estimates.totalSupportLow)} – {formatCurrency(estimates.totalSupportHigh)}
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-slate-50 border">
                            <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                              Programs that fit you
                            </div>
                            <div className="text-lg font-bold text-slate-900 mt-1">6 likely matches</div>
                            <div className="text-xs text-slate-500 mt-1">3 very strong • 3 conditional</div>
                          </div>

                          <div className="p-3 rounded-lg bg-slate-50 border">
                            <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                              Estimated net project cost
                            </div>
                            <div className="text-lg font-bold text-slate-900 mt-1">
                              {formatCurrency(estimates.netLow)} – {formatCurrency(estimates.netHigh)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-3">
                        <div className="p-4 rounded-lg bg-white border shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            <div className="font-semibold text-sm">Funding intensity</div>
                          </div>
                          <div className="text-sm text-slate-700">
                            We estimate that{" "}
                            <span className="font-bold">
                              {estimates.intensityLow}%–{estimates.intensityHigh}%
                            </span>{" "}
                            of your total project cost can be covered if all programs are approved.
                          </div>
                        </div>

                        <div className="p-4 rounded-lg bg-white border shadow-sm">
                          <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                            Total project budget
                          </div>
                          <div className="text-xl font-bold text-primary mt-1">
                            {formatCurrency(estimates.budget)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Your project: cost vs potential support</CardTitle>
                    <CardDescription>
                      Budget, estimated grants, estimated tax credits, and net cost.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    <FundingChart data={chartData} />
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">What we should do next (in order)</CardTitle>
                    <CardDescription>
                      A clear plan to turn this estimate into real approvals.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ol className="space-y-2">
                      {actionChecklist.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full border flex items-center justify-center text-[11px] bg-white text-slate-500 shrink-0">
                            {i + 1}
                          </div>
                          <div className="text-slate-700">{step}</div>
                        </li>
                      ))}
                    </ol>

                    <Separator />

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="outline" onClick={exportPdf} className="gap-2 w-full">
                        <Download className="h-4 w-4" />
                        Download full report (PDF)
                      </Button>

                      <Link href="/book-call" className="w-full">
                        <Button className="gap-2 w-full">
                          <CalendarDays className="h-4 w-4" />
                          Book a funding strategy call
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Top 3 programs for you</CardTitle>
                    <CardDescription>
                      Prioritized based on your profile and budget (POC).
                    </CardDescription>
                  </CardHeader>
                </Card>

                {topPrograms.map((p) => (
                  <Card key={p.id} className="border-slate-200 shadow-sm">
                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">{p.title}</CardTitle>
                          <div className="text-sm text-slate-500 mt-1">{p.type}</div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-800 shrink-0">
                          Fit: {p.fit}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">
                          What it can cover for you
                        </div>
                        <ul className="space-y-1 text-sm text-slate-700">
                          {p.cover.map((x, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                              <span>{x}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 rounded-lg border bg-slate-50">
                        <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                          Estimated amount for your case
                        </div>
                        <div className="text-lg font-bold text-slate-900 mt-1">
                          {formatCurrency(p.amount.low)} – {formatCurrency(p.amount.high)}
                        </div>
                      </div>

                      <Button variant="outline" className="w-full">
                        {p.cta}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 mt-8">
              Note: This is an estimate based on typical eligibility patterns and public program rules.
              Final approval depends on full application review.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
