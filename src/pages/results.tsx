import { useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FundingChart } from "@/components/funding-chart";
import { formatCurrency } from "@/lib/utils";
import { Download, AlertCircle, CheckCircle2, CalendarDays, Building2, MapPin, Factory, Users, Target } from "lucide-react";
import Link from "next/link";

// ------------------------
// Helpers (future-safe)
// ------------------------
const isObj = (v: any) => v && typeof v === "object" && !Array.isArray(v);
const safeArray = <T,>(v: any, fallback: T[] = []) => (Array.isArray(v) ? v : fallback);
const safeStr = (v: any) => (typeof v === "string" ? v : "");
const safeNum = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const safeLower = (v: any) => safeStr(v).toLowerCase();

const escapeHtml = (str: string) =>
  str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function fmtRange(min: number, max: number) {
  if (!min && !max) return "";
  if (min && !max) return formatCurrency(min);
  if (!min && max) return formatCurrency(max);
  return `${formatCurrency(min)} – ${formatCurrency(max)}`;
}

function badgeForStatus(status: string) {
  const s = status.toLowerCase();
  if (s === "eligible") return { label: "Eligible", cls: "bg-emerald-100 text-emerald-800" };
  if (s === "maybe") return { label: "Conditional", cls: "bg-amber-100 text-amber-900" };
  if (s === "ineligible") return { label: "Not eligible", cls: "bg-slate-200 text-slate-700" };
  return { label: status || "Unknown", cls: "bg-slate-200 text-slate-700" };
}

// ------------------------
// Types (loose on purpose)
// ------------------------
type BackendResponse = any;

