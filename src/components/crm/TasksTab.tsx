import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Phone, MapPin, FileText, Users as UsersIcon, Calendar,
  CheckCircle2, Circle, Clock, AlertTriangle, Trash2, Edit, ListChecks
} from "lucide-react";
import CrmHero from "./CrmHero";

const taskTypeLabels: Record<string, string> = {
  ligacao: "Ligação", visita: "Visita", documento: "Documento",
  reuniao: "Reunião", follow_up: "Follow-up", outro: "Outro",
};
const taskTypeIcons: Record<string, any> = {
  ligacao: Phone, visita: MapPin, documento: FileText,
  reuniao: UsersIcon, follow_up: Clock, outro: Circle,
};
const taskStatusLabels: Record<string, string> = {
  pendente: "Pendente", em_andamento: "Em Andamento", concluida: "Concluída", cancelada: "Cancelada",
};
const taskStatusIcons: Record<string, any> = {
  pendente: Circle, em_andamento: Clock, concluida: CheckCircle2, cancelada: AlertTriangle,
};
const taskStatusColors: Record<string, string> = {
  pendente: "text-sky-400", em_andamento: "text-amber-400", concluida: "text-primary", cancelada: "text-destructive",
};
const priorityLabels: Record<string, string> = { baixa: "Baixa", media: "Média", alta: "Alta" };
const priorityDots: Record<string, string> = { baixa: "bg-muted-foreground", media: "bg-amber-400", alta: "bg-destructive" };

const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const formatDateTime = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const isOverdue = (d: string | null, status: string) => {
  if (!d || status === "concluida" || status === "cancelada") return false;
  return new Date(d) < new Date();
};

