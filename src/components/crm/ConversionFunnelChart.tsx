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
    <Card className="border-border/40">
      <CardContent className="p-5">
        <h3 className="mb-6 font-display text-sm font-semibold text-foreground">Funil de Conversão</h3>
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
                  <div className="relative h-8 w-full overflow-hidden rounded bg-secondary/30">
                    <div
                      className={`h-full ${step.color} flex items-center justify-end rounded pr-2 transition-all duration-700`}
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
        <p className="mt-4 font-body text-[10px] text-muted-foreground">
          Taxa de conversão entre cada etapa do funil de vendas
        </p>
      </CardContent>
    </Card>
  );
};

export default ConversionFunnelChart;
