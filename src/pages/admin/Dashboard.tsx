import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Users, TrendingUp, Eye, ArrowUpRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const StatCard = ({
  icon: Icon,
  label,
  value,
  accent,
  href,
}: {
  icon: any;
  label: string;
  value: number | string;
  accent: string;
  href?: string;
}) => {
  const content = (
    <Card className="group relative overflow-hidden border-border/40 bg-card transition-all duration-500 hover:border-primary/40 hover:shadow-[var(--shadow-gold)]">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent}`} />
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-0" />
      <CardContent className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-body text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 sm:mt-3 font-display text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              {value}
            </p>
          </div>
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-gradient-to-br from-primary/15 to-primary/5 text-primary transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {href && (
          <div className="mt-4 flex items-center gap-1 text-[10px] sm:text-xs font-medium uppercase tracking-wider text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Ver detalhes <ArrowUpRight className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );
  return href ? <Link to={href}>{content}</Link> : content;
};

const Dashboard = () => {
  const { role, brokerId } = useAuth();
  const [stats, setStats] = useState({ total: 0, available: 0, unavailable: 0, brokers: 0 });

  useEffect(() => {
    const load = async () => {
      let query = supabase.from("db_properties").select("availability", { count: "exact" });
      if (role === "broker" && brokerId) {
        query = query.eq("broker_id", brokerId);
      }
      const { data } = await query;
      const available = data?.filter((p) => p.availability === "available").length || 0;
      const total = data?.length || 0;

      let brokerCount = 0;
      if (role === "admin") {
        const { count } = await supabase.from("brokers").select("*", { count: "exact", head: true });
        brokerCount = count || 0;
      }

      setStats({ total, available, unavailable: total - available, brokers: brokerCount });
    };
    load();
  }, [role, brokerId]);

  const availabilityRate = stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-charcoal-deep p-6 sm:p-8">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/5 to-transparent" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-body text-[10px] sm:text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Painel KORRETORA
            </span>
          </div>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-2 max-w-xl font-body text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {role === "admin"
              ? "Visão geral consolidada da plataforma — imóveis, corretores e desempenho da rede."
              : "Acompanhe seus imóveis cadastrados e a performance do seu portfólio."}
          </p>
          <div className="luxury-divider mt-6" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:gap-5 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Total de Imóveis"
          value={stats.total}
          accent="from-transparent via-primary to-transparent"
          href="/admin/properties"
        />
        <StatCard
          icon={Eye}
          label="Disponíveis"
          value={stats.available}
          accent="from-transparent via-emerald-400 to-transparent"
        />
        <StatCard
          icon={TrendingUp}
          label={`Taxa de Ocupação`}
          value={`${availabilityRate}%`}
          accent="from-transparent via-sky-400 to-transparent"
        />
        {role === "admin" ? (
          <StatCard
            icon={Users}
            label="Corretores Ativos"
            value={stats.brokers}
            accent="from-transparent via-primary to-transparent"
            href="/admin/brokers"
          />
        ) : (
          <StatCard
            icon={Users}
            label="Indisponíveis"
            value={stats.unavailable}
            accent="from-transparent via-destructive to-transparent"
          />
        )}
      </div>

      {/* Insight panel */}
      <Card className="border-border/40 bg-gradient-to-br from-card to-charcoal-deep">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base sm:text-lg font-semibold text-foreground">
                Status do Portfólio
              </h2>
              <p className="mt-1 font-body text-xs text-muted-foreground">
                {stats.available} de {stats.total} imóveis disponíveis no mercado
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-gradient-gold">
                {availabilityRate}%
              </span>
              <span className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                ocupação
              </span>
            </div>
          </div>
          <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-gradient-to-r from-primary to-gold-light transition-all duration-1000 ease-out"
              style={{ width: `${availabilityRate}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
