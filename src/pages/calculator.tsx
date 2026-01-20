import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Trash2,
  Plus,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/router";

// Types for the form data
interface CalculatorData {
  // Step A: Business Profile
  location: string;
  legalEntity: string;
  industry: string;
  employees: string;
  revenue: string;
  isExporting: boolean;
  exportScope: string; // qc_only | canada | outside_canada | both

  // Step B: Project Overview
  currentTools: string[];
  digitalLevel: string;
  projectTypes: string[];
  timeline: string;
  mainGoal: string;
  projectDetailLevel: string;
  description: string;

  // Step C: Budget
  budgetRange: string;
  budgetItems: Array<{ id: string; name: string; cost: number }>;
  majorCostTypes: string[];

  // Step D: Preferences
  previousFunding: string; // no | yes | not_sure
  previousPrograms: string[];
  supportType: string; // both | grants | tax | loans | any | explain
  reimbursementOk: boolean;
  hasProjectManager: boolean;
  complexityPreference: string; // maximize | simple

  // Step E: Contact (kept in Review step to avoid changing flow)
  contactName: string;
  companyName: string;
  email: string;
  helpNext: string;

  // Review
  disclaimerAccepted: boolean;
}

const INITIAL_DATA: CalculatorData = {
  location: "",
  legalEntity: "",
  industry: "",
  employees: "",
  revenue: "",
  isExporting: false,
  exportScope: "qc_only",
  currentTools: [],
  digitalLevel: "",
  projectTypes: [],
  timeline: "",
  mainGoal: "",
  projectDetailLevel: "",
  description: "",

  budgetRange: "",
  budgetItems: [
    { id: "1", name: "Software Licenses (ERP/CRM)", cost: 0 },
    { id: "2", name: "Implementation Consultants", cost: 0 },
    { id: "3", name: "Training", cost: 0 },
  ],
  majorCostTypes: [],

  previousFunding: "no",
  previousPrograms: [],
  supportType: "any",
  reimbursementOk: true,
  hasProjectManager: false,
  complexityPreference: "maximize",

  contactName: "",
  companyName: "",
  email: "",
  helpNext: "",

  disclaimerAccepted: false,
};

const STEPS = [
  "Business Profile",
  "Project Overview",
  "Budget",
  "Preferences",
  "Review",
];

