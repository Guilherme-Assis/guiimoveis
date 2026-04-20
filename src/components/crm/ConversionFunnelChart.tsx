import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";

interface FunnelStep {
  label: string;
  count: number;
  color: string;
}

interface ConversionFunnelChartProps {
  leads: any[];
  visits: any[];
  proposals: any[];
}

const ConversionFunnelChart = ({ leads, visits, proposals }: ConversionFunnelChartProps) => {
  const steps = useMemo<FunnelStep[]>(() => {
    const totalLeads = leads.length;
    const contacted = leads.filter((l) => l.status !== "novo" && l.status !== "perdido").length;
    const visited = visits.filter((v) => v.status === "realizada").length;
    const proposed = proposals.length;
    const closed = leads.filter((l) => l.status === "fechado").length;

    return [
      { label: "Leads", count: totalLeads, color: "bg-sky-500" },
      { label: "Em Contato", count: contacted, color: "bg-amber-500" },
      { label: "Visitaram", count: visited, color: "bg-violet-500" },
      { label: "Propostas", count: proposed, color: "bg-emerald-500" },
      { label: "Fechados", count: closed, color: "bg-primary" },
    ];
  }, [leads, visits, proposals]);

  const maxCount = Math.max(...steps.map((s) => s.count), 1);

  return (
    <Card className="relative overflow-hidden border-border/40 bg-card">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <CardContent className="relative p-5 sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
            <TrendingDown className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold tracking-tight text-foreground">Funil de Conversão</h3>
            <p className="font-body text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">Jornada do lead ao fechamento</p>
          </div>
        </div>
        <div className="space-y-3">
          {steps.map((step, i) => {
            const widthPct = Math.max((step.count / maxCount) * 100, 8);
            const prevCount = i > 0 ? steps[i - 1].count : step.count;
            const convRate = prevCount > 0 ? ((step.count / prevCount) * 100).toFixed(0) : "—";
            return (
              <div key={step.label} className="flex items-center gap-3">
                <div className="w-20 shrink-0 text-right">
                  <p className="font-body text-xs font-medium text-muted-foreground">{step.label}</p>
                </div>
                <div className="flex-1">
                  <div className="relative h-9 w-full overflow-hidden rounded-lg bg-secondary/30">
                    <div
                      className={`h-full ${step.color} flex items-center justify-end rounded-lg pr-3 shadow-sm transition-all duration-700`}
                      style={{ width: `${widthPct}%` }}
                    >
                      <span className="font-display text-xs font-bold text-white drop-shadow">
                        {step.count}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-14 shrink-0">
                  {i > 0 && (
                    <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <TrendingDown className="h-3 w-3" />
                      <span>{convRate}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionFunnelChart;
