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
  Plus, Calendar, MapPin, Star, Eye, Trash2, Edit, CheckCircle2, XCircle, Clock, AlertTriangle, CalendarCheck
} from "lucide-react";
import CrmHero from "./CrmHero";

const visitStatusLabels: Record<string, string> = {
  agendada: "Agendada", realizada: "Realizada", cancelada: "Cancelada", no_show: "No-show",
};
const visitStatusColors: Record<string, string> = {
  agendada: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  realizada: "border-primary/40 bg-primary/10 text-primary",
  cancelada: "border-destructive/40 bg-destructive/10 text-destructive",
  no_show: "border-amber-500/40 bg-amber-500/10 text-amber-300",
};
const visitStatusIcons: Record<string, any> = {
  agendada: Clock, realizada: CheckCircle2, cancelada: XCircle, no_show: AlertTriangle,
};

const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const formatCurrency = (v: number | null) => v ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

const VisitsTab = () => {
  const { brokerId, role } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editVisit, setEditVisit] = useState<any>(null);

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ["lead-visits", brokerId],
    queryFn: async () => {
      const q = supabase.from("lead_property_visits")
        .select("*, broker_leads(name), db_properties(title, location, city)")
        .order("visit_date", { ascending: false });
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
      const { data, error } = await supabase.from("db_properties").select("id, title, location, city").eq("availability", "available");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lead_property_visits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-visits"] });
      toast({ title: "Visita removida" });
    },
  });

  const upcomingCount = visits.filter((v: any) => v.status === "agendada" && new Date(v.visit_date) >= new Date()).length;

  return (
    <div className="space-y-6">
      <CrmHero
        icon={CalendarCheck}
        title="Visitas"
        subtitle="Acompanhe agendamentos, feedbacks e nível de interesse"
        accent="emerald"
        actions={
          <>
            {upcomingCount > 0 && (
              <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-sky-300">
                <Calendar className="mr-1 h-3 w-3" /> {upcomingCount} agendada{upcomingCount > 1 ? "s" : ""}
              </Badge>
            )}
            <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditVisit(null); }}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 font-semibold shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" /> Agendar Visita
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md border-border/50 bg-card">
                <DialogHeader><DialogTitle className="font-display">{editVisit ? "Editar Visita" : "Agendar Visita"}</DialogTitle></DialogHeader>
                <VisitForm brokerId={brokerId} isAdmin={role === "admin"} visit={editVisit} leads={leads} properties={properties} onSuccess={() => { setShowForm(false); setEditVisit(null); queryClient.invalidateQueries({ queryKey: ["lead-visits"] }); }} />
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : visits.length === 0 ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <MapPin className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma visita registrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {visits.map((visit: any) => {
            const StatusIcon = visitStatusIcons[visit.status] || Clock;
            return (
              <Card key={visit.id} className="group border-border/30 transition-all hover:border-border/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <StatusIcon className={`h-5 w-5 ${visit.status === "realizada" ? "text-primary" : visit.status === "agendada" ? "text-sky-400" : "text-muted-foreground"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{visit.db_properties?.title || "Imóvel"}</p>
                      <Badge variant="outline" className={`text-[10px] ${visitStatusColors[visit.status]}`}>{visitStatusLabels[visit.status]}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-primary/60" />{formatDate(visit.visit_date)}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{visit.broker_leads?.name || "Lead"}</span>
                      {visit.db_properties?.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{visit.db_properties.city}</span>}
                      {visit.interest_level && (
                        <span className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < visit.interest_level ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                          ))}
                        </span>
                      )}
                    </div>
                    {visit.feedback && <p className="mt-1 truncate text-xs text-muted-foreground/70">{visit.feedback}</p>}
                  </div>
                  <div className="flex shrink-0 gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setEditVisit(visit); setShowForm(true); }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { if (confirm("Excluir?")) deleteMutation.mutate(visit.id); }}><Trash2 className="h-4 w-4" /></Button>
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

const VisitForm = ({ brokerId, isAdmin, visit, leads, properties, onSuccess }: any) => {
  const [form, setForm] = useState({
    lead_id: visit?.lead_id || "", property_id: visit?.property_id || "",
    visit_date: visit?.visit_date ? new Date(visit.visit_date).toISOString().slice(0, 16) : "",
    status: visit?.status || "agendada", feedback: visit?.feedback || "",
    interest_level: visit?.interest_level?.toString() || "",
  });
  const [saving, setSaving] = useState(false);
  const { data: brokers = [] } = useQuery({
    queryKey: ["brokers-list"], queryFn: async () => { const { data } = await supabase.from("brokers").select("id, company_name, creci"); return data || []; }, enabled: !!isAdmin,
  });
  const [selectedBrokerId, setSelectedBrokerId] = useState(visit?.broker_id || brokerId || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalBrokerId = isAdmin ? selectedBrokerId : brokerId;
    if (!form.lead_id || !form.property_id || !form.visit_date) { toast({ title: "Preencha lead, imóvel e data", variant: "destructive" }); return; }
    if (!finalBrokerId) { toast({ title: "Selecione um corretor", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      broker_id: finalBrokerId, lead_id: form.lead_id, property_id: form.property_id,
      visit_date: new Date(form.visit_date).toISOString(),
      status: form.status as any, feedback: form.feedback.trim() || null,
      interest_level: form.interest_level ? parseInt(form.interest_level) : null,
    };
    try {
      if (visit) {
        const { error } = await supabase.from("lead_property_visits").update(payload).eq("id", visit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lead_property_visits").insert(payload);
        if (error) throw error;
      }
      toast({ title: visit ? "Visita atualizada!" : "Visita agendada!" }); onSuccess();
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Data/Hora *</Label>
          <Input type="datetime-local" value={form.visit_date} onChange={(e) => setForm(p => ({ ...p, visit_date: e.target.value }))} className="border-border/40" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
            <SelectTrigger className="border-border/40"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(visitStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Nível de Interesse (1-5)</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setForm(p => ({ ...p, interest_level: n.toString() }))}
              className="rounded p-1 transition-colors hover:bg-secondary">
              <Star className={`h-5 w-5 ${parseInt(form.interest_level) >= n ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Feedback / Notas</Label>
        <Textarea value={form.feedback} onChange={(e) => setForm(p => ({ ...p, feedback: e.target.value }))} placeholder="Como foi a visita, impressões do cliente..." rows={2} className="border-border/40" />
      </div>
      <Button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-primary to-primary/80 font-semibold">
        {saving ? "Salvando..." : visit ? "Atualizar" : "Agendar Visita"}
      </Button>
    </form>
  );
};

export default VisitsTab;
