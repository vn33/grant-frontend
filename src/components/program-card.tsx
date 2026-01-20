import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, AlertCircle } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import type { Program } from "@/lib/data";
import Link from "next/link";
interface ProgramCardProps {
  program: Program;
  relevance?: "High" | "Medium" | "Low";
  onAddToScenario?: (program: Program) => void;
  added?: boolean;
}

export function ProgramCard({ program, relevance, onAddToScenario, added }: ProgramCardProps) {
  return (
    <Card className={cn(
      "flex flex-col h-full transition-all hover:shadow-md border-l-4",
      relevance === "High" ? "border-l-emerald-500" : 
      relevance === "Medium" ? "border-l-amber-500" : 
      "border-l-slate-200"
    )}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div>
            <Badge variant="outline" className="mb-2 text-xs font-normal text-muted-foreground">
              {program.provider}
            </Badge>
            <CardTitle className="text-lg leading-tight text-primary">
              <Link href={`/programs/${program.slug}`} className="hover:underline">
                {program.name}
              </Link>
            </CardTitle>
          </div>
          {relevance && (
            <Badge className={cn(
              relevance === "High" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" :
              relevance === "Medium" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" :
              "bg-slate-100 text-slate-800 hover:bg-slate-100"
            )}>
              {relevance} Match
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {program.description}
        </p>
        
        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
          <div className="bg-slate-50 p-2 rounded">
            <span className="block text-xs text-muted-foreground">Max Funding</span>
            <span className="font-semibold text-primary">
              {program.fundingMax > 0 ? formatCurrency(program.fundingMax) : "Varies"}
            </span>
          </div>
          <div className="bg-slate-50 p-2 rounded">
            <span className="block text-xs text-muted-foreground">Coverage</span>
            <span className="font-semibold text-primary">{program.fundingPercentage}%</span>
          </div>
        </div>

        {program.matchReason && program.matchReason.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Why you match</p>
            {program.matchReason.slice(0, 2).map((reason, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <Check className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex gap-2">
        <Link href={`/programs/${program.slug}`} className="flex-1">
          <Button variant="outline" className="w-full text-xs h-9">
            Details
          </Button>
        </Link>
        {onAddToScenario && (
          <Button 
            variant={added ? "secondary" : "default"} 
            className={cn("flex-1 text-xs h-9", added && "bg-emerald-100 text-emerald-800 hover:bg-emerald-200")}
            onClick={() => onAddToScenario(program)}
            disabled={added}
          >
            {added ? "Added" : "Add to Plan"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
