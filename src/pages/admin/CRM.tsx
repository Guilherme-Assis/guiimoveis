import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Phone, Mail, User, DollarSign, MapPin, MessageSquare, Trash2, Edit, Eye, Filter } from "lucide-react";
import LeadDetail from "@/components/crm/LeadDetail";

const statusLabels: Record<string, string> = {
  novo: "Novo",
  em_contato: "Em Contato",
  qualificado: "Qualificado",
  proposta: "Proposta",
  fechado: "Fechado",
  perdido: "Perdido",
};

const statusColors: Record<string, string> = {
  novo: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  em_contato: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  qualificado: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  proposta: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  fechado: "bg-green-500/20 text-green-400 border-green-500/30",
  perdido: "bg-red-500/20 text-red-400 border-red-500/30",
};

const priorityLabels: Record<string, string> = { baixa: "Baixa", media: "Média", alta: "Alta" };
const priorityColors: Record<string, string> = {
  baixa: "bg-muted text-muted-foreground",
  media: "bg-yellow-500/20 text-yellow-400",
  alta: "bg-red-500/20 text-red-400",
};

const sourceLabels: Record<string, string> = {
  site: "Site", indicacao: "Indicação", portais: "Portais", redes_sociais: "Redes Sociais", telefone: "Telefone", outro: "Outro",
};

const formatCurrency = (v: number | null) => v ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

const CRM = () => {
  const { brokerId, role } = useAuth();
  const queryClient = useQueryClient();
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
      toast({ title: "Lead excluído" });
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
    emContato: leads.filter((l: any) => l.status === "em_contato").length,
    fechados: leads.filter((l: any) => l.status === "fechado").length,
  };

  if (selectedLead) {
    return <LeadDetail leadId={selectedLead} onBack={() => setSelectedLead(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">CRM</h1>
          <p className="font-body text-sm text-muted-foreground">Gerencie seus leads e vendas</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Lead</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editLead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
            </DialogHeader>
            <LeadForm
              brokerId={brokerId}
              isAdmin={role === "admin"}
              lead={editLead}
              lead={editLead}
              onSuccess={() => {
                setShowForm(false);
                setEditLead(null);
                queryClient.invalidateQueries({ queryKey: ["broker-leads"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{stats.total}</p><p className="text-xs text-muted-foreground">Total de Leads</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-400">{stats.novos}</p><p className="text-xs text-muted-foreground">Novos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-400">{stats.emContato}</p><p className="text-xs text-muted-foreground">Em Contato</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-400">{stats.fechados}</p><p className="text-xs text-muted-foreground">Fechados</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, email ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48"><Filter className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Lead list */}
      {isLoading ? (
        <p className="text-center text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><User className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" /><p className="text-muted-foreground">Nenhum lead encontrado</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead: any) => (
            <Card key={lead.id} className="transition-colors hover:border-primary/30">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
                  {lead.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-foreground">{lead.name}</p>
                    <Badge variant="outline" className={statusColors[lead.status]}>{statusLabels[lead.status]}</Badge>
                    <Badge variant="outline" className={priorityColors[lead.priority]}>{priorityLabels[lead.priority]}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                    {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
                    {lead.interest_value && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatCurrency(lead.interest_value)}</span>}
                    {lead.preferred_neighborhoods?.length > 0 && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.preferred_neighborhoods.join(", ")}</span>}
                    <span className="text-muted-foreground/60">{sourceLabels[lead.source]}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedLead(lead.id)} title="Ver detalhes"><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditLead(lead); setShowForm(true); }} title="Editar"><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm("Excluir este lead?")) deleteMutation.mutate(lead.id); }} title="Excluir" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Lead form component
const LeadForm = ({ brokerId, lead, onSuccess, isAdmin }: { brokerId: string | null; lead?: any; onSuccess: () => void; isAdmin?: boolean }) => {
  const [selectedBrokerId, setSelectedBrokerId] = useState(lead?.broker_id || brokerId || "");
  const [form, setForm] = useState({
    name: lead?.name || "",
    email: lead?.email || "",
    phone: lead?.phone || "",
    interest_value: lead?.interest_value?.toString() || "",
    installment_value: lead?.installment_value?.toString() || "",
    preferred_neighborhoods: lead?.preferred_neighborhoods?.join(", ") || "",
    property_type_interest: lead?.property_type_interest || "",
    source: lead?.source || "outro",
    status: lead?.status || "novo",
    priority: lead?.priority || "media",
    notes: lead?.notes || "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalBrokerId = isAdmin ? selectedBrokerId : brokerId;
    if (!form.name.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    if (!finalBrokerId) { toast({ title: "Selecione um corretor", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      broker_id: finalBrokerId,
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      interest_value: form.interest_value ? parseFloat(form.interest_value) : null,
      installment_value: form.installment_value ? parseFloat(form.installment_value) : null,
      preferred_neighborhoods: form.preferred_neighborhoods ? form.preferred_neighborhoods.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      property_type_interest: form.property_type_interest.trim() || null,
      source: form.source as any,
      status: form.status as any,
      priority: form.priority as any,
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
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isAdmin && (
        <div>
          <Label>Corretor *</Label>
          <Select value={selectedBrokerId} onValueChange={setSelectedBrokerId}>
            <SelectTrigger><SelectValue placeholder="Selecione o corretor" /></SelectTrigger>
            <SelectContent>
              {brokers.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.company_name || b.creci}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Nome do lead" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@exemplo.com" /></div>
        <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(11) 99999-9999" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Valor de Interesse (R$)</Label><Input type="number" value={form.interest_value} onChange={(e) => update("interest_value", e.target.value)} placeholder="500000" /></div>
        <div><Label>Valor de Parcelas (R$)</Label><Input type="number" value={form.installment_value} onChange={(e) => update("installment_value", e.target.value)} placeholder="3000" /></div>
      </div>
      <div><Label>Bairros de Preferência</Label><Input value={form.preferred_neighborhoods} onChange={(e) => update("preferred_neighborhoods", e.target.value)} placeholder="Jardins, Moema, Vila Mariana" /><p className="mt-1 text-xs text-muted-foreground">Separe por vírgula</p></div>
      <div><Label>Tipo de Imóvel de Interesse</Label><Input value={form.property_type_interest} onChange={(e) => update("property_type_interest", e.target.value)} placeholder="Apartamento 3 quartos, casa com piscina..." /></div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Origem</Label>
          <Select value={form.source} onValueChange={(v) => update("source", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(sourceLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => update("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Prioridade</Label>
          <Select value={form.priority} onValueChange={(v) => update("priority", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(priorityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Anotações gerais sobre o lead..." rows={3} /></div>
      <Button type="submit" disabled={saving} className="w-full">{saving ? "Salvando..." : lead ? "Atualizar Lead" : "Cadastrar Lead"}</Button>
    </form>
  );
};

export default CRM;
