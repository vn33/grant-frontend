import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HowItWorks() {
  return (
    <Layout>
      <div className="bg-white min-h-screen py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-slate-900 mb-6">How our calculation works</h1>
            <p className="text-xl text-slate-600">Transparency is key. Here's exactly how we estimate your funding potential.</p>
          </div>

          <div className="space-y-20 relative">
            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-slate-100 hidden md:block" />

            {[
              {
                title: "1. Data Collection & Matching",
                content: "We take your inputs (Location, Industry, Project Type) and cross-reference them against a database of 40+ active federal and provincial programs. We filter out programs that are closed or for which you don't meet the basic eligibility criteria (e.g., revenue thresholds)."
              },
              {
                title: "2. Expense Analysis",
                content: "Not all project costs are eligible. We apply standard ratios (based on historical data) to your budget items. For example, hardware is often funded at a lower rate than software or training."
              },
              {
                title: "3. Stacking Rules Application",
                content: "Government rules limit how much public money you can receive for one project. We apply a 'Stacking Limit' (usually 75%) to ensure our estimates aren't overly optimistic. If you select multiple grants, we cap the total.",
                warning: "Note: This is the most complex part of funding. Our tool provides a safe estimate, but a consultant can often optimize this further."
              },
              {
                title: "4. Confidence Scoring",
                content: "We assign a confidence score based on how well your profile matches the program's past approval patterns. A 'High Match' means your project is exactly what the program was designed for."
              }
            ].map((step, i) => (
              <div key={i} className="relative pl-0 md:pl-24">
                <div className="hidden md:flex absolute left-0 top-0 w-16 h-16 rounded-full bg-slate-50 border-4 border-white shadow-sm items-center justify-center font-bold text-xl text-primary z-10">
                  {i + 1}
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-4">{step.content}</p>
                {step.warning && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-amber-800 text-sm">
                    {step.warning}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-20 text-center bg-slate-50 rounded-2xl p-12">
            <h3 className="text-2xl font-bold mb-4">Ready to see your numbers?</h3>
            <Link href="/calculator">
              <Button size="lg" className="shadow-lg">Start Calculation <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
