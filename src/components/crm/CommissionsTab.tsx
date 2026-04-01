import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Target, TrendingUp, Award, Percent } from "lucide-react";

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const CommissionsTab = () => {
  const { brokerId, role } = useAuth();
  const [monthlyGoal, setMonthlyGoal] = useState<number>(500000);

  const { data: broker } = useQuery({
    queryKey: ["broker-commission-rate", brokerId],
    queryFn: async () => {
      if (!brokerId) return null;
      const { data, error } = await supabase.from("brokers").select("commission_rate, company_name").eq("id", brokerId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId,
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["commission-proposals", brokerId],
    queryFn: async () => {
      const q = supabase.from("broker_proposals").select("*, broker_leads(name), db_properties(title)");
      if (role === "broker" && brokerId) q.eq("broker_id", brokerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  const commissionRate = broker?.commission_rate ?? 5;

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const accepted = proposals.filter((p: any) => p.status === "aceita");
    const thisMonth = accepted.filter((p: any) => {
      const d = new Date(p.updated_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalSales = accepted.reduce((s: number, p: any) => s + (p.proposed_value || 0), 0);
    const totalCommission = totalSales * (commissionRate / 100);

    const monthlySales = thisMonth.reduce((s: number, p: any) => s + (p.proposed_value || 0), 0);
    const monthlyCommission = monthlySales * (commissionRate / 100);
    const goalProgress = monthlyGoal > 0 ? Math.min((monthlySales / monthlyGoal) * 100, 100) : 0;

    return { totalSales, totalCommission, monthlySales, monthlyCommission, goalProgress, acceptedCount: accepted.length, thisMonthCount: thisMonth.length };
  }, [proposals, commissionRate, monthlyGoal]);

  const kpis = [
    { label: "Vendas Totais", value: formatCurrency(stats.totalSales), icon: DollarSign, color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-600/10" },
    { label: "Comissão Total", value: formatCurrency(stats.totalCommission), icon: Award, color: "text-primary", bg: "from-primary/20 to-primary/5" },
    { label: "Vendas no Mês", value: formatCurrency(stats.monthlySales), icon: TrendingUp, color: "text-sky-400", bg: "from-sky-500/20 to-sky-600/10" },
    { label: "Comissão no Mês", value: formatCurrency(stats.monthlyCommission), icon: Percent, color: "text-amber-400", bg: "from-amber-500/20 to-amber-600/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent">
            Comissões & Metas
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Acompanhe suas vendas e comissões
          </p>
        </div>
        <Badge variant="outline" className="border-primary/40 text-primary text-sm w-fit">
          Taxa: {commissionRate}%
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border/40 transition-all hover:border-border/60">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-body text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">{kpi.label}</p>
                  <p className="mt-1 sm:mt-2 font-display text-lg sm:text-2xl font-bold text-foreground truncate">{kpi.value}</p>
                </div>
                <div className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.bg}`}>
                  <kpi.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Goal Progress */}
      <Card className="border-border/40">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <Target className="h-4 w-4 text-primary" /> Meta Mensal de Vendas
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Meta (R$):</Label>
                <Input
                  type="number"
                  value={monthlyGoal}
                  onChange={(e) => setMonthlyGoal(Number(e.target.value) || 0)}
                  className="w-40 border-border/40 bg-card/50 text-sm"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold text-primary">{stats.goalProgress.toFixed(1)}%</span>
                </div>
                <Progress value={stats.goalProgress} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(stats.monthlySales)} vendido</span>
                  <span>Meta: {formatCurrency(monthlyGoal)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent accepted proposals */}
      <Card className="border-border/40">
        <CardContent className="p-4 sm:p-6">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">Vendas Fechadas</h3>
          {proposals.filter((p: any) => p.status === "aceita").length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma venda fechada ainda.</p>
          ) : (
            <div className="space-y-2">
              {proposals.filter((p: any) => p.status === "aceita").map((p: any) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/30 p-3 hover:bg-muted/20 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{p.db_properties?.title || "Imóvel"}</p>
                    <p className="text-xs text-muted-foreground truncate">Cliente: {p.broker_leads?.name || "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-emerald-400">{formatCurrency(p.proposed_value)}</p>
                    <p className="text-[10px] text-muted-foreground">Comissão: {formatCurrency(p.proposed_value * (commissionRate / 100))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionsTab;
