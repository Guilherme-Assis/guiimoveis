import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, DollarSign, Users, Eye, CalendarDays,
  Target, CheckCircle2, XCircle,
} from "lucide-react";
import ConversionFunnelChart from "@/components/crm/ConversionFunnelChart";
import PropertyViewsChart from "@/components/crm/PropertyViewsChart";

const COLORS = [
  "hsl(var(--primary))", "hsl(210, 70%, 55%)", "hsl(40, 85%, 55%)",
  "hsl(150, 60%, 45%)", "hsl(0, 65%, 55%)", "hsl(270, 50%, 55%)",
];

const statusLabels: Record<string, string> = {
  novo: "Novo", em_contato: "Em Contato", qualificado: "Qualificado",
  proposta: "Proposta", fechado: "Fechado", perdido: "Perdido",
};
const visitStatusLabels: Record<string, string> = {
  agendada: "Agendada", realizada: "Realizada", cancelada: "Cancelada", no_show: "No Show",
};

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const DashboardTab = () => {
  const { brokerId, role } = useAuth();

  const { data: leads = [] } = useQuery({
    queryKey: ["dash-leads", brokerId],
    queryFn: async () => {
      const q = supabase.from("broker_leads").select("id, status, created_at");
      if (role === "broker" && brokerId) q.eq("broker_id", brokerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["dash-proposals", brokerId],
    queryFn: async () => {
      const q = supabase.from("broker_proposals").select("id, status, proposed_value, created_at");
      if (role === "broker" && brokerId) q.eq("broker_id", brokerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  const { data: visits = [] } = useQuery({
    queryKey: ["dash-visits", brokerId],
    queryFn: async () => {
      const q = supabase.from("lead_property_visits").select("id, status");
      if (role === "broker" && brokerId) q.eq("broker_id", brokerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["dash-tasks", brokerId],
    queryFn: async () => {
      const q = supabase.from("broker_tasks").select("*");
      if (role === "broker" && brokerId) q.eq("broker_id", brokerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  // KPIs
  const totalLeads = leads.length;
  const closedLeads = leads.filter((l: any) => l.status === "fechado").length;
  const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : "0";
  const totalSales = proposals.filter((p: any) => p.status === "aceita").reduce((s: number, p: any) => s + (p.proposed_value || 0), 0);
  const totalVisits = visits.filter((v: any) => v.status === "realizada").length;

  // Leads by month (last 6 months)
  const leadsByMonth = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      months[key] = 0;
    }
    leads.forEach((l: any) => {
      const d = new Date(l.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in months) months[key]++;
    });
    return Object.entries(months).map(([key, count]) => {
      const [y, m] = key.split("-");
      const d = new Date(parseInt(y), parseInt(m) - 1);
      return { name: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""), leads: count };
    });
  }, [leads]);

  // Lead status distribution
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l: any) => { counts[l.status] = (counts[l.status] || 0) + 1; });
    return Object.entries(counts).map(([status, value]) => ({
      name: statusLabels[status] || status, value,
    }));
  }, [leads]);

  // Visit status distribution
  const visitDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    visits.forEach((v: any) => { counts[v.status] = (counts[v.status] || 0) + 1; });
    return Object.entries(counts).map(([status, value]) => ({
      name: visitStatusLabels[status] || status, value,
    }));
  }, [visits]);

  // Proposals over time
  const proposalsByMonth = useMemo(() => {
    const months: Record<string, { aceitas: number; total: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = { aceitas: 0, total: 0 };
    }
    proposals.forEach((p: any) => {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in months) {
        months[key].total++;
        if (p.status === "aceita") months[key].aceitas++;
      }
    });
    return Object.entries(months).map(([key]) => {
      const [y, m] = key.split("-");
      const d = new Date(parseInt(y), parseInt(m) - 1);
      return {
        name: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        total: months[key].total,
        aceitas: months[key].aceitas,
      };
    });
  }, [proposals]);

  const kpis = [
    { label: "Total de Leads", value: totalLeads, icon: Users, color: "text-sky-400", bg: "from-sky-500/20 to-sky-600/10" },
    { label: "Taxa de Conversão", value: `${conversionRate}%`, icon: Target, color: "text-primary", bg: "from-primary/20 to-primary/5" },
    { label: "Vendas Aceitas", value: formatCurrency(totalSales), icon: DollarSign, color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-600/10" },
    { label: "Visitas Realizadas", value: totalVisits, icon: Eye, color: "text-amber-400", bg: "from-amber-500/20 to-amber-600/10" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
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

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/40 min-w-0">
          <CardContent className="p-5">
            <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Leads por Mês</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={leadsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Status Pie */}
        <Card className="border-border/40">
          <CardContent className="p-5">
            <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Distribuição por Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Proposals by Month */}
        <Card className="border-border/40">
          <CardContent className="p-5">
            <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Propostas por Mês</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={proposalsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="hsl(210, 70%, 55%)" strokeWidth={2} name="Total" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="aceitas" stroke="hsl(var(--primary))" strokeWidth={2} name="Aceitas" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Visit Distribution */}
        <Card className="border-border/40">
          <CardContent className="p-5">
            <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Status das Visitas</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={visitDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={80} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="value" fill="hsl(40, 85%, 55%)" radius={[0, 4, 4, 0]} name="Visitas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <ConversionFunnelChart leads={leads} visits={visits} proposals={proposals} />

      {/* Property Views Analytics */}
      <PropertyViewsChart />

      {/* Quick stats footer */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Tarefas Concluídas</p>
              <p className="font-display text-base sm:text-lg font-bold">{tasks.filter((t: any) => t.status === "concluida").length}/{tasks.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <CalendarDays className="h-5 w-5 shrink-0 text-amber-400" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Visitas Agendadas</p>
              <p className="font-display text-base sm:text-lg font-bold">{visits.filter((v: any) => v.status === "agendada").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <XCircle className="h-5 w-5 shrink-0 text-destructive" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Leads Perdidos</p>
              <p className="font-display text-base sm:text-lg font-bold">{leads.filter((l: any) => l.status === "perdido").length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardTab;
