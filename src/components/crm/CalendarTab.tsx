import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  ChevronLeft, ChevronRight, Bell, BellOff,
  Clock, MapPin, CheckSquare, CalendarDays, Phone, FileText
} from "lucide-react";
import CrmHero from "./CrmHero";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "task" | "visit";
  status: string;
  priority?: string;
  leadName?: string;
  propertyTitle?: string;
  description?: string;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const taskTypeIcons: Record<string, any> = {
  ligacao: Phone, visita: MapPin, documento: FileText,
  reuniao: CalendarDays, follow_up: Clock, outro: CheckSquare,
};

const CalendarTab = () => {
  const { brokerId } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [notifiedEvents, setNotifiedEvents] = useState<Set<string>>(new Set());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ["calendar-tasks", brokerId],
    queryFn: async () => {
      if (!brokerId) return [];
      const { data, error } = await supabase
        .from("broker_tasks")
        .select("*, broker_leads(name)")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!brokerId,
  });

  // Fetch visits
  const { data: visits = [] } = useQuery({
    queryKey: ["calendar-visits", brokerId],
    queryFn: async () => {
      if (!brokerId) return [];
      const { data, error } = await supabase
        .from("lead_property_visits")
        .select("*, broker_leads(name), db_properties(title)")
        .order("visit_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!brokerId,
  });

  // Convert to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    const taskEvents: CalendarEvent[] = tasks
      .filter((t: any) => t.due_date)
      .map((t: any) => ({
        id: `task-${t.id}`,
        title: t.title,
        date: new Date(t.due_date),
        type: "task" as const,
        status: t.status,
        priority: t.priority,
        leadName: t.broker_leads?.name,
        description: t.description,
      }));

    const visitEvents: CalendarEvent[] = visits.map((v: any) => ({
      id: `visit-${v.id}`,
      title: `Visita: ${v.db_properties?.title || "Imóvel"}`,
      date: new Date(v.visit_date),
      type: "visit" as const,
      status: v.status,
      leadName: v.broker_leads?.name,
      propertyTitle: v.db_properties?.title,
      description: v.feedback,
    }));

    return [...taskEvents, ...visitEvents].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }, [tasks, visits]);

  // Request notification permission & enable alerts
  const toggleAlerts = useCallback(async () => {
    if (!alertsEnabled) {
      if (!("Notification" in window)) {
        toast({ title: "Navegador não suporta notificações", variant: "destructive" });
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setAlertsEnabled(true);
        toast({ title: "🔔 Alertas ativados!", description: "Você receberá notificações 1h antes dos eventos." });
      } else {
        toast({ title: "Permissão negada", description: "Habilite notificações no navegador.", variant: "destructive" });
      }
    } else {
      setAlertsEnabled(false);
      toast({ title: "Alertas desativados" });
    }
  }, [alertsEnabled]);

  // Check for upcoming events every minute
  useEffect(() => {
    if (!alertsEnabled) return;
    const interval = setInterval(() => {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      events.forEach((event) => {
        if (
          event.date > now &&
          event.date <= oneHourFromNow &&
          !notifiedEvents.has(event.id)
        ) {
          new Notification(`⏰ Em 1h: ${event.title}`, {
            body: event.leadName
              ? `Cliente: ${event.leadName}`
              : event.type === "visit"
              ? "Visita agendada"
              : "Tarefa pendente",
            icon: "/placeholder.svg",
          });
          setNotifiedEvents((prev) => new Set([...prev, event.id]));
        }
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, [alertsEnabled, events, notifiedEvents]);

  // Calendar grid helpers
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      const d = e.date;
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const navigate = (dir: number) => {
    setCurrentDate(new Date(year, month + dir, 1));
    setSelectedDate(null);
  };

  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const isSelected = (day: number) =>
    selectedDate?.getFullYear() === year &&
    selectedDate?.getMonth() === month &&
    selectedDate?.getDate() === day;

  const selectedEvents = selectedDate
    ? events.filter((e) => {
        const d = e.date;
        return (
          d.getFullYear() === selectedDate.getFullYear() &&
          d.getMonth() === selectedDate.getMonth() &&
          d.getDate() === selectedDate.getDate()
        );
      })
    : [];

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return events.filter((e) => e.date >= now && e.date <= weekFromNow).slice(0, 8);
  }, [events]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const formatDateShort = (date: Date) =>
    date.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" });

  const statusColors: Record<string, string> = {
    pendente: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    em_andamento: "border-sky-500/40 bg-sky-500/10 text-sky-300",
    concluida: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    cancelada: "border-muted-foreground/40 bg-muted/20 text-muted-foreground",
    agendada: "border-violet-500/40 bg-violet-500/10 text-violet-300",
    realizada: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    no_show: "border-destructive/40 bg-destructive/10 text-destructive",
  };

  const statusLabels: Record<string, string> = {
    pendente: "Pendente", em_andamento: "Em andamento", concluida: "Concluída",
    cancelada: "Cancelada", agendada: "Agendada", realizada: "Realizada", no_show: "No-show",
  };

  return (
    <div className="space-y-6">
      <CrmHero
        icon={CalendarDays}
        title="Calendário"
        subtitle="Tarefas e visitas unificadas em uma agenda"
        accent="amber"
        actions={
          <Button
            variant={alertsEnabled ? "default" : "outline"}
            size="sm"
            onClick={toggleAlerts}
            className={alertsEnabled
              ? "bg-primary/20 border-primary/40 text-primary hover:bg-primary/30"
              : "border-border/40 hover:border-primary/40"
            }
          >
            {alertsEnabled ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
            {alertsEnabled ? "Alertas ativos" : "Ativar alertas"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2 bg-card/60 backdrop-blur border-border/30">
          <CardContent className="p-4 sm:p-6">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-primary/10">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h3 className="text-lg font-semibold text-foreground">
                {MONTHS[month]} {year}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => navigate(1)} className="hover:bg-primary/10">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDay(day);
                const hasTask = dayEvents.some((e) => e.type === "task");
                const hasVisit = dayEvents.some((e) => e.type === "visit");

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(new Date(year, month, day))}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all text-sm
                      ${isToday(day) ? "bg-primary/20 border border-primary/50 font-bold text-primary" : ""}
                      ${isSelected(day) ? "bg-primary/30 border border-primary ring-2 ring-primary/30" : ""}
                      ${!isToday(day) && !isSelected(day) ? "hover:bg-muted/40 text-foreground" : ""}
                    `}
                  >
                    <span>{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {hasTask && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                        {hasVisit && <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-4 pt-4 border-t border-border/20">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Tarefas
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-violet-400" /> Visitas
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar: upcoming or selected day events */}
        <div className="space-y-4">
          <Card className="bg-card/60 backdrop-blur border-border/30">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                {selectedDate ? (
                  <>
                    <CalendarDays className="h-4 w-4 text-primary" />
                    {selectedDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-primary" />
                    Próximos 7 dias
                  </>
                )}
              </h4>

              {(selectedDate ? selectedEvents : upcomingEvents).length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  Nenhum evento {selectedDate ? "neste dia" : "nos próximos 7 dias"}
                </p>
              ) : (
                <div className="space-y-2">
                  {(selectedDate ? selectedEvents : upcomingEvents).map((event) => {
                    const Icon = event.type === "visit" ? MapPin : (taskTypeIcons[event.status] || CheckSquare);
                    return (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg border transition-all hover:scale-[1.01] ${
                          event.type === "visit"
                            ? "border-violet-500/30 bg-violet-500/5"
                            : "border-amber-500/30 bg-amber-500/5"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`mt-0.5 p-1.5 rounded-md ${
                            event.type === "visit" ? "bg-violet-500/20 text-violet-300" : "bg-amber-500/20 text-amber-300"
                          }`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {event.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {!selectedDate && formatDateShort(event.date) + " · "}
                                {formatTime(event.date)}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${statusColors[event.status] || "border-border/40"}`}
                              >
                                {statusLabels[event.status] || event.status}
                              </Badge>
                            </div>
                            {event.leadName && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                👤 {event.leadName}
                              </p>
                            )}
                            {event.propertyTitle && (
                              <p className="text-xs text-muted-foreground truncate">
                                🏠 {event.propertyTitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="bg-card/60 backdrop-blur border-border/30">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Resumo do mês</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Tarefas",
                    count: events.filter((e) => e.type === "task").length,
                    color: "text-amber-400",
                    bg: "bg-amber-500/10",
                  },
                  {
                    label: "Visitas",
                    count: events.filter((e) => e.type === "visit").length,
                    color: "text-violet-400",
                    bg: "bg-violet-500/10",
                  },
                ].map((stat) => (
                  <div key={stat.label} className={`p-3 rounded-lg ${stat.bg}`}>
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.count}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarTab;
