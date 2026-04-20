import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell, UserPlus, FileText, CalendarDays, CheckSquare,
  AlertTriangle, TrendingUp, Clock,
} from "lucide-react";
import CrmHero from "./CrmHero";

interface Notification {
  id: string;
  type: "lead_new" | "lead_status" | "proposal" | "task_due" | "visit_upcoming";
  title: string;
  description: string;
  date: Date;
  icon: any;
  color: string;
  read: boolean;
}

const NotificationsTab = () => {
  const { brokerId, role } = useAuth();

  const { data: leads = [] } = useQuery({
    queryKey: ["notif-leads", brokerId],
    queryFn: async () => {
      const q = supabase.from("broker_leads").select("id, name, status, created_at, updated_at").order("created_at", { ascending: false }).limit(50);
      if (role === "broker" && brokerId) q.eq("broker_id", brokerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["notif-proposals", brokerId],
    queryFn: async () => {
      const q = supabase.from("broker_proposals").select("*, broker_leads(name), db_properties(title)").order("updated_at", { ascending: false }).limit(30);
      if (role === "broker" && brokerId) q.eq("broker_id", brokerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["notif-tasks", brokerId],
    queryFn: async () => {
      const q = supabase.from("broker_tasks").select("*, broker_leads(name)").order("due_date", { ascending: true }).limit(30);
      if (role === "broker" && brokerId) q.eq("broker_id", brokerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  const { data: visits = [] } = useQuery({
    queryKey: ["notif-visits", brokerId],
    queryFn: async () => {
      const q = supabase.from("lead_property_visits").select("*, broker_leads(name), db_properties(title)").order("visit_date", { ascending: true }).limit(30);
      if (role === "broker" && brokerId) q.eq("broker_id", brokerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  const notifications: Notification[] = useMemo(() => {
    const notifs: Notification[] = [];
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    // New leads (last 3 days)
    leads.filter((l: any) => new Date(l.created_at) >= threeDaysAgo).forEach((l: any) => {
      notifs.push({
        id: `lead-new-${l.id}`,
        type: "lead_new",
        title: "Novo lead cadastrado",
        description: `${l.name} foi adicionado como novo lead.`,
        date: new Date(l.created_at),
        icon: UserPlus,
        color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
        read: false,
      });
    });

    // Leads that changed to "fechado" or "perdido" recently
    leads.filter((l: any) => (l.status === "fechado" || l.status === "perdido") && new Date(l.updated_at) >= threeDaysAgo).forEach((l: any) => {
      notifs.push({
        id: `lead-status-${l.id}`,
        type: "lead_status",
        title: l.status === "fechado" ? "🎉 Lead fechado!" : "Lead perdido",
        description: `${l.name} teve status alterado para ${l.status === "fechado" ? "Fechado" : "Perdido"}.`,
        date: new Date(l.updated_at),
        icon: l.status === "fechado" ? TrendingUp : AlertTriangle,
        color: l.status === "fechado" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-destructive bg-destructive/10 border-destructive/30",
        read: false,
      });
    });

    // Proposals updated recently
    proposals.filter((p: any) => new Date(p.updated_at) >= threeDaysAgo).forEach((p: any) => {
      const statusLabels: Record<string, string> = {
        enviada: "enviada", aceita: "aceita ✅", recusada: "recusada ❌", em_analise: "em análise",
      };
      if (p.status !== "rascunho") {
        notifs.push({
          id: `proposal-${p.id}`,
          type: "proposal",
          title: `Proposta ${statusLabels[p.status] || p.status}`,
          description: `Proposta para ${(p as any).broker_leads?.name || "lead"} — ${(p as any).db_properties?.title || "imóvel"}.`,
          date: new Date(p.updated_at),
          icon: FileText,
          color: "text-violet-400 bg-violet-500/10 border-violet-500/30",
          read: false,
        });
      }
    });

    // Tasks due soon (next 2 days) or overdue
    tasks.filter((t: any) => t.due_date && t.status !== "concluida" && t.status !== "cancelada").forEach((t: any) => {
      const dueDate = new Date(t.due_date);
      if (dueDate <= twoDaysFromNow) {
        const isOverdue = dueDate < now;
        notifs.push({
          id: `task-due-${t.id}`,
          type: "task_due",
          title: isOverdue ? "⚠️ Tarefa atrasada!" : "Tarefa vencendo em breve",
          description: `"${t.title}" ${isOverdue ? "está atrasada" : `vence em ${dueDate.toLocaleDateString("pt-BR")}`}.`,
          date: dueDate,
          icon: isOverdue ? AlertTriangle : CheckSquare,
          color: isOverdue ? "text-destructive bg-destructive/10 border-destructive/30" : "text-amber-400 bg-amber-500/10 border-amber-500/30",
          read: false,
        });
      }
    });

    // Visits upcoming (next 2 days)
    visits.filter((v: any) => v.status === "agendada").forEach((v: any) => {
      const visitDate = new Date(v.visit_date);
      if (visitDate >= now && visitDate <= twoDaysFromNow) {
        notifs.push({
          id: `visit-${v.id}`,
          type: "visit_upcoming",
          title: "Visita agendada",
          description: `Visita com ${(v as any).broker_leads?.name || "lead"} em ${(v as any).db_properties?.title || "imóvel"} — ${visitDate.toLocaleDateString("pt-BR")} às ${visitDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`,
          date: visitDate,
          icon: CalendarDays,
          color: "text-violet-400 bg-violet-500/10 border-violet-500/30",
          read: false,
        });
      }
    });

    return notifs.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [leads, proposals, tasks, visits]);

  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (diff < 0) {
      const futureMins = Math.abs(mins);
      const futureHours = Math.abs(hours);
      if (futureMins < 60) return `em ${futureMins}min`;
      if (futureHours < 24) return `em ${futureHours}h`;
      return `em ${Math.abs(days)}d`;
    }
    if (mins < 60) return `${mins}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  return (
    <div className="space-y-6">
      <CrmHero
        icon={Bell}
        title="Notificações"
        subtitle="Alertas de leads, tarefas, visitas e propostas"
        accent="destructive"
        actions={
          <Badge variant="outline" className="border-primary/40 text-primary">
            {notifications.length} alertas
          </Badge>
        }
      />

      {notifications.length === 0 ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-semibold">Tudo em dia!</p>
              <p className="mt-1 text-sm text-muted-foreground">Nenhuma notificação recente.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card key={notif.id} className="border-border/30 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-md">
              <CardContent className="flex items-start gap-3 p-3 sm:p-4">
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${notif.color}`}>
                  <notif.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{notif.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{notif.description}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatRelativeDate(notif.date)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsTab;
