import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Users, TrendingUp, Eye } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) => (
  <div className="border border-border bg-card p-6">
    <div className="flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="font-body text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-3xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  </div>
);

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

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
      <p className="mb-6 sm:mb-8 font-body text-xs sm:text-sm text-muted-foreground">
        {role === "admin" ? "Visão geral da plataforma" : "Seus imóveis cadastrados"}
      </p>

      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Building2} label="Total de Imóveis" value={stats.total} color="bg-primary/10 text-primary" />
        <StatCard icon={Eye} label="Disponíveis" value={stats.available} color="bg-green-500/10 text-green-500" />
        <StatCard icon={TrendingUp} label="Indisponíveis" value={stats.unavailable} color="bg-destructive/10 text-destructive" />
        {role === "admin" && (
          <StatCard icon={Users} label="Corretores" value={stats.brokers} color="bg-blue-500/10 text-blue-500" />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
