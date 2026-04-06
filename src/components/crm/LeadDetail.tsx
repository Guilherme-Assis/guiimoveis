import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";
import {
  ArrowLeft, Plus, Phone, Mail, DollarSign, MapPin, MessageSquare,
  Calendar, Trash2, User, Home, Sparkles
} from "lucide-react";

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
const interactionLabels: Record<string, string> = {
  ligacao: "Ligação", whatsapp: "WhatsApp", email: "Email",
  visita: "Visita", reuniao: "Reunião", outro: "Outro",
};
const interactionIcons: Record<string, any> = {
  ligacao: Phone, whatsapp: MessageSquare, email: Mail,
  visita: MapPin, reuniao: Calendar, outro: MessageSquare,
};

const formatCurrency = (v: number | null) =>
  v ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const stageLabels: Record<string, string> = {
  novo: "Novo", em_contato: "Em Contato", qualificado: "Qualificado",
  proposta: "Proposta", fechado: "Fechado", perdido: "Perdido",
};

const LeadTemplates = ({ leadStatus, brokerId }: { leadStatus: string; brokerId: string | null }) => {
  const { data: templates = [] } = useQuery({
    queryKey: ["lead-templates", brokerId, leadStatus],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("id, name, category, stage, subject, body")
        .eq("stage", leadStatus)
        .order("category");
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId,
  });

  const copyToClipboard = (t: any) => {
    const text = t.subject ? `Assunto: ${t.subject}\n\n${t.body}` : t.body;
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: `Template "${t.name}" copiado.` });
  };

  if (templates.length === 0) return null;

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <MessageSquare className="h-4 w-4 text-primary" />
          Templates para "{stageLabels[leadStatus] || leadStatus}"
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{templates.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {templates.map((t: any) => (
          <div key={t.id} className="group rounded-lg border border-border/20 bg-card/50 p-3 transition-colors hover:border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-md border ${t.category === "whatsapp" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-sky-500/40 bg-sky-500/10 text-sky-300"}`}>
                  {t.category === "whatsapp" ? <Phone className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                </div>
                <span className="text-sm font-medium text-foreground">{t.name}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => copyToClipboard(t)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            {t.subject && <p className="text-xs text-muted-foreground mb-1">Assunto: {t.subject}</p>}
            <pre className="whitespace-pre-wrap text-xs text-muted-foreground bg-muted/20 rounded-lg p-2 max-h-28 overflow-y-auto font-body leading-relaxed">{t.body}</pre>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const LeadDetail = ({ leadId, onBack }: { leadId: string; onBack: () => void }) => {
  const { brokerId } = useAuth();
  const queryClient = useQueryClient();
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [interactionType, setInteractionType] = useState("whatsapp");
  const [interactionDesc, setInteractionDesc] = useState("");
  const [nextContactDate, setNextContactDate] = useState("");

  const { data: lead } = useQuery({
    queryKey: ["broker-lead", leadId],
    queryFn: async () => {
      const { data, error } = await supabase.from("broker_leads").select("id, name, email, phone, status, source, priority, interest_value, installment_value, property_type_interest, preferred_neighborhoods, notes, created_at, updated_at").eq("id", leadId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ["lead-interactions", leadId],
    queryFn: async () => {
      const { data, error } = await supabase.from("broker_lead_interactions").select("*").eq("lead_id", leadId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addInteraction = useMutation({
    mutationFn: async () => {
      if (!interactionDesc.trim()) throw new Error("Descrição obrigatória");
      const { error } = await supabase.from("broker_lead_interactions").insert({
        lead_id: leadId,
        broker_id: brokerId!,
        type: interactionType as any,
        description: interactionDesc.trim(),
        next_contact_date: nextContactDate || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-interactions", leadId] });
      setInteractionDesc("");
      setNextContactDate("");
      setShowInteractionForm(false);
      toast({ title: "Interação registrada!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteInteraction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("broker_lead_interactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-interactions", leadId] });
      toast({ title: "Interação removida" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("broker_leads").update({ status: status as any }).eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["broker-leads"] });
      toast({ title: "Status atualizado!" });
    },
  });

  if (!lead) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Carregando detalhes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar ao CRM
      </Button>

      {/* Lead Header Card */}
      <Card className="overflow-hidden border-border/30">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/40 to-primary/10 font-display text-xl sm:text-2xl font-bold text-primary shadow-lg shadow-primary/10">
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">{lead.name}</h1>
                <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
                  <Badge variant="outline" className={`${statusColors[lead.status]} px-3 py-0.5 text-xs font-medium`}>
                    {statusLabels[lead.status]}
                  </Badge>
                  {lead.source && (
                    <span className="text-xs text-muted-foreground">
                      via <span className="font-medium text-foreground/70">{lead.source}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Select value={lead.status} onValueChange={(v) => updateStatus.mutate(v)}>
              <SelectTrigger className="w-full sm:w-44 border-border/40 bg-card/80">
                <SelectValue placeholder="Alterar status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Info Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Contact */}
        <Card className="border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Phone className="h-3.5 w-3.5 text-primary/60" /> Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-3 rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-secondary">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                {lead.phone}
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-3 rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-secondary">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                {lead.email}
              </a>
            )}
            {!lead.phone && !lead.email && (
              <p className="py-2 text-sm text-muted-foreground/60">Sem contato cadastrado</p>
            )}
          </CardContent>
        </Card>

        {/* Financial Interest */}
        <Card className="border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 text-primary/60" /> Interesse Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-secondary/40 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Valor de Interesse</p>
              <p className="mt-1 font-display text-lg font-bold text-primary">{formatCurrency(lead.interest_value)}</p>
            </div>
            <div className="rounded-lg bg-secondary/40 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Parcelas Desejadas</p>
              <p className="mt-1 font-display text-lg font-bold text-foreground">{formatCurrency(lead.installment_value)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Home className="h-3.5 w-3.5 text-primary/60" /> Preferências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lead.property_type_interest && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Tipo de Imóvel</p>
                <p className="mt-1 text-sm text-foreground">{lead.property_type_interest}</p>
              </div>
            )}
            {lead.preferred_neighborhoods?.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Bairros</p>
                <div className="flex flex-wrap gap-1.5">
                  {lead.preferred_neighborhoods.map((n: string, i: number) => (
                    <Badge key={i} variant="secondary" className="border-border/30 bg-secondary/60 text-xs font-normal">
                      <MapPin className="mr-1 h-2.5 w-2.5 text-primary/60" />{n}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {!lead.property_type_interest && (!lead.preferred_neighborhoods || lead.preferred_neighborhoods.length === 0) && (
              <p className="py-2 text-sm text-muted-foreground/60">Sem preferências cadastradas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {lead.notes && (
        <Card className="border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary/60" /> Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{lead.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Templates for current stage */}
      <LeadTemplates leadStatus={lead.status} brokerId={brokerId} />

      {/* Interactions Timeline */}
      <Card className="border-border/30">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MessageSquare className="h-4 w-4 text-primary" />
            Histórico de Contatos
            {interactions.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{interactions.length}</span>
            )}
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowInteractionForm(true)}
            className="gap-1.5 bg-gradient-to-r from-primary to-primary/80 text-xs font-semibold shadow-md shadow-primary/20"
          >
            <Plus className="h-3 w-3" /> Registrar Contato
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New interaction form */}
          {showInteractionForm && (
            <div className="space-y-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Novo Registro</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Tipo de Contato</Label>
                  <Select value={interactionType} onValueChange={setInteractionType}>
                    <SelectTrigger className="border-border/40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(interactionLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Próximo Contato</Label>
                  <Input type="datetime-local" value={nextContactDate} onChange={(e) => setNextContactDate(e.target.value)} className="border-border/40" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Descrição *</Label>
                <Textarea
                  value={interactionDesc}
                  onChange={(e) => setInteractionDesc(e.target.value)}
                  placeholder="Descreva o que foi conversado, acordos, próximos passos..."
                  rows={3}
                  className="border-border/40"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => addInteraction.mutate()} disabled={addInteraction.isPending} className="bg-primary font-semibold">
                  {addInteraction.isPending ? "Salvando..." : "Salvar Registro"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowInteractionForm(false)} className="text-muted-foreground">Cancelar</Button>
              </div>
            </div>
          )}

          {/* Timeline */}
          {interactions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                <MessageSquare className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhum contato registrado ainda</p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border/40" />

              {interactions.map((inter: any, idx: number) => {
                const Icon = interactionIcons[inter.type] || MessageSquare;
                return (
                  <div key={inter.id} className="group relative flex gap-4 py-3">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-card shadow-sm transition-colors group-hover:border-primary/40">
                      <Icon className="h-4 w-4 text-primary/70" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 rounded-lg border border-border/20 bg-card/50 p-3 transition-colors group-hover:border-border/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-border/30 text-[10px] font-medium">
                            {interactionLabels[inter.type]}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">{formatDate(inter.created_at)}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                          onClick={() => { if (confirm("Remover este registro?")) deleteInteraction.mutate(inter.id); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{inter.description}</p>
                      {inter.next_contact_date && (
                        <div className="mt-2 flex items-center gap-1.5 rounded-md bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary">
                          <Calendar className="h-3 w-3" /> Próximo contato: {formatDate(inter.next_contact_date)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadDetail;