const TasksTab = () => {
  const { brokerId, role } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);
  const [filter, setFilter] = useState<string>("active");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["broker-tasks", brokerId],
    queryFn: async () => {
      const q = supabase.from("broker_tasks").select("*, broker_leads(name)").order("due_date", { ascending: true, nullsFirst: false });
      if (role === "broker" && brokerId) q.eq("broker_id", brokerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["broker-leads-simple", brokerId],
    queryFn: async () => {
      const q = supabase.from("broker_leads").select("id, name");
      if (role === "broker" && brokerId) q.eq("broker_id", brokerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  const toggleComplete = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const update = completed
        ? { status: "concluida" as any, completed_at: new Date().toISOString() }
        : { status: "pendente" as any, completed_at: null };
      const { error } = await supabase.from("broker_tasks").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["broker-tasks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("broker_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-tasks"] });
      toast({ title: "Tarefa removida" });
    },
  });

  const filtered = tasks.filter((t: any) => {
    if (filter === "active") return t.status !== "concluida" && t.status !== "cancelada";
    if (filter === "completed") return t.status === "concluida";
    return true;
  });

  const overdueCount = tasks.filter((t: any) => isOverdue(t.due_date, t.status)).length;

  return (
    <div className="space-y-6">
      <CrmHero
        icon={ListChecks}
        title="Tarefas"
        subtitle="Gerencie follow-ups, ligações e atividades do dia"
        accent="sky"
        actions={
          <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditTask(null); }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 font-semibold shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md border-border/50 bg-card">
              <DialogHeader>
                <DialogTitle className="font-display">{editTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
              </DialogHeader>
              <TaskForm brokerId={brokerId} isAdmin={role === "admin"} task={editTask} leads={leads} onSuccess={() => { setShowForm(false); setEditTask(null); queryClient.invalidateQueries({ queryKey: ["broker-tasks"] }); }} />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters row */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40 border-border/40 bg-card/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativas ({tasks.filter((t: any) => t.status !== "concluida" && t.status !== "cancelada").length})</SelectItem>
            <SelectItem value="completed">Concluídas ({tasks.filter((t: any) => t.status === "concluida").length})</SelectItem>
            <SelectItem value="all">Todas ({tasks.length})</SelectItem>
          </SelectContent>
        </Select>
        {overdueCount > 0 && (
          <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive">
            <AlertTriangle className="mr-1 h-3 w-3" /> {overdueCount} atrasada{overdueCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma tarefa encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((task: any) => {
            const TypeIcon = taskTypeIcons[task.type] || Circle;
            const overdue = isOverdue(task.due_date, task.status);
            const done = task.status === "concluida";
            return (
              <Card key={task.id} className={`group border-border/30 transition-all hover:border-border/50 ${done ? "opacity-60" : ""} ${overdue ? "border-destructive/30" : ""}`}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Checkbox
                    checked={done}
                    onCheckedChange={(checked) => toggleComplete.mutate({ id: task.id, completed: !!checked })}
                    className="h-5 w-5 shrink-0 rounded-full border-2"
                  />
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <TypeIcon className="h-4 w-4 text-primary/70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`truncate text-sm font-semibold text-foreground ${done ? "line-through" : ""}`}>{task.title}</p>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${priorityDots[task.priority]}`} />
                        {priorityLabels[task.priority]}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      {task.due_date && (
                        <span className={`flex items-center gap-1 ${overdue ? "font-medium text-destructive" : ""}`}>
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(task.due_date)}
                          {overdue && " (atrasada)"}
                        </span>
                      )}
                      {task.broker_leads?.name && (
                        <span className="flex items-center gap-1">
                          <Circle className="h-2 w-2 fill-current" />
                          {task.broker_leads.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setEditTask(task); setShowForm(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { if (confirm("Excluir?")) deleteMutation.mutate(task.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

const TaskForm = ({ brokerId, isAdmin, task, leads, onSuccess }: any) => {
  const [form, setForm] = useState({
    title: task?.title || "", description: task?.description || "",
    type: task?.type || "outro", priority: task?.priority || "media",
    status: task?.status || "pendente", lead_id: task?.lead_id || "",
    due_date: task?.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : "",
  });
  const [saving, setSaving] = useState(false);

  const { data: brokers = [] } = useQuery({
    queryKey: ["brokers-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brokers").select("id, company_name, creci");
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });
  const [selectedBrokerId, setSelectedBrokerId] = useState(task?.broker_id || brokerId || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast({ title: "Título obrigatório", variant: "destructive" }); return; }
    const finalBrokerId = isAdmin ? selectedBrokerId : brokerId;
    if (!finalBrokerId) { toast({ title: "Selecione um corretor", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      broker_id: finalBrokerId, title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type as any, priority: form.priority as any, status: form.status as any,
      lead_id: form.lead_id || null,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      completed_at: form.status === "concluida" ? new Date().toISOString() : null,
    };
    try {
      if (task) {
        const { error } = await supabase.from("broker_tasks").update(payload).eq("id", task.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("broker_tasks").insert(payload);
        if (error) throw error;
      }
      toast({ title: task ? "Tarefa atualizada!" : "Tarefa criada!" });
      onSuccess();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isAdmin && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Corretor *</Label>
          <Select value={selectedBrokerId} onValueChange={setSelectedBrokerId}>
            <SelectTrigger className="border-border/40"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{brokers.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.company_name || b.creci}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Título *</Label>
        <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Ex: Ligar para cliente" className="border-border/40" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <Select value={form.type} onValueChange={(v) => update("type", v)}>
            <SelectTrigger className="border-border/40"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(taskTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Prioridade</Label>
          <Select value={form.priority} onValueChange={(v) => update("priority", v)}>
            <SelectTrigger className="border-border/40"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(priorityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Vencimento</Label>
          <Input type="datetime-local" value={form.due_date} onChange={(e) => update("due_date", e.target.value)} className="border-border/40" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Lead (opcional)</Label>
          <Select value={form.lead_id || "none"} onValueChange={(v) => update("lead_id", v === "none" ? "" : v)}>
            <SelectTrigger className="border-border/40"><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {leads.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Descrição</Label>
        <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Detalhes da tarefa..." rows={2} className="border-border/40" />
      </div>
      <Button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-primary to-primary/80 font-semibold">
        {saving ? "Salvando..." : task ? "Atualizar" : "Criar Tarefa"}
      </Button>
    </form>
  );
};

export default TasksTab;
