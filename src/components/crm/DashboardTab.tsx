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
  Target, CheckCircle2, XCircle, BarChart3, PieChart as PieIcon,
  LineChart as LineIcon, Activity,
} from "lucide-react";
import ConversionFunnelChart from "@/components/crm/ConversionFunnelChart";
import PropertyViewsChart from "@/components/crm/PropertyViewsChart";

const COLORS = [
  "hsl(var(--primary))", "hsl(210, 70%, 55%)", "hsl(40, 85%, 55%)",
  "hsl(150, 60%, 45%)", "hsl(0, 65%, 55%)", "hsl(270, 50%, 55%)",
];

// Reusable luxury chart card wrapper
const ChartCard = ({
  icon: Icon, title, subtitle, children, accent = "gold",
}: {
  icon: any; title: string; subtitle?: string; children: React.ReactNode;
  accent?: "gold" | "sky" | "emerald" | "amber" | "violet";
}) => {
  const accentLine: Record<string, string> = {
    gold: "via-primary/60",
    sky: "via-sky-400/60",
    emerald: "via-emerald-400/60",
    amber: "via-amber-400/60",
    violet: "via-violet-400/60",
  };
  const iconBg: Record<string, string> = {
    gold: "from-primary/20 to-primary/5 text-primary border-primary/20",
    sky: "from-sky-500/20 to-sky-500/5 text-sky-300 border-sky-500/20",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-300 border-emerald-500/20",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-300 border-amber-500/20",
    violet: "from-violet-500/20 to-violet-500/5 text-violet-300 border-violet-500/20",
  };
  return (
    <Card className="group relative overflow-hidden border-border/40 bg-card transition-all duration-500 hover:border-primary/30 min-w-0">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${accentLine[accent]} to-transparent`} />
      <CardContent className="relative p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br ${iconBg[accent]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-sm font-semibold tracking-tight text-foreground truncate">{title}</h3>
            {subtitle && <p className="font-body text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 truncate">{subtitle}</p>}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
};

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
      const q = supabase.from("broker_tasks").select("id, status");
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
    { label: "Total de Leads", value: totalLeads, icon: Users, accent: "from-transparent via-sky-400 to-transparent" },
    { label: "Taxa de Conversão", value: `${conversionRate}%`, icon: Target, accent: "from-transparent via-primary to-transparent" },
    { label: "Vendas Aceitas", value: formatCurrency(totalSales), icon: DollarSign, accent: "from-transparent via-emerald-400 to-transparent" },
    { label: "Visitas Realizadas", value: totalVisits, icon: Eye, accent: "from-transparent via-amber-400 to-transparent" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* KPI Cards — luxury */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className="group relative overflow-hidden border-border/40 bg-card transition-all duration-500 hover:border-primary/40 hover:shadow-[var(--shadow-gold)]"
          >
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${kpi.accent}`} />
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <CardContent className="relative p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground truncate">
                    {kpi.label}
                  </p>
                  <p className="mt-2 sm:mt-3 font-display text-xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
                    {kpi.value}
                  </p>
                </div>
                <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-gradient-to-br from-primary/15 to-primary/5 text-primary transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <ChartCard icon={BarChart3} title="Leads por Mês" subtitle="Últimos 6 meses" accent="sky">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={leadsByMonth} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.25} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "hsl(var(--primary) / 0.05)" }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="leads" fill="hsl(210, 70%, 55%)" radius={[6, 6, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={PieIcon} title="Distribuição por Status" subtitle="Pipeline de leads" accent="gold">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="hsl(var(--card))"
                strokeWidth={2}
              >
                {statusDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(value) => <span className="text-muted-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <ChartCard icon={LineIcon} title="Propostas por Mês" subtitle="Total vs Aceitas" accent="emerald">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={proposalsByMonth} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.25} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="total" stroke="hsl(210, 70%, 55%)" strokeWidth={2.5} name="Total" dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="aceitas" stroke="hsl(var(--primary))" strokeWidth={2.5} name="Aceitas" dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={Activity} title="Status das Visitas" subtitle="Distribuição atual" accent="amber">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={visitDistribution} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.25} horizontal={false} />
              <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={80} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "hsl(var(--primary) / 0.05)" }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" fill="hsl(40, 85%, 55%)" radius={[0, 6, 6, 0]} name="Visitas" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Conversion Funnel */}
      <ConversionFunnelChart leads={leads} visits={visits} proposals={proposals} />

      {/* Property Views Analytics */}
      <PropertyViewsChart />

      {/* Quick stats footer — refined */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
        {[
          { icon: CheckCircle2, label: "Tarefas Concluídas", value: `${tasks.filter((t: any) => t.status === "concluida").length}/${tasks.length}`, color: "text-primary", bg: "from-primary/15 to-primary/5", border: "border-primary/20" },
          { icon: CalendarDays, label: "Visitas Agendadas", value: visits.filter((v: any) => v.status === "agendada").length, color: "text-amber-300", bg: "from-amber-500/15 to-amber-500/5", border: "border-amber-500/20" },
          { icon: XCircle, label: "Leads Perdidos", value: leads.filter((l: any) => l.status === "perdido").length, color: "text-destructive", bg: "from-destructive/15 to-destructive/5", border: "border-destructive/20" },
        ].map((s) => (
          <Card key={s.label} className="group border-border/40 transition-all duration-300 hover:border-primary/30">
            <CardContent className="flex items-center gap-3 p-4 sm:p-5">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br ${s.bg} ${s.border} ${s.color} transition-transform duration-300 group-hover:scale-110`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-body text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">{s.label}</p>
                <p className="mt-0.5 font-display text-lg sm:text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardTab;
