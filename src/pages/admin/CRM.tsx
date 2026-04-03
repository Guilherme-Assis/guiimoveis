import { useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { toast } from "@/hooks/use-toast";
import {
  Plus, Search, Phone, Mail, DollarSign, MapPin,
  Trash2, Edit, Eye, Filter, Users, TrendingUp, UserCheck, UserX,
  Sparkles, Clock, CheckSquare, CalendarDays, FileText, Calendar,
  BarChart3, Columns3, Download, Award, MessageSquare
} from "lucide-react";
import LeadDetail from "@/components/crm/LeadDetail";
import TasksTab from "@/components/crm/TasksTab";
import VisitsTab from "@/components/crm/VisitsTab";
import ProposalsTab from "@/components/crm/ProposalsTab";
import CalendarTab from "@/components/crm/CalendarTab";
import DashboardTab from "@/components/crm/DashboardTab";
import KanbanTab from "@/components/crm/KanbanTab";

import ReportsTab from "@/components/crm/ReportsTab";
import CommissionsTab from "@/components/crm/CommissionsTab";
import MessageTemplatesTab from "@/components/crm/MessageTemplatesTab";
import ContractsTab from "@/components/crm/ContractsTab";
import BrokerPerformanceTab from "@/components/crm/BrokerPerformanceTab";

const statusLabels: Record<string, string> = {
  novo: "Novo", em_contato: "Em Contato", qualificado: "Qualificado",
  proposta: "Proposta", fechado: "Fechado", perdido: "Perdido",
};
const statusColors: Record<string, string> = {
  novo: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  em_contato: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  qualificado: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  proposta: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  fechado: "border-primary/40 bg-primary/10 text-primary",
  perdido: "border-destructive/40 bg-destructive/10 text-destructive",
};
const priorityLabels: Record<string, string> = { baixa: "Baixa", media: "Média", alta: "Alta" };
const priorityDots: Record<string, string> = { baixa: "bg-muted-foreground", media: "bg-amber-400", alta: "bg-destructive" };
const sourceLabels: Record<string, string> = {
  site: "Site", indicacao: "Indicação", portais: "Portais",
  redes_sociais: "Redes Sociais", telefone: "Telefone", outro: "Outro",
};
const formatCurrency = (v: number | null) => v ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

type CRMTab = "leads" | "tasks" | "visits" | "proposals" | "calendar" | "dashboard" | "kanban" | "reports" | "commissions" | "templates" | "contracts" | "performance";

const validTabs: CRMTab[] = ["dashboard", "leads", "kanban", "tasks", "visits", "proposals", "calendar", "reports", "commissions", "templates", "contracts", "performance"];

const CRM = () => {
  const { brokerId, role } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as CRMTab | null;
  const activeTab: CRMTab = tabParam && validTabs.includes(tabParam) ? tabParam : "dashboard";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [editLead, setEditLead] = useState<any>(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["broker-leads", brokerId],
    queryFn: async () => {
      const q = supabase.from("broker_leads").select("*").order("created_at", { ascending: false });
      if (role === "broker" && brokerId) q.eq("broker_id", brokerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("broker_leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-leads"] });
      toast({ title: "Lead excluído com sucesso" });
    },
  });

  const filtered = leads.filter((l: any) => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: leads.length,
    novos: leads.filter((l: any) => l.status === "novo").length,
    emContato: leads.filter((l: any) => l.status === "em_contato" || l.status === "qualificado").length,
    fechados: leads.filter((l: any) => l.status === "fechado").length,
  };

  if (selectedLead) {
    return <LeadDetail leadId={selectedLead} onBack={() => setSelectedLead(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">CRM</h1>
            <p className="font-body text-xs sm:text-sm text-muted-foreground">Gestão completa de leads, tarefas, visitas e propostas</p>
          </div>
        </div>
      </div>




      {/* Tab Content */}
      {activeTab === "leads" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Total de Leads", value: stats.total, icon: Users, gradient: "from-secondary to-secondary/60", iconColor: "text-foreground" },
              { label: "Novos", value: stats.novos, icon: TrendingUp, gradient: "from-sky-500/20 to-sky-600/10", iconColor: "text-sky-400" },
              { label: "Em Negociação", value: stats.emContato, icon: Clock, gradient: "from-amber-500/20 to-amber-600/10", iconColor: "text-amber-400" },
              { label: "Fechados", value: stats.fechados, icon: UserCheck, gradient: "from-primary/20 to-primary/5", iconColor: "text-primary" },
            ].map((stat) => (
              <Card key={stat.label} className="overflow-hidden border-border/40 transition-all hover:border-border/60">
                <CardContent className="p-3 sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-body text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">{stat.label}</p>
                      <p className="mt-1 sm:mt-2 font-display text-xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <div className={`flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                      <stat.icon className={`h-4 w-4 sm:h-6 sm:w-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters + New Lead */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nome, email ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className="border-border/40 bg-card/50 pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full border-border/40 bg-card/50 sm:w-48">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditLead(null); }}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 font-semibold shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" /> Novo Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border/50 bg-card">
                <DialogHeader><DialogTitle className="font-display text-xl">{editLead ? "Editar Lead" : "Novo Lead"}</DialogTitle></DialogHeader>
                <LeadForm brokerId={brokerId} isAdmin={role === "admin"} lead={editLead} onSuccess={() => { setShowForm(false); setEditLead(null); queryClient.invalidateQueries({ queryKey: ["broker-leads"] }); }} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Lead List */}
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Carregando leads...</p>
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed border-border/40">
              <CardContent className="flex flex-col items-center gap-4 py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary"><UserX className="h-8 w-8 text-muted-foreground/40" /></div>
                <div className="text-center">
                  <p className="font-display text-lg font-semibold text-foreground">Nenhum lead encontrado</p>
                  <p className="mt-1 text-sm text-muted-foreground">Cadastre seu primeiro lead clicando no botão acima</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((lead: any) => (
                <Card key={lead.id} className="group cursor-pointer border-border/30 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card hover:shadow-lg hover:shadow-primary/5" onClick={() => setSelectedLead(lead.id)}>
                  <CardContent className="flex items-start gap-3 p-3 sm:items-center sm:gap-4 sm:p-4">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 font-display text-base sm:text-lg font-bold text-primary">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
                        <p className="truncate font-display text-sm font-semibold text-foreground">{lead.name}</p>
                        <Badge variant="outline" className={`text-[10px] font-medium ${statusColors[lead.status]}`}>{statusLabels[lead.status]}</Badge>
                        <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${priorityDots[lead.priority]}`} />
                          {priorityLabels[lead.priority]}
                        </span>
                      </div>
                      <div className="mt-1 sm:mt-1.5 flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {lead.phone && <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-primary/60" />{lead.phone}</span>}
                        {lead.email && <span className="hidden sm:flex items-center gap-1.5"><Mail className="h-3 w-3 text-primary/60" />{lead.email}</span>}
                        {lead.interest_value && <span className="flex items-center gap-1.5 font-medium text-primary/80"><DollarSign className="h-3 w-3" />{formatCurrency(lead.interest_value)}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); setEditLead(lead); setShowForm(true); }}><Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm("Excluir este lead?")) deleteMutation.mutate(lead.id); }}><Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "dashboard" && <DashboardTab />}
      {activeTab === "kanban" && <KanbanTab />}
      {activeTab === "tasks" && <TasksTab />}
      {activeTab === "visits" && <VisitsTab />}
      {activeTab === "proposals" && <ProposalsTab />}
      {activeTab === "calendar" && <CalendarTab />}
      
      {activeTab === "reports" && <ReportsTab />}
      {activeTab === "commissions" && <CommissionsTab />}
      {activeTab === "templates" && <MessageTemplatesTab />}
      {activeTab === "contracts" && <ContractsTab />}
      {activeTab === "performance" && <BrokerPerformanceTab />}
    </div>
  );
};

/* ─── Lead Form ─── */
const LeadForm = ({ brokerId, lead, onSuccess, isAdmin }: { brokerId: string | null; lead?: any; onSuccess: () => void; isAdmin?: boolean }) => {
  const [selectedBrokerId, setSelectedBrokerId] = useState(lead?.broker_id || brokerId || "");
  const [form, setForm] = useState({
    name: lead?.name || "", email: lead?.email || "", phone: lead?.phone || "",
    interest_value: lead?.interest_value?.toString() || "",
    installment_value: lead?.installment_value?.toString() || "",
    preferred_neighborhoods: lead?.preferred_neighborhoods?.join(", ") || "",
    property_type_interest: lead?.property_type_interest || "",
    source: lead?.source || "outro", status: lead?.status || "novo",
    priority: lead?.priority || "media", notes: lead?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const { data: brokers = [] } = useQuery({
    queryKey: ["brokers-list"],
    queryFn: async () => { const { data, error } = await supabase.from("brokers").select("id, company_name, creci"); if (error) throw error; return data; },
    enabled: !!isAdmin,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalBrokerId = isAdmin ? selectedBrokerId : brokerId;
    if (!form.name.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    if (!finalBrokerId) { toast({ title: "Selecione um corretor", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      broker_id: finalBrokerId, name: form.name.trim(), email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      interest_value: form.interest_value ? parseFloat(form.interest_value) : null,
      installment_value: form.installment_value ? parseFloat(form.installment_value) : null,
      preferred_neighborhoods: form.preferred_neighborhoods ? form.preferred_neighborhoods.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      property_type_interest: form.property_type_interest.trim() || null,
      source: form.source as any, status: form.status as any, priority: form.priority as any,
      notes: form.notes.trim() || null,
    };
    try {
      if (lead) {
        const { error } = await supabase.from("broker_leads").update(payload).eq("id", lead.id);
        if (error) throw error;
        toast({ title: "Lead atualizado!" });
      } else {
        const { error } = await supabase.from("broker_leads").insert(payload);
        if (error) throw error;
        toast({ title: "Lead cadastrado!" });
      }
      onSuccess();
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isAdmin && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Corretor *</Label>
          <Select value={selectedBrokerId} onValueChange={setSelectedBrokerId}>
            <SelectTrigger className="border-border/40"><SelectValue placeholder="Selecione o corretor" /></SelectTrigger>
            <SelectContent>{brokers.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.company_name || b.creci}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nome *</Label>
        <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Nome completo do lead" className="border-border/40" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Email</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@exemplo.com" className="border-border/40" /></div>
        <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Telefone</Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(11) 99999-9999" className="border-border/40" /></div>
      </div>
      <div className="rounded-lg border border-border/30 bg-secondary/30 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interesse Financeiro</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Valor (R$)</Label><Input type="number" value={form.interest_value} onChange={(e) => update("interest_value", e.target.value)} placeholder="500.000" className="border-border/40" /></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Parcelas (R$)</Label><Input type="number" value={form.installment_value} onChange={(e) => update("installment_value", e.target.value)} placeholder="3.000" className="border-border/40" /></div>
        </div>
      </div>
      <div className="space-y-1.5"><Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bairros</Label><Input value={form.preferred_neighborhoods} onChange={(e) => update("preferred_neighborhoods", e.target.value)} placeholder="Jardins, Moema, Vila Mariana" className="border-border/40" /><p className="text-[11px] text-muted-foreground/60">Separe por vírgula</p></div>
      <div className="space-y-1.5"><Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tipo de Imóvel</Label><Input value={form.property_type_interest} onChange={(e) => update("property_type_interest", e.target.value)} placeholder="Apartamento 3 quartos, casa com piscina..." className="border-border/40" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Origem</Label><Select value={form.source} onValueChange={(v) => update("source", v)}><SelectTrigger className="border-border/40"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(sourceLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Status</Label><Select value={form.status} onValueChange={(v) => update("status", v)}><SelectTrigger className="border-border/40"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Prioridade</Label><Select value={form.priority} onValueChange={(v) => update("priority", v)}><SelectTrigger className="border-border/40"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(priorityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Observações</Label><Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Anotações gerais..." rows={3} className="border-border/40" /></div>
      <Button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-primary to-primary/80 font-semibold shadow-lg shadow-primary/20">
        {saving ? "Salvando..." : lead ? "Atualizar Lead" : "Cadastrar Lead"}
      </Button>
    </form>
  );
};

export default CRM;
