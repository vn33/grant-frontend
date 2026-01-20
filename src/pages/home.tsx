import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Calculator, BadgeDollarSign, FileText, Building2, ShieldCheck, Cpu, Globe } from "lucide-react";
import { MOCK_TESTIMONIALS } from "@/lib/data";

export default function Homepage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl" />
        
        <div className="container relative z-10 px-4 mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className="flex h-2 w-2 rounded-full bg-secondary mr-2" />
            Updated for 2026 Fiscal Year
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl mb-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
            Estimate Québec Digital Transformation Funding in <span className="text-primary">3 Minutes</span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            Get a realistic funding range based on your company profile and project needs. No jargon, just clear estimates for grants, loans, and tax credits.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-7 duration-700 delay-300">
            <Link href="/calculator">
              <Button size="lg" className="h-14 px-8 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                Start Calculation <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/programs">
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg bg-white/80 backdrop-blur">
                Browse Programs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works cards */}
      <section className="py-20 bg-white">
        <div className="container px-4 mx-auto">
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-100 -z-10" />

            {[
              { 
                icon: FileText, 
                title: "1. Answer questions", 
                desc: "Tell us about your company size, revenue, and location." 
              },
              { 
                icon: Calculator, 
                title: "2. Add project budget", 
                desc: "Input estimated costs for software, hardware, and training." 
              },
              { 
                icon: BadgeDollarSign, 
                title: "3. See funding scenarios", 
                desc: "Get a tailored list of eligible grants and tax credits." 
              }
            ].map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center p-6 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 border border-slate-100 text-primary">
                  <step.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we cover */}
      <section className="py-20 bg-slate-50">
        <div className="container px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Eligible Project Types</h2>
            <p className="text-lg text-slate-600">We cover the full spectrum of digital transformation initiatives supported by Investissement Québec and federal partners.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { icon: Building2, label: "ERP & IT Integration" },
              { icon: Cpu, label: "Industry 4.0 & Automation" },
              { icon: ShieldCheck, label: "Cybersecurity" },
              { icon: Globe, label: "Digital Marketing" },
              { icon: FileText, label: "Custom Software & AI" },
              { icon: CheckCircle2, label: "Employee Training" }
            ].map((item, i) => (
              <div key={i} className="flex items-center p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                <item.icon className="h-6 w-6 text-secondary mr-3" />
                <span className="font-semibold text-slate-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-primary text-white">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Trusted by Forward-Thinking SMEs</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {MOCK_TESTIMONIALS.map((t, i) => (
              <Card key={i} className="bg-primary-foreground/5 border-primary-foreground/10 text-white">
                <CardContent className="pt-6">
                  <p className="text-lg italic mb-6 text-primary-foreground/90">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center font-bold text-secondary">
                      {t.author[0]}
                    </div>
                    <div>
                      <div className="font-semibold">{t.author}</div>
                      <div className="text-sm text-primary-foreground/60">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
