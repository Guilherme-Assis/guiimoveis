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
import { toast } from "@/hooks/use-toast";
import {
  Plus, DollarSign, FileText, Calendar, Trash2, Edit,
  CheckCircle2, XCircle, Clock, Send, Eye
} from "lucide-react";
import PdfProposalButton from "./PdfProposalButton";

const proposalStatusLabels: Record<string, string> = {
  rascunho: "Rascunho", enviada: "Enviada", em_analise: "Em Análise",
  aceita: "Aceita", recusada: "Recusada", expirada: "Expirada",
};
const proposalStatusColors: Record<string, string> = {
  rascunho: "border-muted-foreground/40 bg-muted/30 text-muted-foreground",
  enviada: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  em_analise: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  aceita: "border-primary/40 bg-primary/10 text-primary",
  recusada: "border-destructive/40 bg-destructive/10 text-destructive",
  expirada: "border-muted-foreground/40 bg-muted/20 text-muted-foreground",
};
const proposalStatusIcons: Record<string, any> = {
  rascunho: FileText, enviada: Send, em_analise: Clock,
  aceita: CheckCircle2, recusada: XCircle, expirada: Calendar,
};

const formatCurrency = (v: number | null) => v ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";
const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const ProposalsTab = () => {
  const { brokerId, role } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editProposal, setEditProposal] = useState<any>(null);

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["broker-proposals", brokerId],
    queryFn: async () => {
      const q = supabase.from("broker_proposals")
        .select("*, broker_leads(name), db_properties(title, price, city)")
        .order("created_at", { ascending: false });
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

  const { data: properties = [] } = useQuery({
    queryKey: ["properties-simple"],
    queryFn: async () => {
      const { data, error } = await supabase.from("db_properties").select("id, title, price, city").eq("availability", "available");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("broker_proposals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-proposals"] });
      toast({ title: "Proposta removida" });
    },
  });

  const totalValue = proposals.filter((p: any) => p.status === "aceita").reduce((sum: number, p: any) => sum + (p.proposed_value || 0), 0);
  const pendingCount = proposals.filter((p: any) => ["enviada", "em_analise"].includes(p.status)).length;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {totalValue > 0 && (
            <Badge variant="outline" className="border-primary/40 bg-primary/10 px-3 py-1 text-primary">
              <DollarSign className="mr-1 h-3 w-3" /> Vendas: {formatCurrency(totalValue)}
            </Badge>
          )}
          {pendingCount > 0 && (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300">
              <Clock className="mr-1 h-3 w-3" /> {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditProposal(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 font-semibold shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Nova Proposta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md border-border/50 bg-card">
            <DialogHeader><DialogTitle className="font-display">{editProposal ? "Editar Proposta" : "Nova Proposta"}</DialogTitle></DialogHeader>
            <ProposalForm brokerId={brokerId} isAdmin={role === "admin"} proposal={editProposal} leads={leads} properties={properties} onSuccess={() => { setShowForm(false); setEditProposal(null); queryClient.invalidateQueries({ queryKey: ["broker-proposals"] }); }} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : proposals.length === 0 ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <FileText className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma proposta registrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {proposals.map((proposal: any) => {
            const StatusIcon = proposalStatusIcons[proposal.status] || FileText;
            return (
              <Card key={proposal.id} className="group border-border/30 transition-all hover:border-border/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <StatusIcon className={`h-5 w-5 ${proposal.status === "aceita" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{proposal.db_properties?.title || "Imóvel"}</p>
                      <Badge variant="outline" className={`text-[10px] ${proposalStatusColors[proposal.status]}`}>{proposalStatusLabels[proposal.status]}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-primary">
                        <DollarSign className="h-3 w-3" />{formatCurrency(proposal.proposed_value)}
                      </span>
                      {proposal.counter_value && (
                        <span className="flex items-center gap-1 text-amber-400">
                          Contra: {formatCurrency(proposal.counter_value)}
                        </span>
                      )}
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{proposal.broker_leads?.name}</span>
                      {proposal.valid_until && (
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Válida até {formatDate(proposal.valid_until)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <PdfProposalButton data={{
                      leadName: proposal.broker_leads?.name || "Cliente",
                      propertyTitle: proposal.db_properties?.title || "Imóvel",
                      propertyCity: proposal.db_properties?.city,
                      propertyPrice: proposal.db_properties?.price,
                      proposedValue: proposal.proposed_value,
                      counterValue: proposal.counter_value,
                      conditions: proposal.conditions,
                      validUntil: proposal.valid_until,
                    }} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setEditProposal(proposal); setShowForm(true); }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { if (confirm("Excluir?")) deleteMutation.mutate(proposal.id); }}><Trash2 className="h-4 w-4" /></Button>
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

const ProposalForm = ({ brokerId, isAdmin, proposal, leads, properties, onSuccess }: any) => {
  const [form, setForm] = useState({
    lead_id: proposal?.lead_id || "", property_id: proposal?.property_id || "",
    proposed_value: proposal?.proposed_value?.toString() || "",
    counter_value: proposal?.counter_value?.toString() || "",
    status: proposal?.status || "rascunho",
    conditions: proposal?.conditions || "",
    valid_until: proposal?.valid_until || "",
  });
  const [saving, setSaving] = useState(false);
  const { data: brokers = [] } = useQuery({
    queryKey: ["brokers-list"], queryFn: async () => { const { data } = await supabase.from("brokers").select("id, company_name, creci"); return data || []; }, enabled: !!isAdmin,
  });
  const [selectedBrokerId, setSelectedBrokerId] = useState(proposal?.broker_id || brokerId || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalBrokerId = isAdmin ? selectedBrokerId : brokerId;
    if (!form.lead_id || !form.property_id || !form.proposed_value) { toast({ title: "Preencha lead, imóvel e valor", variant: "destructive" }); return; }
    if (!finalBrokerId) { toast({ title: "Selecione um corretor", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      broker_id: finalBrokerId, lead_id: form.lead_id, property_id: form.property_id,
      proposed_value: parseFloat(form.proposed_value),
      counter_value: form.counter_value ? parseFloat(form.counter_value) : null,
      status: form.status as any, conditions: form.conditions.trim() || null,
      valid_until: form.valid_until || null,
    };
    try {
      if (proposal) {
        const { error } = await supabase.from("broker_proposals").update(payload).eq("id", proposal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("broker_proposals").insert(payload);
        if (error) throw error;
      }
      toast({ title: proposal ? "Proposta atualizada!" : "Proposta criada!" }); onSuccess();
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Lead *</Label>
          <Select value={form.lead_id} onValueChange={(v) => setForm(p => ({ ...p, lead_id: v }))}>
            <SelectTrigger className="border-border/40"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{leads.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Imóvel *</Label>
          <Select value={form.property_id} onValueChange={(v) => setForm(p => ({ ...p, property_id: v }))}>
            <SelectTrigger className="border-border/40"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-lg border border-border/30 bg-secondary/30 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valores</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Valor da Proposta *</Label>
            <Input type="number" value={form.proposed_value} onChange={(e) => setForm(p => ({ ...p, proposed_value: e.target.value }))} placeholder="500000" className="border-border/40" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Contraproposta</Label>
            <Input type="number" value={form.counter_value} onChange={(e) => setForm(p => ({ ...p, counter_value: e.target.value }))} placeholder="480000" className="border-border/40" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
            <SelectTrigger className="border-border/40"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(proposalStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Válida até</Label>
          <Input type="date" value={form.valid_until} onChange={(e) => setForm(p => ({ ...p, valid_until: e.target.value }))} className="border-border/40" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Condições / Observações</Label>
        <Textarea value={form.conditions} onChange={(e) => setForm(p => ({ ...p, conditions: e.target.value }))} placeholder="Condições de pagamento, prazos, observações..." rows={2} className="border-border/40" />
      </div>
      <Button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-primary to-primary/80 font-semibold">
        {saving ? "Salvando..." : proposal ? "Atualizar" : "Criar Proposta"}
      </Button>
    </form>
  );
};

export default ProposalsTab;
