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
import { ArrowLeft, Plus, Phone, Mail, DollarSign, MapPin, MessageSquare, Calendar, Trash2, User } from "lucide-react";

const statusLabels: Record<string, string> = {
  novo: "Novo", em_contato: "Em Contato", qualificado: "Qualificado", proposta: "Proposta", fechado: "Fechado", perdido: "Perdido",
};
const statusColors: Record<string, string> = {
  novo: "bg-blue-500/20 text-blue-400", em_contato: "bg-yellow-500/20 text-yellow-400",
  qualificado: "bg-emerald-500/20 text-emerald-400", proposta: "bg-purple-500/20 text-purple-400",
  fechado: "bg-green-500/20 text-green-400", perdido: "bg-red-500/20 text-red-400",
};
const interactionLabels: Record<string, string> = {
  ligacao: "Ligação", whatsapp: "WhatsApp", email: "Email", visita: "Visita", reuniao: "Reunião", outro: "Outro",
};
const interactionIcons: Record<string, any> = {
  ligacao: Phone, whatsapp: MessageSquare, email: Mail, visita: MapPin, reuniao: Calendar, outro: MessageSquare,
};

const formatCurrency = (v: number | null) => v ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";
const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

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
      const { data, error } = await supabase.from("broker_leads").select("*").eq("id", leadId).single();
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

  if (!lead) return <p className="text-center text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2"><ArrowLeft className="h-4 w-4" /> Voltar</Button>

      {/* Lead header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-primary">
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{lead.name}</h1>
            <div className="mt-1 flex gap-2">
              <Badge variant="outline" className={statusColors[lead.status]}>{statusLabels[lead.status]}</Badge>
            </div>
          </div>
        </div>
        <Select value={lead.status} onValueChange={(v) => updateStatus.mutate(v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Lead info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Contato</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {lead.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{lead.phone}</p>}
            {lead.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{lead.email}</p>}
            {!lead.phone && !lead.email && <p className="text-muted-foreground">Sem contato cadastrado</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Interesse</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" />Valor: {formatCurrency(lead.interest_value)}</p>
            <p className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" />Parcelas: {formatCurrency(lead.installment_value)}</p>
            {lead.property_type_interest && <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />{lead.property_type_interest}</p>}
          </CardContent>
        </Card>
        {lead.preferred_neighborhoods?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Bairros de Preferência</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {lead.preferred_neighborhoods.map((n: string, i: number) => <Badge key={i} variant="secondary">{n}</Badge>)}
            </CardContent>
          </Card>
        )}
        {lead.notes && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Observações</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm text-muted-foreground">{lead.notes}</p></CardContent>
          </Card>
        )}
      </div>

      {/* Interactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Histórico de Contatos</CardTitle>
          <Button size="sm" onClick={() => setShowInteractionForm(true)} className="gap-1"><Plus className="h-3 w-3" /> Registrar Contato</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showInteractionForm && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={interactionType} onValueChange={setInteractionType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(interactionLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Próximo contato</Label>
                  <Input type="datetime-local" value={nextContactDate} onChange={(e) => setNextContactDate(e.target.value)} />
                </div>
              </div>
              <div><Label>Descrição *</Label><Textarea value={interactionDesc} onChange={(e) => setInteractionDesc(e.target.value)} placeholder="Descreva o que foi conversado..." rows={3} /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => addInteraction.mutate()} disabled={addInteraction.isPending}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowInteractionForm(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          {interactions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum contato registrado ainda</p>
          ) : (
            <div className="space-y-3">
              {interactions.map((inter: any) => {
                const Icon = interactionIcons[inter.type] || MessageSquare;
                return (
                  <div key={inter.id} className="flex gap-3 rounded-lg border border-border p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{interactionLabels[inter.type]}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(inter.created_at)}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{inter.description}</p>
                      {inter.next_contact_date && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-primary">
                          <Calendar className="h-3 w-3" /> Próximo contato: {formatDate(inter.next_contact_date)}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => { if (confirm("Remover?")) deleteInteraction.mutate(inter.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
