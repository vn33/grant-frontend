import { Layout } from "@/components/layout";
import { PROGRAMS } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { GetStaticPaths, GetStaticProps } from "next";

type Program = (typeof PROGRAMS)[number];

type Props = {
  program: Program;
};

export default function ProgramDetails({ program }: Props) {
  // If you use fallback: "blocking" in getStaticPaths, keep this guard:
  if (!program) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Program not found</h1>
          <Link href="/programs">
            <Button className="mt-4">Back to Directory</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white min-h-screen">
        {/* Header */}
        <div className="bg-slate-50 border-b py-12">
          <div className="container mx-auto px-4">
            <Link
              href="/programs"
              className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Programs
            </Link>

            <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="outline">{program.provider}</Badge>
                  <Badge
                    className={
                      program.status === "Open"
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-800"
                    }
                  >
                    {program.status}
                  </Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  {program.name}
                </h1>
                <p className="text-xl text-slate-600 max-w-3xl">
                  {program.description}
                </p>
              </div>

              <div className="flex gap-3">
                <Button size="lg" className="shadow-md">
                  Apply Now <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 grid md:grid-cols-[1fr_300px] gap-12">
          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-bold mb-6">Overview</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                This program is designed to assist businesses in their digital transformation journey.
                Whether you are looking to implement a new ERP system, upgrade your cybersecurity,
                or automate your production lines, {program.name} provides essential financial support.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <span className="block text-sm text-muted-foreground mb-1">Max Funding</span>
                  <span className="text-xl font-bold text-primary">
                    {program.fundingMax > 0 ? formatCurrency(program.fundingMax) : "Varies"}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border">
                  <span className="block text-sm text-muted-foreground mb-1">Coverage</span>
                  <span className="text-xl font-bold text-primary">{program.fundingPercentage}%</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border">
                  <span className="block text-sm text-muted-foreground mb-1">Type</span>
                  <span className="text-xl font-bold text-primary">{program.category}</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border">
                  <span className="block text-sm text-muted-foreground mb-1">Level</span>
                  <span className="text-xl font-bold text-primary">{program.level}</span>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-bold mb-6">Eligibility Criteria</h2>
              <ul className="space-y-3">
                {program.eligibility.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-bold mb-6">Example Calculation</h2>
              <Card className="bg-slate-50 border-slate-200">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                    <span>Project Total Cost</span>
                    <span className="font-mono text-lg">$200,000</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Eligible Expenses (80%)</span>
                    <span className="font-mono text-slate-600">$160,000</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold text-primary mt-4">
                    <span>Funding Amount ({program.fundingPercentage}%)</span>
                    <span>{formatCurrency(160000 * (program.fundingPercentage / 100))}</span>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-white border rounded-xl p-6 shadow-sm sticky top-24">
              <h3 className="font-bold text-lg mb-4">Quick Facts</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="block text-muted-foreground">Deadline</span>
                  <span className="font-medium">Continuous Intake</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Processing Time</span>
                  <span className="font-medium">4-6 weeks (est.)</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Tags</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {program.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: PROGRAMS.map((p) => ({ params: { slug: p.slug } })),
    fallback: false, // safest for a static dataset
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  const program = PROGRAMS.find((p) => p.slug === slug);

  if (!program) {
    return { notFound: true };
  }

  return {
    props: { program },
  };
};
