import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Eye, TrendingUp } from "lucide-react";
import { useState } from "react";

const PropertyViewsChart = () => {
  const [period, setPeriod] = useState(30);

  const { data: viewData = [], isLoading } = useQuery({
    queryKey: ["property-views-analytics", period],
    queryFn: async () => {
      // Get view counts
      const { data: views, error } = await supabase
        .from("property_views")
        .select("property_id, created_at")
        .gte("created_at", new Date(Date.now() - period * 86400000).toISOString());
      if (error) throw error;

      // Count per property
      const counts: Record<string, number> = {};
      (views || []).forEach((v: any) => {
        counts[v.property_id] = (counts[v.property_id] || 0) + 1;
      });

      // Get top 10 property details
      const topIds = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([id]) => id);

      if (topIds.length === 0) return [];

      const { data: properties } = await supabase
        .from("db_properties")
        .select("id, title, city, slug")
        .in("id", topIds);

      return topIds.map((id) => {
        const prop = properties?.find((p: any) => p.id === id);
        return {
          name: prop?.title?.substring(0, 25) + (prop?.title && prop.title.length > 25 ? "…" : "") || "—",
          city: prop?.city || "",
          views: counts[id],
        };
      });
    },
  });

  // Views over time (daily)
  const { data: dailyViews = [] } = useQuery({
    queryKey: ["property-views-daily", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_views")
        .select("created_at")
        .gte("created_at", new Date(Date.now() - period * 86400000).toISOString());
      if (error) throw error;

      const days: Record<string, number> = {};
      (data || []).forEach((v: any) => {
        const day = new Date(v.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
        days[day] = (days[day] || 0) + 1;
      });

      return Object.entries(days)
        .slice(-14)
        .map(([name, views]) => ({ name, views }));
    },
  });

  const totalViews = viewData.reduce((s, d) => s + d.views, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">Analytics de Visualização</h3>
        </div>
        <div className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={`px-3 py-1 font-body text-xs rounded transition-colors ${
                period === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Views</p>
              <p className="font-display text-xl font-bold">{totalViews}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Imóveis Vistos</p>
              <p className="font-display text-xl font-bold">{viewData.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 col-span-2 sm:col-span-1">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Eye className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Média/Imóvel</p>
              <p className="font-display text-xl font-bold">
                {viewData.length > 0 ? (totalViews / viewData.length).toFixed(1) : "0"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily views chart */}
      {dailyViews.length > 0 && (
        <Card className="border-border/40">
          <CardContent className="p-5">
            <h4 className="mb-4 font-display text-sm font-semibold text-foreground">Visualizações por Dia</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyViews} barCategoryGap="28%" margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="dailyViewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.88} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.42} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.18}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={30}
                />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    boxShadow: "0 12px 32px -16px hsl(var(--foreground) / 0.24)",
                    padding: "10px 12px",
                  }}
                  labelStyle={{
                    color: "hsl(var(--muted-foreground))",
                    fontSize: 10,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                  itemStyle={{
                    color: "hsl(var(--foreground))",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: 0,
                  }}
                  formatter={(value: number) => [String(value), "Visualizações"]}
                />
                <Bar
                  dataKey="views"
                  fill="url(#dailyViewsGradient)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={28}
                  activeBar={{
                    fill: "hsl(var(--primary))",
                    fillOpacity: 0.92,
                    stroke: "hsl(var(--primary))",
                    strokeOpacity: 0.16,
                    strokeWidth: 6,
                    radius: [8, 8, 0, 0],
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top properties */}
      <Card className="border-border/40">
        <CardContent className="p-5">
          <h4 className="mb-4 font-display text-sm font-semibold text-foreground">Imóveis Mais Vistos</h4>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : viewData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma visualização registrada neste período.</p>
          ) : (
            <div className="space-y-2">
              {viewData.map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded border border-border/30 p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.city}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    <Eye className="mr-1 h-3 w-3" />
                    {item.views}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyViewsChart;
