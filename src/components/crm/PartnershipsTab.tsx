import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Handshake, Plus, CheckCircle2, XCircle, Clock, ArrowRightLeft,
  Building2, User, Percent, MessageSquare, Filter,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  pendente: "Pendente", aceita: "Aceita", ativa: "Ativa",
  concluida: "Concluída", recusada: "Recusada", cancelada: "Cancelada",
};

const statusColors: Record<string, string> = {
  pendente: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  aceita: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  ativa: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  concluida: "border-primary/40 bg-primary/10 text-primary",
  recusada: "border-destructive/40 bg-destructive/10 text-destructive",
  cancelada: "border-muted-foreground/40 bg-muted/10 text-muted-foreground",
};

const PartnershipsTab = () => {
  const { brokerId, role } = useAuth();
  const queryClient = useQueryClient();
  const [showPropose, setShowPropose] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch partnerships
  const { data: partnerships = [], isLoading } = useQuery({
    queryKey: ["partnerships", brokerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partnerships")
        .select("*, db_properties(title, city, price, image_url), owner_broker:brokers!partnerships_owner_broker_id_fkey(id, company_name, creci), partner_broker:brokers!partnerships_partner_broker_id_fkey(id, company_name, creci)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  // Fetch properties open for partnership (for proposing)
  const { data: openProperties = [] } = useQuery({
    queryKey: ["open-for-partnership", brokerId],
    queryFn: async () => {
      let q = supabase
        .from("db_properties")
        .select("id, title, city, price, broker_id")
        .eq("open_for_partnership", true)
        .eq("availability", "available");
      // Broker shouldn't see own properties to propose to themselves
      if (role === "broker" && brokerId) {
        q = q.neq("broker_id", brokerId);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId || role === "admin",
  });

  // Update partnership status
  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("partnerships")
        .update({ status: status as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerships"] });
      toast({ title: "Parceria atualizada!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const filtered = partnerships.filter((p: any) =>
    statusFilter === "all" || p.status === statusFilter
  );

  const myBrokerId = brokerId;
  const stats = {
    total: partnerships.length,
    pendentes: partnerships.filter((p: any) => p.status === "pendente").length,
    ativas: partnerships.filter((p: any) => p.status === "aceita" || p.status === "ativa").length,
    concluidas: partnerships.filter((p: any) => p.status === "concluida").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: Handshake, gradient: "from-secondary to-secondary/60", iconColor: "text-foreground" },
          { label: "Pendentes", value: stats.pendentes, icon: Clock, gradient: "from-amber-500/20 to-amber-600/10", iconColor: "text-amber-400" },
          { label: "Ativas", value: stats.ativas, icon: ArrowRightLeft, gradient: "from-emerald-500/20 to-emerald-600/10", iconColor: "text-emerald-400" },
          { label: "Concluídas", value: stats.concluidas, icon: CheckCircle2, gradient: "from-primary/20 to-primary/5", iconColor: "text-primary" },
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

      {/* Filters + New */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full border-border/40 bg-card/50 sm:w-48">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {role === "broker" && (
          <Button
            onClick={() => setShowPropose(true)}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 font-semibold shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> Propor Parceria
          </Button>
        )}
      </div>

      {/* Partnership List */}
      {isLoading ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando parcerias...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <Handshake className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-semibold text-foreground">Nenhuma parceria encontrada</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {role === "broker"
                  ? "Busque imóveis abertos para parceria e faça sua primeira proposta!"
                  : "As parcerias entre corretores aparecerão aqui."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((p: any) => {
            const isOwner = p.owner_broker_id === myBrokerId;
            const isPartner = p.partner_broker_id === myBrokerId;
            const property = p.db_properties;
            const ownerBroker = p.owner_broker;
            const partnerBroker = p.partner_broker;

            return (
              <Card key={p.id} className="border-border/30 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/30">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-display text-sm font-semibold text-foreground truncate">
                          {property?.title || "Imóvel"}
                        </span>
                        <Badge variant="outline" className={`text-[10px] font-medium ${statusColors[p.status]}`}>
                          {statusLabels[p.status]}
                        </Badge>
                        {isOwner && (
                          <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/5 text-primary">Meu imóvel</Badge>
                        )}
                        {isPartner && (
                          <Badge variant="outline" className="text-[10px] border-sky-500/30 bg-sky-500/5 text-sky-400">Sou parceiro</Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-primary/60" />
                          Dono: {ownerBroker?.company_name || ownerBroker?.creci || "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Handshake className="h-3 w-3 text-sky-400/60" />
                          Parceiro: {partnerBroker?.company_name || partnerBroker?.creci || "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Percent className="h-3 w-3 text-emerald-400/60" />
                          {p.commission_split_owner}% / {p.commission_split_partner}%
                        </span>
                      </div>

                      {p.message && (
                        <p className="flex items-start gap-1.5 text-xs text-muted-foreground/80">
                          <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{p.message}</span>
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 gap-2">
                      {p.status === "pendente" && isOwner && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => updateMutation.mutate({ id: p.id, status: "aceita" })}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                            onClick={() => updateMutation.mutate({ id: p.id, status: "recusada" })}
                          >
                            <XCircle className="h-3.5 w-3.5" /> Recusar
                          </Button>
                        </>
                      )}
                      {p.status === "pendente" && isPartner && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 border-muted-foreground/40 text-muted-foreground hover:bg-muted/10"
                          onClick={() => updateMutation.mutate({ id: p.id, status: "cancelada" })}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Cancelar
                        </Button>
                      )}
                      {p.status === "aceita" && (isOwner || role === "admin") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => updateMutation.mutate({ id: p.id, status: "ativa" })}
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" /> Ativar
                        </Button>
                      )}
                      {p.status === "ativa" && (isOwner || role === "admin") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 border-primary/40 text-primary hover:bg-primary/10"
                          onClick={() => updateMutation.mutate({ id: p.id, status: "concluida" })}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Propose Dialog */}
      <ProposeDialog
        open={showPropose}
        onOpenChange={setShowPropose}
        properties={openProperties}
        brokerId={brokerId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["partnerships"] });
          setShowPropose(false);
        }}
      />
    </div>
  );
};

/* ─── Propose Partnership Dialog ─── */
const ProposeDialog = ({
  open, onOpenChange, properties, brokerId, onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  properties: any[];
  brokerId: string | null;
  onSuccess: () => void;
}) => {
  const [propertyId, setPropertyId] = useState("");
  const [split, setSplit] = useState([50]);
  const [message, setMessage] = useState("");
  const [terms, setTerms] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedProp = properties.find((p) => p.id === propertyId);

  const handleSubmit = async () => {
    if (!propertyId || !brokerId) {
      toast({ title: "Selecione um imóvel", variant: "destructive" });
      return;
    }
    if (!selectedProp?.broker_id) {
      toast({ title: "Imóvel sem corretor vinculado", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("partnerships").insert({
        property_id: propertyId,
        owner_broker_id: selectedProp.broker_id,
        partner_broker_id: brokerId,
        commission_split_owner: 100 - split[0],
        commission_split_partner: split[0],
        message: message.trim() || null,
        terms: terms.trim() || null,
      });
      if (error) throw error;
      toast({ title: "Proposta de parceria enviada! 🤝" });
      setPropertyId("");
      setSplit([50]);
      setMessage("");
      setTerms("");
      onSuccess();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border/50 bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" /> Propor Parceria
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Imóvel disponível para parceria *
            </Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger className="border-border/40">
                <SelectValue placeholder="Selecione o imóvel" />
              </SelectTrigger>
              <SelectContent>
                {properties.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Nenhum imóvel disponível</div>
                ) : (
                  properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title} — {p.city} — R$ {Number(p.price).toLocaleString("pt-BR")}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Divisão da Comissão
            </Label>
            <div className="rounded-lg border border-border/30 bg-secondary/30 p-4">
              <Slider
                value={split}
                onValueChange={setSplit}
                min={10}
                max={90}
                step={1}
                className="mb-3"
              />
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" /> Dono: <strong className="text-foreground">{100 - split[0]}%</strong>
                </span>
                <span className="flex items-center gap-1 text-sky-400">
                  <Handshake className="h-3 w-3" /> Você: <strong>{split[0]}%</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Mensagem para o corretor
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Olá, tenho um cliente interessado neste imóvel..."
              rows={3}
              className="border-border/40"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Termos / Condições (opcional)
            </Label>
            <Textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Condições específicas da parceria..."
              rows={2}
              className="border-border/40"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving || !propertyId}
            className="w-full bg-gradient-to-r from-primary to-primary/80 font-semibold shadow-lg shadow-primary/20"
          >
            {saving ? "Enviando..." : "Enviar Proposta de Parceria"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnershipsTab;