export default function Results() {
  const [resp, setResp] = useState<BackendResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("qc-funding-result");
      if (!saved) {
        setError("Could not calculate or find any programs for you. Sorry.");
        setResp(null);
        setLoading(false);
        return;
      }

      const parsed = JSON.parse(saved);
      if (!parsed || !isObj(parsed)) {
        setError("Could not calculate or find any programs for you. Sorry.");
        setResp(null);
        setLoading(false);
        return;
      }

      setResp(parsed);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setError("Could not calculate or find any programs for you. Sorry.");
      setResp(null);
      setLoading(false);
    }
  }, []);

  // ------------------------
  // Extract dynamic fields safely
  // ------------------------
  const companyName = safeStr(resp?.company) || safeStr(resp?.profile?.contact?.company) || "—";
  const contactName = safeStr(resp?.profile?.contact?.name) || "—";
  const email = safeStr(resp?.profile?.contact?.email) || "";

  const region = safeStr(resp?.profile?.region) || "—";
  const sector = safeStr(resp?.profile?.sector) || "—";
  const employeesBand = safeStr(resp?.profile?.employees_band) || "—";

  const projectBudget = safeNum(resp?.project?.budget);
  const projectFocus = safeStr(resp?.project?.main_goal) || "—";
  const projectDesc = safeStr(resp?.project?.description);

  const summary = resp?.summary || {};
  const estimatedMin = safeNum(summary?.estimated_min);
  const estimatedMax = safeNum(summary?.estimated_max);

  const netCost = safeNum(summary?.net_cost);
  const totalFunding = safeNum(summary?.total_funding);

  // You asked to use 4 bars: budget, grants, tax, net
  const grantsBar = safeNum(summary?.grants_total); // backend field
  const taxBar = safeNum(summary?.tax_total);       // backend field
  const netBar = netCost || Math.max(0, projectBudget - (grantsBar + taxBar));

  const totalPrograms = safeNum(summary?.total_programs);
  const strongMatches = safeNum(summary?.strong_matches);
  const conditionalMatches = safeNum(summary?.conditional_matches);

  const programResultsRaw = safeArray(resp?.program_results, []);
  const programResults = useMemo(() => {
    // Prefer eligible first, then maybe, then rest; within that sort by est_typical desc
    const rank = (status: string) => {
      const s = status?.toLowerCase?.() || "";
      if (s === "eligible") return 0;
      if (s === "maybe") return 1;
      return 2;
    };

    return [...programResultsRaw].sort((a, b) => {
      const ra = rank(safeStr(a?.status));
      const rb = rank(safeStr(b?.status));
      if (ra !== rb) return ra - rb;
      const ea = safeNum(a?.estimate?.est_typical) || safeNum(a?.estimate?.est_max) || 0;
      const eb = safeNum(b?.estimate?.est_typical) || safeNum(b?.estimate?.est_max) || 0;
      return eb - ea;
    });
  }, [programResultsRaw]);

  // "Top programs" – dynamic from backend, but safe fallback if empty
  const topPrograms = useMemo(() => {
    if (programResults.length > 0) return programResults.slice(0, 3);

    // fallback dummy cards (your instruction #4)
    return [
      {
        name: "ESSOR - Digital transformation & productivity",
        type: "grant",
        status: "maybe",
        confidence: "medium",
        estimate: { est_min: 30000, est_max: 60000, est_typical: 50000 },
        explanation: { summary: "maybe" },
      },
      {
        name: "Momentum Fund (Desjardins)",
        type: "grant",
        status: "eligible",
        confidence: "high",
        estimate: { est_min: 20000, est_max: 20000, est_typical: 20000 },
        explanation: { summary: "eligible" },
      },
      {
        name: "C3i - Digital investment tax credit (example)",
        type: "tax_credit",
        status: "eligible",
        confidence: "high",
        estimate: { est_min: 25500, est_max: 42500, est_typical: 34000 },
        explanation: { summary: "eligible" },
      },
    ];
  }, [programResults]);

  const chartData = useMemo(() => {
    // FundingChart expects {name,value,color}[]
    return [
      { name: "Total project budget", value: projectBudget || 0, color: "hsl(var(--foreground))" },
      { name: "Grants & funds", value: grantsBar || 0, color: "hsl(var(--primary))" },
      { name: "Tax credits", value: taxBar || 0, color: "hsl(var(--secondary))" },
      { name: "Your net cost", value: netBar || 0, color: "hsl(var(--muted-foreground))" },
    ];
  }, [projectBudget, grantsBar, taxBar, netBar]);

  // ------------------------
  // PDF Export (basic, reliable, no fancy CSS)
  // This opens print dialog -> Save as PDF
  // ------------------------
  const exportPdf = () => {
    if (!resp) return;

    // If backend returns blank data, show "no data"
    const hasAnyPrograms = programResultsRaw.length > 0;

    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Funding Report</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin:0; padding:24px; color:#111; }
    h1 { font-size:18px; margin:0 0 6px; }
    h2 { font-size:13px; margin:18px 0 8px; }
    .muted { color:#555; font-size:12px; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
    .card { border:1px solid #ddd; border-radius:10px; padding:12px; }
    .row { display:flex; justify-content:space-between; gap:10px; font-size:12px; margin:4px 0; }
    .sep { height:1px; background:#eee; margin:12px 0; }
    ul { margin: 6px 0 0 18px; padding:0; }
    li { margin: 4px 0; font-size:12px; }
    .pill { display:inline-block; padding:3px 8px; border-radius:999px; background:#eaf7ef; color:#0f5132; font-size:11px; font-weight:700; }
    @page { size:A4; margin:14mm; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  </style>
</head>
<body>
  <div class="muted">Generated by Quebec Funding Calculator</div>
  <h1>Funding summary for your project</h1>
  <div class="muted">${escapeHtml(companyName)} • ${escapeHtml(region)}</div>

  <div class="sep"></div>

  <div class="grid">
    <div class="card">
      <div class="row"><span>Company</span><span class="pill">Summary</span></div>
      <div class="row"><span>Contact</span><strong>${escapeHtml(contactName)}</strong></div>
      <div class="row"><span>Email</span><strong>${escapeHtml(email || "—")}</strong></div>
      <div class="row"><span>Region</span><strong>${escapeHtml(region)}</strong></div>
      <div class="row"><span>Sector</span><strong>${escapeHtml(sector)}</strong></div>
      <div class="row"><span>Employees</span><strong>${escapeHtml(employeesBand)}</strong></div>
      <div class="row"><span>Project focus</span><strong>${escapeHtml(projectFocus)}</strong></div>
    </div>

    <div class="card">
      <div class="row"><span>Total project budget</span><strong>${escapeHtml(formatCurrency(projectBudget || 0))}</strong></div>
      <div class="row"><span>Estimated eligible funding</span><strong>${escapeHtml(fmtRange(estimatedMin, estimatedMax) || "—")}</strong></div>
      <div class="row"><span>Grants</span><strong>${escapeHtml(formatCurrency(grantsBar || 0))}</strong></div>
      <div class="row"><span>Tax credits</span><strong>${escapeHtml(formatCurrency(taxBar || 0))}</strong></div>
      <div class="row"><span>Net cost</span><strong>${escapeHtml(formatCurrency(netBar || 0))}</strong></div>
      <div class="row"><span>Total programs</span><strong>${escapeHtml(String(totalPrograms || 0))}</strong></div>
    </div>
  </div>

  <h2>Top programs</h2>
  ${
    hasAnyPrograms
      ? topPrograms
          .map((p: any, i: number) => {
            const nm = safeStr(p?.name) || "—";
            const status = safeStr(p?.status) || "unknown";
            const typ = safeStr(p?.type) || "—";
            const estMin = safeNum(p?.estimate?.est_min);
            const estMax = safeNum(p?.estimate?.est_max);
            const estTyp = safeNum(p?.estimate?.est_typical);
            const conf = safeStr(p?.confidence) || "—";

            return `
            <div class="card" style="margin-bottom:10px;">
              <div style="font-weight:700; font-size:12px;">${i + 1}. ${escapeHtml(nm)}</div>
              <div class="muted">${escapeHtml(typ)} • Status: ${escapeHtml(status)} • Confidence: ${escapeHtml(conf)}</div>
              <div class="row" style="margin-top:6px;">
                <span>Estimate</span>
                <strong>${escapeHtml(fmtRange(estMin, estMax) || formatCurrency(estTyp || 0) || "—")}</strong>
              </div>
            </div>
          `;
          })
          .join("")
      : `<div class="card"><div class="muted">No program data was returned by the backend.</div></div>`
  }

  ${
    projectDesc
      ? `<h2>Project description</h2><div class="card"><div style="font-size:12px;">${escapeHtml(projectDesc)}</div></div>`
      : ""
  }

  <div class="sep"></div>
  <div class="muted">
    Note: This report reflects the backend calculation response. If data is missing, it will be omitted.
  </div>

  <script>
    window.onload = () => {
      window.focus();
      window.print();
      window.onafterprint = () => window.close();
    };
  </script>
</body>
</html>
`;

          const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.setAttribute("aria-hidden", "true");

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        alert("Could not export PDF.");
        document.body.removeChild(iframe);
        return;
      }

      doc.open();
      doc.write(html);
      doc.close();

      // cleanup after print
      iframe.contentWindow?.addEventListener("afterprint", () => {
        document.body.removeChild(iframe);
      });

  };

  // ------------------------
  // UI states
  // ------------------------
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
            Loading your calculation...
          </h2>
        </div>
      </Layout>
    );
  }

  if (error || !resp) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 max-w-2xl">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Could not calculate
              </CardTitle>
              <CardDescription>
                {error || "Could not calculate or find any programs for you. Sorry."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Link href="/calculator">
                <Button>Go back</Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem("qc-funding-result");
                  window.location.reload();
                }}
              >
                Clear result & retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // ------------------------
  // Main UI (dynamic)
  // ------------------------
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
                    Based on calculations
                  </Badge>
                  <span className="text-slate-400">•</span>
                  {companyName !== "—" && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {companyName}
                    </span>
                  )}
                  <span className="text-slate-400">•</span>
                  {region !== "—" && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {region}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={exportPdf} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download report (PDF)
                </Button>

                <Link href="/book-call">
                  <Button className="gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Book a call
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div ref={reportRef}>
          <div className="container mx-auto px-4 py-8 grid lg:grid-cols-[1fr_420px] gap-8">
            {/* Left column */}
            <div className="space-y-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Overview</CardTitle>
                  {/* <CardDescription>Dynamic values from backend response.</CardDescription> */}
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    {sector !== "—" && (
                      <div className="flex items-start gap-2">
                        <Factory className="h-4 w-4 text-slate-500 mt-0.5" />
                        <div>
                          <div className="text-slate-500">Sector</div>
                          <div className="font-semibold text-slate-900">{sector}</div>
                        </div>
                      </div>
                    )}

                    {employeesBand !== "—" && (
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 text-slate-500 mt-0.5" />
                        <div>
                          <div className="text-slate-500">Employees</div>
                          <div className="font-semibold text-slate-900">{employeesBand}</div>
                        </div>
                      </div>
                    )}

                    {projectFocus !== "—" && (
                      <div className="flex items-start gap-2 sm:col-span-2">
                        <Target className="h-4 w-4 text-slate-500 mt-0.5" />
                        <div>
                          <div className="text-slate-500">Project focus</div>
                          <div className="font-semibold text-slate-900">{projectFocus}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="grid sm:grid-cols-3 gap-3">
                    {estimatedMin || estimatedMax ? (
                      <div className="p-3 rounded-lg bg-slate-50 border">
                        <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                          Estimated eligible funding
                        </div>
                        <div className="text-lg font-bold text-slate-900 mt-1">
                          {fmtRange(estimatedMin, estimatedMax)}
                        </div>
                      </div>
                    ) : null}

                    <div className="p-3 rounded-lg bg-slate-50 border">
                      <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                        Programs that fit you
                      </div>
                      <div className="text-lg font-bold text-slate-900 mt-1">
                        {totalPrograms ? `${totalPrograms} matches` : "—"}
                      </div>
                      {(strongMatches || conditionalMatches) ? (
                        <div className="text-xs text-slate-500 mt-1">
                          {strongMatches} strong • {conditionalMatches} conditional
                        </div>
                      ) : null}
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border">
                      <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                        Net cost
                      </div>
                      <div className="text-lg font-bold text-slate-900 mt-1">
                        {formatCurrency(netBar)}
                      </div>
                    </div>
                  </div>

                  {projectDesc ? (
                    <>
                      <Separator />
                      <div className="text-sm text-slate-700">
                        <span className="font-semibold">Description:</span> {projectDesc}
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Cost vs potential support</CardTitle>
                  <CardDescription>Budget, grants, tax credits, and net cost.</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <FundingChart data={chartData} />
                </CardContent>
              </Card>
            </div>

            {/* Right column: Top programs */}
            <div className="space-y-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Top programs</CardTitle>
                  <CardDescription>
                    No data for now
                  </CardDescription>
                </CardHeader>
              </Card>

              {programResultsRaw.length === 0 ? (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6 text-sm text-slate-600 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-slate-500" />
                    No program data was returned by the backend.
                  </CardContent>
                </Card>
              ) : (
                topPrograms.map((p: any, idx: number) => {
                  const name = safeStr(p?.name) || "—";
                  const status = safeStr(p?.status) || "unknown";
                  const type = safeStr(p?.type) || "—";
                  const conf = safeStr(p?.confidence) || "—";

                  const estMin = safeNum(p?.estimate?.est_min);
                  const estMax = safeNum(p?.estimate?.est_max);
                  const estTyp = safeNum(p?.estimate?.est_typical);

                  const b = badgeForStatus(status);

                  return (
                    <Card key={String(p?.program_id ?? idx)} className="border-slate-200 shadow-sm">
                      <CardHeader className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base">{name}</CardTitle>
                            <div className="text-sm text-slate-500 mt-1">
                              {type} • Confidence: {conf}
                            </div>
                          </div>
                          <Badge className={b.cls}>{b.label}</Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="p-3 rounded-lg border bg-slate-50">
                          <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                            Estimated amount
                          </div>
                          <div className="text-lg font-bold text-slate-900 mt-1">
                            {fmtRange(estMin, estMax) || (estTyp ? formatCurrency(estTyp) : "—")}
                          </div>
                        </div>

                        <Button variant="outline" className="w-full">
                          View details & next steps
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}

              {/* simple stacking warning */}
              {/* <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6 text-sm text-slate-600 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600" />
                  Stacking rules are not shown yet (feature later).
                </CardContent>
              </Card> */}

              <Button variant="outline" onClick={exportPdf} className="w-full gap-2">
                <Download className="h-4 w-4" />
                Download report (PDF)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