export default function Calculator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<CalculatorData>(INITIAL_DATA);
  const router = useRouter();

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("qc-funding-calc");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        setData({
          ...INITIAL_DATA,
          ...parsed,

          // ensure arrays exist
          currentTools: Array.isArray(parsed?.currentTools)
            ? parsed.currentTools
            : [],
          projectTypes: Array.isArray(parsed?.projectTypes)
            ? parsed.projectTypes
            : [],
          budgetItems: Array.isArray(parsed?.budgetItems)
            ? parsed.budgetItems
            : INITIAL_DATA.budgetItems,
          majorCostTypes: Array.isArray(parsed?.majorCostTypes)
            ? parsed.majorCostTypes
            : [],
          previousPrograms: Array.isArray(parsed?.previousPrograms)
            ? parsed.previousPrograms
            : [],

          // ensure booleans exist
          isExporting:
            typeof parsed?.isExporting === "boolean"
              ? parsed.isExporting
              : false,
          reimbursementOk:
            typeof parsed?.reimbursementOk === "boolean"
              ? parsed.reimbursementOk
              : true,
          hasProjectManager:
            typeof parsed?.hasProjectManager === "boolean"
              ? parsed.hasProjectManager
              : false,
          disclaimerAccepted:
            typeof parsed?.disclaimerAccepted === "boolean"
              ? parsed.disclaimerAccepted
              : false,
        });
      } catch (e) {
        console.error("Failed to load saved progress");
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem("qc-funding-calc", JSON.stringify(data));
  }, [data]);

  
  const updateData = (updates: Partial<CalculatorData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    localStorage.removeItem("qc-funding-calc");
    setData(INITIAL_DATA);
    setCurrentStep(0);
    window.scrollTo(0, 0);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    } else {
      // Submit
      router.push("/results");
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const getPayload = async () => {
    const totalBudget = data.budgetItems.reduce(
      (acc, item) => acc + (Number(item.cost) || 0),
      0
    );

    const payload = {
      ...data,
      totalBudget,
      submittedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("http://20.119.101.162/calculate", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        localStorage.removeItem("qc-funding-result");
        throw new Error(`Backend error: ${res.status}`);
      }

      const json = await res.json();

      // ✅ store backend response for Results page
      localStorage.setItem("qc-funding-result", JSON.stringify(json));

      console.log("CALCULATOR_PAYLOAD:", payload);
      console.log("BACKEND_RESPONSE:", json);

      return payload;
    } catch (err) {
      console.error("Failed to calculate:", err);
      localStorage.removeItem("qc-funding-result"); // avoid stale/partial data
      return payload;
    }
  };


  const totalBudget = data.budgetItems.reduce(
    (acc, item) => acc + item.cost,
    0,
  );

  // Validation Logic (Simple)
  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return (
          !!data.location &&
          !!data.legalEntity &&
          !!data.industry &&
          !!data.employees &&
          !!data.revenue
        );
      case 1:
        return (
          data.currentTools.length > 0 &&
          !!data.digitalLevel &&
          data.projectTypes.length > 0 &&
          !!data.timeline &&
          !!data.mainGoal
        );
      case 2:
        return totalBudget > 0;
      case 3:
        return !!data.complexityPreference;
      case 4:
        return data.disclaimerAccepted;
      default:
        return false;
    }
  };

  const TOOL_OPTIONS = [
    "Accounting software (QuickBooks, Sage, Acomba, etc.)",
    "ERP (Odoo, SAP, NetSuite, etc.)",
    "CRM",
    "E-commerce platform (Shopify, WooCommerce, etc.)",
    "POS system",
    "Business intelligence / dashboards (Power BI, Looker, etc.)",
    "Industrial automation / robots / Industry 4.0",
    "Custom internal software",
    "None / very basic tools",
  ];

  const PROJECT_OPTIONS = [
    "Implement or change ERP",
    "Implement or change CRM",
    "Build or rebuild company website",
    "Launch or improve e-commerce store",
    "Connect systems / workflow automation (APIs, integrations, etc.)",
    "Implement or upgrade BI / dashboards / data platform",
    "Automate or modernize production (Industry 4.0, sensors, machines)",
    "Implement AI / machine learning (forecasting, quality control, etc.)",
    "Improve cybersecurity / data protection",
    "Train staff on digital tools and new processes",
    "Other digital project",
  ];

  const MAJOR_COST_TYPES = [
    "External consultants / integrators / agencies",
    "Software licenses / subscriptions",
    "Hardware / equipment / machines / sensors",
    "Custom development / programming / integrations",
    "Training for employees",
    "Internal staff time assigned to the project",
    "Marketing / export activities",
    "Other costs",
  ];

  function checkState() {
    var saved = localStorage.getItem("qc-funding-calc");

  if (!saved) {
    console.log("No saved data in localStorage");
    return;
  }

  const parsed = JSON.parse(saved);
  console.log("Current Data:", data);
  console.log("Saved Data:", parsed);
  }

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <button onClick={()=>getPayload()}>console saved storage</button>
          {/* Header & Progress */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Funding Calculator
              </h1>
              <p className="text-slate-500 text-sm">
                Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
              </p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex-1 md:w-48">
                <Progress
                  value={((currentStep + 1) / STEPS.length) * 100}
                  className="h-2"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground gap-2"
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Auto-saved</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={resetForm}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[250px_1fr] gap-8">
            {/* Sidebar Steps */}
            <nav className="hidden lg:block space-y-1">
              {STEPS.map((step, i) => (
                <button
                  key={i}
                  disabled={i > currentStep}
                  onClick={() => setCurrentStep(i)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between",
                    i === currentStep
                      ? "bg-white shadow-sm text-primary border border-slate-200"
                      : i < currentStep
                        ? "text-slate-600 hover:bg-slate-100"
                        : "text-slate-400 cursor-not-allowed",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs border",
                        i === currentStep
                          ? "bg-primary text-white border-primary"
                          : i < currentStep
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-400 border-slate-200",
                      )}
                    >
                      {i < currentStep ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    {step}
                  </div>
                </button>
              ))}
            </nav>

            {/* Main Form Area */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 md:p-8 min-h-[500px]">
                {/* STEP A: BUSINESS PROFILE */}
                {currentStep === 0 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">
                      {/* Q1 */}
                      <div className="space-y-2">
                        <Label>Where is your main place of business?</Label>
                        <Select
                          value={data.location}
                          onValueChange={(v) => updateData({ location: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your region" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            <SelectItem value="montreal">Montréal</SelectItem>
                            <SelectItem value="quebec_city">
                              Québec City
                            </SelectItem>
                            <SelectItem value="laval">Laval</SelectItem>
                            <SelectItem value="monteregie">
                              Montérégie
                            </SelectItem>
                            <SelectItem value="laurentides">
                              Laurentides
                            </SelectItem>
                            <SelectItem value="lanaudiere">
                              Lanaudière
                            </SelectItem>
                            <SelectItem value="estrie">Estrie</SelectItem>
                            <SelectItem value="outaouais">Outaouais</SelectItem>
                            <SelectItem value="mauricie">Mauricie</SelectItem>
                            <SelectItem value="saguenay">
                              Saguenay–Lac-Saint-Jean
                            </SelectItem>
                            <SelectItem value="bas_st_laurent">
                              Bas-Saint-Laurent
                            </SelectItem>
                            <SelectItem value="gaspesie">
                              Gaspésie–Îles-de-la-Madeleine
                            </SelectItem>
                            <SelectItem value="abitibi">
                              Abitibi-Témiscamingue
                            </SelectItem>
                            <SelectItem value="cote_nord">Côte-Nord</SelectItem>
                            <SelectItem value="nord_du_quebec">
                              Nord-du-Québec
                            </SelectItem>
                            <SelectItem value="outside_qc">
                              Outside Québec
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Some grants offer higher rates for regions outside
                          Montréal/Québec City.
                        </p>
                      </div>

                      {/* Q2 */}
                      <div className="space-y-2 pt-2">
                        <Label>
                          What type of legal entity is your business?
                        </Label>
                        <RadioGroup
                          value={data.legalEntity}
                          onValueChange={(v) => updateData({ legalEntity: v })}
                        >
                          <div className="grid md:grid-cols-2 gap-3 pt-2">
                            {[
                              "Incorporated company (Inc. / Ltd. / S.A.)",
                              "Sole proprietorship",
                              "Partnership",
                              "Non-profit organization",
                              "Other",
                            ].map((v) => (
                              <div
                                key={v}
                                className="flex items-center space-x-2"
                              >
                                <RadioGroupItem value={v} id={v} />
                                <Label
                                  htmlFor={v}
                                  className="font-normal cursor-pointer"
                                >
                                  {v}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Q5 */}
                        <div className="space-y-2">
                          <Label>What is your main sector of activity?</Label>
                          <Select
                            value={data.industry}
                            onValueChange={(v) => updateData({ industry: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select sector" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 overflow-y-auto">
                              <SelectItem value="manufacturing">
                                Manufacturing / industrial
                              </SelectItem>
                              <SelectItem value="retail">
                                Retail (physical stores)
                              </SelectItem>
                              <SelectItem value="ecommerce">
                                E-commerce / online retail
                              </SelectItem>
                              <SelectItem value="professional_services">
                                Professional services / consulting
                              </SelectItem>
                              <SelectItem value="construction">
                                Construction / real estate
                              </SelectItem>
                              <SelectItem value="hospitality">
                                Hospitality / tourism / restaurants
                              </SelectItem>
                              <SelectItem value="logistics">
                                Transportation / logistics
                              </SelectItem>
                              <SelectItem value="agri_food">
                                Agriculture / agri-food
                              </SelectItem>
                              <SelectItem value="tech">
                                Technology / software / digital services
                              </SelectItem>
                              <SelectItem value="health">
                                Health / social services
                              </SelectItem>
                              <SelectItem value="education">
                                Education / training
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Q3 */}
                        <div className="space-y-2">
                          <Label>How many full-time employees (approx.)?</Label>
                          <Select
                            value={data.employees}
                            onValueChange={(v) => updateData({ employees: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 overflow-y-auto">
                              <SelectItem value="1-4">1–4</SelectItem>
                              <SelectItem value="5-9">5–9</SelectItem>
                              <SelectItem value="10-49">10–49</SelectItem>
                              <SelectItem value="50-99">50–99</SelectItem>
                              <SelectItem value="100-249">100–249</SelectItem>
                              <SelectItem value="250+">250+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Q4 */}
                      <div className="space-y-2">
                        <Label>
                          What was your last full year revenue (CAD)?
                        </Label>
                        <Select
                          value={data.revenue}
                          onValueChange={(v) => updateData({ revenue: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select revenue range" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            <SelectItem value="<250k">
                              Less than $250,000
                            </SelectItem>
                            <SelectItem value="250k-999k">
                              $250,000 – $999,999
                            </SelectItem>
                            <SelectItem value="1m-4_9m">$1M – $4.9M</SelectItem>
                            <SelectItem value="5m-9_9m">$5M – $9.9M</SelectItem>
                            <SelectItem value="10m-49_9m">
                              $10M – $49.9M
                            </SelectItem>
                            <SelectItem value="50m+">$50M and above</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Q6 */}
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="exporting"
                          checked={data.isExporting}
                          onCheckedChange={(c) => {
                            const checked = c === true;
                            updateData({
                              isExporting: checked,
                              exportScope: checked
                                ? data.exportScope === "qc_only"
                                  ? "canada"
                                  : data.exportScope
                                : "qc_only",
                            });
                          }}
                        />
                        <Label
                          htmlFor="exporting"
                          className="font-normal cursor-pointer"
                        >
                          Do you sell outside Québec?
                        </Label>
                      </div>

                      {data.isExporting && (
                        <div className="space-y-4 pl-6 pt-4">
                          <Label>If yes, where?</Label>
                          <RadioGroup
                            value={data.exportScope}
                            onValueChange={(v) =>
                              updateData({ exportScope: v })
                            }
                          >
                            <div className="flex gap-4 flex-wrap mt-2">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="canada"
                                  id="export_canada"
                                />
                                <Label
                                  htmlFor="export_canada"
                                  className="font-normal cursor-pointer"
                                >
                                  Elsewhere in Canada
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="outside_canada"
                                  id="export_outside_canada"
                                />
                                <Label
                                  htmlFor="export_outside_canada"
                                  className="font-normal cursor-pointer"
                                >
                                  Outside Canada
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="both" id="export_both" />
                                <Label
                                  htmlFor="export_both"
                                  className="font-normal cursor-pointer"
                                >
                                  Both
                                </Label>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP B: PROJECT OVERVIEW */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* Q7 */}
                    <div className="space-y-4">
                      <Label className="text-base">
                        Which tools do you use today? (Select all that apply)
                      </Label>
                      <div className="grid md:grid-cols-2 gap-3">
                        {TOOL_OPTIONS.map((tool) => (
                          <div
                            key={tool}
                            className={cn(
                              "flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-all",
                              data.currentTools.includes(tool)
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                            )}
                            onClick={() => {
                              const newTools = data.currentTools.includes(tool)
                                ? data.currentTools.filter((t) => t !== tool)
                                : [...data.currentTools, tool];
                              updateData({ currentTools: newTools });
                            }}
                          >
                            <Checkbox
                              checked={data.currentTools.includes(tool)}
                              className="mt-0.5"
                            />
                            <div className="space-y-1">
                              <span className="font-medium text-sm">
                                {tool}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Q8 */}
                    <div className="space-y-2">
                      <Label>
                        How would you describe your current digital level?
                      </Label>
                      <RadioGroup
                        value={data.digitalLevel}
                        onValueChange={(v) => updateData({ digitalLevel: v })}
                      >
                        <div className="space-y-2">
                          {[
                            "We are at the very beginning (mostly manual, Excel, paper).",
                            "We have some digital tools, but they are not connected and create extra work.",
                            "We are fairly digital, but we want to improve and automate more.",
                            "We are advanced and want to go into AI, predictive, or new automation.",
                          ].map((v) => (
                            <div
                              key={v}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem value={v} id={v} />
                              <Label
                                htmlFor={v}
                                className="font-normal cursor-pointer"
                              >
                                {v}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Q9 */}
                    <div className="space-y-4">
                      <Label className="text-base">
                        Which projects are you planning in the next 12–24
                        months?
                      </Label>
                      <div className="grid md:grid-cols-2 gap-3">
                        {PROJECT_OPTIONS.map((type) => (
                          <div
                            key={type}
                            className={cn(
                              "flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-all",
                              data.projectTypes.includes(type)
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                            )}
                            onClick={() => {
                              const newTypes = data.projectTypes.includes(type)
                                ? data.projectTypes.filter((t) => t !== type)
                                : [...data.projectTypes, type];
                              updateData({ projectTypes: newTypes });
                            }}
                          >
                            <Checkbox
                              checked={data.projectTypes.includes(type)}
                              className="mt-0.5"
                            />
                            <div className="space-y-1">
                              <span className="font-medium text-sm">
                                {type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Q11 */}
                    <div className="space-y-2">
                      <Label>
                        When do you expect to start your main project?
                      </Label>
                      <RadioGroup
                        value={data.timeline}
                        onValueChange={(v) => updateData({ timeline: v })}
                      >
                        <div className="flex gap-4 flex-wrap">
                          {[
                            "Within the next 3 months",
                            "In 3–6 months",
                            "In 6–12 months",
                            "In more than 12 months",
                            "Not sure yet",
                          ].map((t) => (
                            <div
                              key={t}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem value={t} id={t} />
                              <Label
                                htmlFor={t}
                                className="font-normal cursor-pointer"
                              >
                                {t}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Q12 */}
                    <div className="space-y-2 pt-2">
                      <Label>What is the main goal of your project?</Label>
                      <RadioGroup
                        value={data.mainGoal}
                        onValueChange={(v) => updateData({ mainGoal: v })}
                      >
                        <div className="space-y-2">
                          {[
                            "Improve internal efficiency and productivity",
                            "Increase online sales and marketing reach",
                            "Both: improve production AND online presence / sales",
                            "Other",
                          ].map((v) => (
                            <div
                              key={v}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem value={v} id={v} />
                              <Label
                                htmlFor={v}
                                className="font-normal cursor-pointer"
                              >
                                {v}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Q14 */}
                    <div className="space-y-2">
                      <Label>How detailed is your project today?</Label>
                      <RadioGroup
                        value={data.projectDetailLevel}
                        onValueChange={(v) =>
                          updateData({ projectDetailLevel: v })
                        }
                      >
                        <div className="space-y-2">
                          {[
                            "Just an idea; nothing written yet",
                            "We have internal notes and a rough description",
                            "We have a clear written project plan / digital roadmap",
                            "We already have written quotes from suppliers",
                          ].map((v) => (
                            <div
                              key={v}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem value={v} id={v} />
                              <Label
                                htmlFor={v}
                                className="font-normal cursor-pointer"
                              >
                                {v}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label>Brief Description (Optional)</Label>
                      <Input
                        placeholder="e.g. Build a new website + connect ERP to BI dashboards..."
                        value={data.description}
                        onChange={(e) =>
                          updateData({ description: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* STEP C: BUDGET */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-base">
                        Estimated Project Budget
                      </Label>
                      <Badge
                        variant="outline"
                        className="text-lg px-3 py-1 bg-slate-50"
                      >
                        Total:{" "}
                        <span className="font-bold text-primary ml-2">
                          {formatCurrency(totalBudget)}
                        </span>
                      </Badge>
                    </div>

                    {/* Q10 (optional range) */}
                    <div className="space-y-2">
                      <Label>Total estimated budget range (optional)</Label>
                      <Select
                        value={data.budgetRange}
                        onValueChange={(v) => updateData({ budgetRange: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a range (or leave blank)" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          <SelectItem value="<20k">
                            Less than $20,000
                          </SelectItem>
                          <SelectItem value="20k-49k">
                            $20,000 – $49,999
                          </SelectItem>
                          <SelectItem value="50k-99k">
                            $50,000 – $99,999
                          </SelectItem>
                          <SelectItem value="100k-249k">
                            $100,000 – $249,999
                          </SelectItem>
                          <SelectItem value="250k-499k">
                            $250,000 – $499,999
                          </SelectItem>
                          <SelectItem value="500k+">
                            $500,000 or more
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Your line items below are used for calculations.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {data.budgetItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex gap-3 items-end group"
                        >
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              Item Name
                            </Label>
                            <Input
                              value={item.name}
                              onChange={(e) => {
                                const newItems = [...data.budgetItems];
                                newItems[index].name = e.target.value;
                                updateData({ budgetItems: newItems });
                              }}
                            />
                          </div>
                          <div className="w-40 space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              Estimated Cost ($)
                            </Label>
                            <Input
                              type="number"
                              value={item.cost || ""}
                              onChange={(e) => {
                                const newItems = [...data.budgetItems];
                                newItems[index].cost =
                                  parseFloat(e.target.value) || 0;
                                updateData({ budgetItems: newItems });
                              }}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const newItems = data.budgetItems.filter(
                                (_, i) => i !== index,
                              );
                              updateData({ budgetItems: newItems });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 border-dashed"
                        onClick={() => {
                          updateData({
                            budgetItems: [
                              ...data.budgetItems,
                              {
                                id: Math.random().toString(),
                                name: "New Item",
                                cost: 0,
                              },
                            ],
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Line Item
                      </Button>
                    </div>

                    {/* Q13 */}
                    <div className="space-y-4 pt-4 border-t">
                      <Label className="text-base">
                        Which cost types are a large part of your budget?
                        (Select all that apply)
                      </Label>
                      <div className="grid md:grid-cols-2 gap-3">
                        {MAJOR_COST_TYPES.map((type) => (
                          <div
                            key={type}
                            className={cn(
                              "flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-all",
                              data.majorCostTypes.includes(type)
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                            )}
                            onClick={() => {
                              const next = data.majorCostTypes.includes(type)
                                ? data.majorCostTypes.filter((t) => t !== type)
                                : [...data.majorCostTypes, type];
                              updateData({ majorCostTypes: next });
                            }}
                          >
                            <Checkbox
                              checked={data.majorCostTypes.includes(type)}
                              className="mt-0.5"
                            />
                            <div className="space-y-1">
                              <span className="font-medium text-sm">
                                {type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg mt-6 flex gap-3 text-sm text-blue-800">
                      <HelpCircle className="h-5 w-5 shrink-0" />
                      <p>
                        <strong>Tip:</strong> Be realistic but optimistic.
                        Grants often cover a percentage of <em>eligible</em>{" "}
                        expenses. Don&apos;t forget training and internal
                        salaries!
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP D: PREFERENCES */}
                {currentStep === 3 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* Q15 */}
                    <div className="space-y-2">
                      <Label>
                        Have you received public funding for digital or
                        innovation projects in the last 3 years?
                      </Label>
                      <RadioGroup
                        value={data.previousFunding}
                        onValueChange={(v) =>
                          updateData({ previousFunding: v })
                        }
                      >
                        <div className="flex gap-4 flex-wrap">
                          {[
                            { id: "no", label: "No" },
                            {
                              id: "yes",
                              label: "Yes, at least one grant or tax credit",
                            },
                            { id: "not_sure", label: "Not sure" },
                          ].map((o) => (
                            <div
                              key={o.id}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem value={o.id} id={`pf_${o.id}`} />
                              <Label
                                htmlFor={`pf_${o.id}`}
                                className="font-normal cursor-pointer"
                              >
                                {o.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Q15.a */}
                    {data.previousFunding === "yes" && (
                      <div className="space-y-4 pl-2">
                        <Label className="text-base">
                          Which programs have you used? (Select all that apply)
                        </Label>
                        <div className="grid md:grid-cols-2 gap-3">
                          {[
                            "ESSOR",
                            "PCAN / CDAP",
                            "Investissement Québec programs",
                            "Municipal / regional programs",
                            "Tax credits (C3i, CDAE, SR&ED, etc.)",
                            "Other",
                          ].map((p) => (
                            <div
                              key={p}
                              className={cn(
                                "flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-all",
                                data.previousPrograms.includes(p)
                                  ? "border-primary bg-primary/5 shadow-sm"
                                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                              )}
                              onClick={() => {
                                const next = data.previousPrograms.includes(p)
                                  ? data.previousPrograms.filter((x) => x !== p)
                                  : [...data.previousPrograms, p];
                                updateData({ previousPrograms: next });
                              }}
                            >
                              <Checkbox
                                checked={data.previousPrograms.includes(p)}
                                className="mt-0.5"
                              />
                              <span className="font-medium text-sm">{p}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Q16 */}
                    <div className="space-y-4">
                      <Label className="text-base">
                        Are you open to both grants and tax credits, or do you
                        prefer only direct grants?
                      </Label>

                      <RadioGroup
                        value={data.supportType}
                        onValueChange={(v) => updateData({ supportType: v })}
                        className="space-y-3"
                      >
                        {[
                          {
                            id: "both",
                            label: "Grants + Tax Credits",
                            desc: "Best overall coverage if eligible.",
                          },
                          {
                            id: "grants",
                            label: "Grants only",
                            desc: "Direct funding, more competitive.",
                          },
                          {
                            id: "tax",
                            label: "Tax Credits only",
                            desc: "Often reliable, reimbursed later.",
                          },
                          {
                            id: "loans",
                            label: "Loans / Financing",
                            desc: "Useful if grants don’t fit.",
                          },
                          {
                            id: "any",
                            label: "Any / Optimized Mix",
                            desc: "We’ll find the best combo.",
                          },
                          {
                            id: "explain",
                            label: "I don’t know — explain in results",
                            desc: "We’ll show differences clearly.",
                          },
                        ].map((opt) => {
                          const selected = data.supportType === opt.id;

                          return (
                            <div
                              key={opt.id}
                              className={cn(
                                "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                                selected
                                  ? "border-primary bg-primary/10 shadow-sm"
                                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                              )}
                              onClick={() =>
                                updateData({ supportType: opt.id })
                              }
                            >
                              <RadioGroupItem
                                value={opt.id}
                                id={`support_${opt.id}`}
                                className="mt-1"
                              />
                              <Label
                                htmlFor={`support_${opt.id}`}
                                className="cursor-pointer"
                              >
                                <div className="font-semibold">{opt.label}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {opt.desc}
                                </div>
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="reimbursement"
                          checked={data.reimbursementOk}
                          onCheckedChange={(c) =>
                            updateData({ reimbursementOk: c === true })
                          }
                        />
                        <div className="space-y-1">
                          <Label
                            htmlFor="reimbursement"
                            className="font-medium"
                          >
                            Can you pay upfront and be reimbursed later?
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Most government grants work on a reimbursement basis
                            (you pay, then claim).
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="pm"
                          checked={data.hasProjectManager}
                          onCheckedChange={(c) =>
                            updateData({ hasProjectManager: c === true })
                          }
                        />
                        <div className="space-y-1">
                          <Label htmlFor="pm" className="font-medium">
                            We have an internal project manager / owner for this
                            project
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Some programs expect clear internal ownership and
                            coordination.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Q17 */}
                    <div className="space-y-2 pt-4 border-t">
                      <Label>What do you prefer?</Label>
                      <RadioGroup
                        value={data.complexityPreference}
                        onValueChange={(v) =>
                          updateData({ complexityPreference: v })
                        }
                      >
                        <div className="space-y-2">
                          {[
                            {
                              id: "maximize",
                              label:
                                "Maximise total funding, even if the process is longer/more complex",
                            },
                            {
                              id: "simple",
                              label:
                                "Get some support, but keep the process very simple",
                            },
                          ].map((o) => (
                            <div
                              key={o.id}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem value={o.id} id={`cp_${o.id}`} />
                              <Label
                                htmlFor={`cp_${o.id}`}
                                className="font-normal cursor-pointer"
                              >
                                {o.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {/* STEP E: REVIEW */}
                {currentStep === 4 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-xl font-bold">Review your details</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardContent className="pt-6 space-y-4">
                          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                            Company
                          </h3>
                          <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <span className="text-slate-500">
                              Legal Entity:
                            </span>
                            <span className="font-medium">
                              {data.legalEntity || "-"}
                            </span>

                            <span className="text-slate-500">Industry:</span>
                            <span className="font-medium">
                              {data.industry || "-"}
                            </span>

                            <span className="text-slate-500">Region:</span>
                            <span className="font-medium">
                              {data.location
                                ? data.location.replace(/_/g, " ")
                                : "-"}
                            </span>

                            <span className="text-slate-500">Size:</span>
                            <span className="font-medium">
                              {data.employees
                                ? `${data.employees} employees`
                                : "-"}
                            </span>

                            <span className="text-slate-500">Exports:</span>
                            <span className="font-medium">
                              {data.isExporting
                                ? data.exportScope === "both"
                                  ? "Canada + Outside Canada"
                                  : data.exportScope === "outside_canada"
                                    ? "Outside Canada"
                                    : "Elsewhere in Canada"
                                : "No (Québec only)"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6 space-y-4">
                          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                            Project
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">
                                Total Budget:
                              </span>
                              <span className="font-bold text-primary">
                                {formatCurrency(totalBudget)}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-500 block mb-1">
                                Focus Areas:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {data.projectTypes.length > 0 ? (
                                  data.projectTypes.map((t) => (
                                    <Badge
                                      key={t}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {t}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </div>
                            </div>

                            <div>
                              <span className="text-slate-500 block mb-1">
                                Goal:
                              </span>
                              <span className="font-medium">
                                {data.mainGoal || "-"}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Contact */}
                    <Card>
                      <CardContent className="pt-6 space-y-4">
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                          Contact
                        </h3>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Your first and last name</Label>
                            <Input
                              value={data.contactName}
                              onChange={(e) =>
                                updateData({ contactName: e.target.value })
                              }
                              placeholder="e.g. Marie Tremblay"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Company name</Label>
                            <Input
                              value={data.companyName}
                              onChange={(e) =>
                                updateData({ companyName: e.target.value })
                              }
                              placeholder="e.g. Tremblay Manufacturing Inc."
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            value={data.email}
                            onChange={(e) =>
                              updateData({ email: e.target.value })
                            }
                            placeholder="e.g. marie.tremblay@example.com"
                          />
                        </div>

                        <div className="space-y-2 pt-2">
                          <Label>How do you want us to help you next?</Label>
                          <RadioGroup
                            value={data.helpNext}
                            onValueChange={(v) => updateData({ helpNext: v })}
                          >
                            <div className="space-y-2">
                              {[
                                "Just send me a summary report by email",
                                "Contact me for a short call to validate funding options",
                                "Contact me with a full project + funding proposal",
                              ].map((v) => (
                                <div
                                  key={v}
                                  className="flex items-center space-x-2"
                                >
                                  <RadioGroupItem value={v} id={v} />
                                  <Label
                                    htmlFor={v}
                                    className="font-normal cursor-pointer"
                                  >
                                    {v}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </RadioGroup>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          id="disclaimer"
                          checked={data.disclaimerAccepted}
                          onCheckedChange={(c) =>
                            updateData({ disclaimerAccepted: c === true })
                          }
                        />
                        <Label htmlFor="disclaimer" className="text-sm">
                          I understand this tool provides estimates based on
                          public data and is not a formal application.
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              <div className="p-6 border-t bg-slate-50/50 flex justify-between rounded-b-xl">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="w-24"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>

                {
                  currentStep >= 0 && currentStep<4 ? (<Button
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className={cn(
                    "w-32",
                    currentStep === STEPS.length - 1 &&
                      "bg-emerald-600 hover:bg-emerald-700",
                  )}
                >
                  Next
                  {currentStep !== STEPS.length - 1 && (
                    <ArrowRight className="ml-2 h-4 w-4" />
                  )}
                </Button>):(
                  <Button
                    onClick={async () => {
                      await getPayload();     // ✅ store qc-funding-result first
                      router.push("/results"); // ✅ then go to results
                    }}
                    disabled={!isStepValid()}
                    className={cn(
                      "w-32",
                      currentStep === STEPS.length - 1 &&
                        "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    Calculate
                  </Button>
                )
                }
                
                
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
