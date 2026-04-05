import { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  UserPlus, FileText, CalendarDays, CheckSquare,
  AlertTriangle, TrendingUp, Handshake,
} from "lucide-react";

export interface AppNotification {
  id: string;
  type: "lead_new" | "lead_status" | "proposal" | "task_due" | "visit_upcoming" | "partnership";
  title: string;
  description: string;
  date: Date;
  icon: any;
  color: string;
  link?: string;
}

const STORAGE_KEY = "elite-read-notifications";

const loadReadIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveReadIds = (ids: Set<string>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
};

export const useNotifications = () => {
  const { brokerId, role } = useAuth();
  const [readIds, setReadIds] = useState<Set<string>>(loadReadIds);

  useEffect(() => { saveReadIds(readIds); }, [readIds]);

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => { const next = new Set(prev); next.add(id); return next; });
  }, []);

  const markAllAsRead = useCallback((ids: string[]) => {
    setReadIds((prev) => { const next = new Set(prev); ids.forEach((id) => next.add(id)); return next; });
  }, []);

  const { data: leads = [] } = useQuery({
    queryKey: ["notif-leads", brokerId],
    queryFn: async () => {
      const q = supabase.from("broker_leads").select("*").order("created_at", { ascending: false }).limit(50);
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

  const { data: partnershipNotifs = [] } = useQuery({
    queryKey: ["notif-partnerships", brokerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partnerships")
        .select("*, db_properties(title), owner_broker:brokers!partnerships_owner_broker_id_fkey(company_name, creci), partner_broker:brokers!partnerships_partner_broker_id_fkey(company_name, creci)")
        .order("updated_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  const allNotifications: AppNotification[] = useMemo(() => {
    const notifs: AppNotification[] = [];
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    leads.filter((l: any) => new Date(l.created_at) >= threeDaysAgo).forEach((l: any) => {
      notifs.push({
        id: `lead-new-${l.id}`, type: "lead_new", title: "Novo lead cadastrado",
        description: `${l.name} foi adicionado.`,
        date: new Date(l.created_at), icon: UserPlus,
        color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
        link: "/admin/crm?tab=leads",
      });
    });

    leads.filter((l: any) => (l.status === "fechado" || l.status === "perdido") && new Date(l.updated_at) >= threeDaysAgo).forEach((l: any) => {
      notifs.push({
        id: `lead-status-${l.id}`, type: "lead_status",
        title: l.status === "fechado" ? "🎉 Lead fechado!" : "Lead perdido",
        description: `${l.name} → ${l.status === "fechado" ? "Fechado" : "Perdido"}.`,
        date: new Date(l.updated_at),
        icon: l.status === "fechado" ? TrendingUp : AlertTriangle,
        color: l.status === "fechado" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-destructive bg-destructive/10 border-destructive/30",
        link: "/admin/crm?tab=leads",
      });
    });

    proposals.filter((p: any) => new Date(p.updated_at) >= threeDaysAgo && p.status !== "rascunho").forEach((p: any) => {
      const labels: Record<string, string> = { enviada: "enviada", aceita: "aceita ✅", recusada: "recusada ❌", em_analise: "em análise" };
      notifs.push({
        id: `proposal-${p.id}`, type: "proposal",
        title: `Proposta ${labels[p.status] || p.status}`,
        description: `${(p as any).broker_leads?.name || "lead"} — ${(p as any).db_properties?.title || "imóvel"}.`,
        date: new Date(p.updated_at), icon: FileText,
        color: "text-violet-400 bg-violet-500/10 border-violet-500/30",
        link: "/admin/crm?tab=proposals",
      });
    });

    tasks.filter((t: any) => t.due_date && t.status !== "concluida" && t.status !== "cancelada").forEach((t: any) => {
      const dueDate = new Date(t.due_date);
      if (dueDate <= twoDaysFromNow) {
        const isOverdue = dueDate < now;
        notifs.push({
          id: `task-due-${t.id}`, type: "task_due",
          title: isOverdue ? "⚠️ Tarefa atrasada!" : "Tarefa vencendo",
          description: `"${t.title}" ${isOverdue ? "atrasada" : dueDate.toLocaleDateString("pt-BR")}.`,
          date: dueDate, icon: isOverdue ? AlertTriangle : CheckSquare,
          color: isOverdue ? "text-destructive bg-destructive/10 border-destructive/30" : "text-amber-400 bg-amber-500/10 border-amber-500/30",
          link: "/admin/crm?tab=tasks",
        });
      }
    });

    visits.filter((v: any) => v.status === "agendada").forEach((v: any) => {
      const visitDate = new Date(v.visit_date);
      if (visitDate >= now && visitDate <= twoDaysFromNow) {
        notifs.push({
          id: `visit-${v.id}`, type: "visit_upcoming", title: "Visita agendada",
          description: `${(v as any).broker_leads?.name || "lead"} — ${visitDate.toLocaleDateString("pt-BR")} ${visitDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`,
          date: visitDate, icon: CalendarDays,
          color: "text-violet-400 bg-violet-500/10 border-violet-500/30",
          link: "/admin/crm?tab=visits",
        });
      }
    });

    // Partnership notifications
    partnershipNotifs.filter((p: any) => new Date(p.updated_at) >= threeDaysAgo).forEach((p: any) => {
      const isOwner = p.owner_broker_id === brokerId;
      const isPartner = p.partner_broker_id === brokerId;
      const propTitle = (p as any).db_properties?.title || "Imóvel";
      const partnerName = (p as any).partner_broker?.company_name || (p as any).partner_broker?.creci || "Corretor";
      const ownerName = (p as any).owner_broker?.company_name || (p as any).owner_broker?.creci || "Corretor";

      if (p.status === "pendente" && isOwner) {
        notifs.push({
          id: `partnership-new-${p.id}`, type: "partnership",
          title: "🤝 Nova proposta de parceria!",
          description: `${partnerName} propôs parceria em "${propTitle}" (${p.commission_split_owner}%/${p.commission_split_partner}%).`,
          date: new Date(p.created_at), icon: Handshake,
          color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
          link: "/admin/crm?tab=partnerships",
        });
      }
      if (p.status === "aceita" && isPartner) {
        notifs.push({
          id: `partnership-accepted-${p.id}`, type: "partnership",
          title: "✅ Parceria aceita!",
          description: `${ownerName} aceitou sua parceria em "${propTitle}".`,
          date: new Date(p.updated_at), icon: Handshake,
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
          link: "/admin/crm?tab=partnerships",
        });
      }
      if (p.status === "recusada" && isPartner) {
        notifs.push({
          id: `partnership-rejected-${p.id}`, type: "partnership",
          title: "❌ Parceria recusada",
          description: `${ownerName} recusou a parceria em "${propTitle}".`,
          date: new Date(p.updated_at), icon: Handshake,
          color: "text-destructive bg-destructive/10 border-destructive/30",
          link: "/admin/crm?tab=partnerships",
        });
      }
      if (p.status === "ativa" && (isOwner || isPartner)) {
        notifs.push({
          id: `partnership-active-${p.id}`, type: "partnership",
          title: "🚀 Parceria ativada!",
          description: `Parceria em "${propTitle}" está ativa.`,
          date: new Date(p.updated_at), icon: Handshake,
          color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
          link: "/admin/crm?tab=partnerships",
        });
      }
      if (p.status === "concluida" && (isOwner || isPartner)) {
        notifs.push({
          id: `partnership-done-${p.id}`, type: "partnership",
          title: "🎉 Parceria concluída!",
          description: `Parceria em "${propTitle}" foi finalizada com sucesso.`,
          date: new Date(p.updated_at), icon: Handshake,
          color: "text-primary bg-primary/10 border-primary/30",
          link: "/admin/crm?tab=partnerships",
        });
      }
    });

    return notifs.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [leads, proposals, tasks, visits, partnershipNotifs, brokerId]);

  const unreadNotifications = useMemo(
    () => allNotifications.filter((n) => !readIds.has(n.id)),
    [allNotifications, readIds]
  );

  return {
    notifications: unreadNotifications,
    count: unreadNotifications.length,
    markAsRead,
    markAllAsRead,
  };
};

export const formatRelativeDate = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (diff < 0) {
    const fm = Math.abs(mins);
    const fh = Math.abs(hours);
    if (fm < 60) return `em ${fm}min`;
    if (fh < 24) return `em ${fh}h`;
    return `em ${Math.abs(days)}d`;
  }
  if (mins < 60) return `${mins}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  return `${days}d atrás`;
};
