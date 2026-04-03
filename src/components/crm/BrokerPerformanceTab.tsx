import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star, Eye, FileText, TrendingUp } from "lucide-react";

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const BrokerPerformanceTab = () => {
  const { role } = useAuth();

  const { data: brokers = [] } = useQuery({
    queryKey: ["perf-brokers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brokers").select("id, company_name, creci, user_id");
      if (error) throw error;
      return data;
    },
    enabled: role === "admin",
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["perf-proposals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("broker_proposals").select("broker_id, status, proposed_value");
      if (error) throw error;
      return data;
    },
    enabled: role === "admin",
  });

  const { data: visits = [] } = useQuery({
    queryKey: ["perf-visits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lead_property_visits").select("broker_id, status");
      if (error) throw error;
      return data;
    },
    enabled: role === "admin",
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["perf-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("broker_reviews").select("broker_id, rating");
      if (error) throw error;
      return data;
    },
    enabled: role === "admin",
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["perf-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("broker_leads").select("broker_id, status");
      if (error) throw error;
      return data;
    },
    enabled: role === "admin",
  });

  // Build performance data per broker
  const performance = brokers.map((broker: any) => {
    const bProposals = proposals.filter((p: any) => p.broker_id === broker.id);
    const accepted = bProposals.filter((p: any) => p.status === "aceita");
    const totalSales = accepted.reduce((s: number, p: any) => s + (p.proposed_value || 0), 0);
    const bVisits = visits.filter((v: any) => v.broker_id === broker.id && v.status === "realizada").length;
    const bReviews = reviews.filter((r: any) => r.broker_id === broker.id);
    const avgRating = bReviews.length > 0 ? bReviews.reduce((s: number, r: any) => s + r.rating, 0) / bReviews.length : 0;
    const bLeads = leads.filter((l: any) => l.broker_id === broker.id);
    const closedLeads = bLeads.filter((l: any) => l.status === "fechado").length;
    const conversionRate = bLeads.length > 0 ? (closedLeads / bLeads.length) * 100 : 0;

    return {
      id: broker.id,
      name: broker.company_name || broker.creci,
      totalSales,
      acceptedCount: accepted.length,
      visitsCount: bVisits,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: bReviews.length,
      leadsCount: bLeads.length,
      closedCount: closedLeads,
      conversionRate: Math.round(conversionRate * 10) / 10,
    };
  }).sort((a, b) => b.totalSales - a.totalSales);

  const medals = [
    { icon: Trophy, color: "text-yellow-400", bg: "from-yellow-500/20 to-yellow-600/10" },
    { icon: Medal, color: "text-gray-300", bg: "from-gray-400/20 to-gray-500/10" },
    { icon: Medal, color: "text-amber-600", bg: "from-amber-700/20 to-amber-800/10" },
  ];

  if (role !== "admin") {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Relatório disponível apenas para administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Performance dos Corretores</h2>
        <p className="font-body text-sm text-muted-foreground">Ranking baseado em vendas, visitas e avaliações</p>
      </div>

      {performance.length === 0 ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <Trophy className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum corretor cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {performance.map((broker, idx) => {
            const medal = medals[idx];
            return (
              <Card key={broker.id} className="border-border/30 transition-all hover:border-border/60">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${medal?.bg || "from-secondary to-secondary/60"}`}>
                    {medal ? <medal.icon className={`h-5 w-5 ${medal.color}`} /> : <span className="font-display text-sm font-bold text-muted-foreground">{idx + 1}º</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-sm font-semibold text-foreground truncate">{broker.name}</p>
                      <Badge variant="outline" className="text-[10px]">{broker.leadsCount} leads</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-primary" />
                        {formatCurrency(broker.totalSales)} vendidos
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-amber-400" />
                        {broker.visitsCount} visitas
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400" />
                        {broker.avgRating > 0 ? `${broker.avgRating}/5` : "—"} ({broker.reviewCount})
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-emerald-400" />
                        {broker.conversionRate}% conversão
                      </span>
                    </div>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="font-display text-lg font-bold text-gradient-gold">{broker.acceptedCount}</p>
                    <p className="font-body text-[10px] text-muted-foreground">vendas</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrokerPerformanceTab;
