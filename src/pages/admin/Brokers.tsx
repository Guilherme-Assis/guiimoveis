import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/slugify";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, Pencil, Trash2, UserCheck, UserX, ExternalLink,
  ShieldCheck, ShieldOff, Calendar, Search, RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";

type Broker = {
  id: string;
  user_id: string;
  creci: string;
  company_name: string | null;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
  slug: string | null;
  // Joined data
  display_name: string | null;
  phone: string | null;
  subscription_status: string | null;
  expires_at: string | null;
  subscription_id: string | null;
};

const emptyForm = { email: "", password: "", fullName: "", creci: "", companyName: "", commissionRate: 5, slug: "" };

const Brokers = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [notes, setNotes] = useState("");

  const load = async () => {
    setLoading(true);

    const { data: brokersData } = await supabase
      .from("brokers")
      .select("id, user_id, creci, company_name, commission_rate, is_active, created_at, slug")
      .order("created_at", { ascending: false });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, phone");

    const { data: subs } = await supabase
      .from("subscriptions")
      .select("id, user_id, status, expires_at")
      .order("expires_at", { ascending: false });

    const enriched: Broker[] = (brokersData || []).map((b: any) => {
      const profile = (profiles || []).find((p: any) => p.user_id === b.user_id);
      const sub = (subs || []).find((s: any) => s.user_id === b.user_id);
      return {
        ...b,
        display_name: profile?.display_name || null,
        phone: profile?.phone || null,
        subscription_status: sub?.status || null,
        expires_at: sub?.expires_at || null,
        subscription_id: sub?.id || null,
      };
    });

    setBrokers(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingBroker(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (broker: Broker) => {
    setEditingBroker(broker);
    setForm({
      email: "",
      password: "",
      fullName: "",
      creci: broker.creci,
      companyName: broker.company_name || "",
      commissionRate: broker.commission_rate ?? 5,
      slug: broker.slug || "",
    });
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!form.email.trim() || !form.password.trim() || !form.creci.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha e-mail, senha e CRECI.", variant: "destructive" });
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { data: { full_name: form.fullName || form.email } },
    });

    if (signUpError) {
      toast({ title: "Erro ao criar usuário", description: signUpError.message, variant: "destructive" });
      return;
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      toast({ title: "Erro", description: "Não foi possível criar o usuário.", variant: "destructive" });
      return;
    }

    const { error: roleError } = await supabase.from("user_roles").insert({ user_id: userId, role: "broker" });
    if (roleError) {
      toast({ title: "Erro ao atribuir role", description: roleError.message, variant: "destructive" });
      return;
    }

    const brokerSlug = form.slug.trim() || slugify(form.fullName || form.email);
    const { error: brokerError } = await supabase.from("brokers").insert({
      user_id: userId,
      creci: form.creci.trim(),
      company_name: form.companyName.trim() || null,
      commission_rate: form.commissionRate,
      slug: brokerSlug,
    });

    if (brokerError) {
      toast({ title: "Erro ao criar corretor", description: brokerError.message, variant: "destructive" });
      return;
    }

    toast({ title: "Corretor cadastrado com sucesso!" });
    setDialogOpen(false);
    setForm(emptyForm);
    load();
  };

  const handleUpdate = async () => {
    if (!editingBroker) return;
    if (!form.creci.trim()) {
      toast({ title: "CRECI obrigatório", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("brokers").update({
      creci: form.creci.trim(),
      company_name: form.companyName.trim() || null,
      commission_rate: form.commissionRate,
      slug: form.slug.trim() || editingBroker.slug,
    }).eq("id", editingBroker.id);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Corretor atualizado com sucesso!" });
    setDialogOpen(false);
    setEditingBroker(null);
    load();
  };

  const toggleActive = async (broker: Broker) => {
    await supabase.from("brokers").update({ is_active: !broker.is_active }).eq("id", broker.id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este corretor? Os imóveis dele ficarão sem corretor atribuído.")) return;
    await supabase.from("brokers").delete().eq("id", id);
    toast({ title: "Corretor removido" });
    load();
  };

  // License management
  const openLicenseDialog = (broker: Broker) => {
    setSelectedBroker(broker);
    setNotes("");
    setLicenseDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedBroker || !currentUser) return;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { error } = await supabase.from("subscriptions").insert({
      user_id: selectedBroker.user_id,
      status: "ativa" as any,
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      confirmed_by: currentUser.id,
      notes: notes || null,
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Sucesso", description: "Licença de 30 dias ativada com sucesso!" });
    setLicenseDialogOpen(false);
    load();
  };

  const cancelSubscription = async (broker: Broker) => {
    if (!broker.subscription_id) return;

    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelada" as any })
      .eq("id", broker.subscription_id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Licença cancelada" });
    load();
  };

  const getStatusBadge = (broker: Broker) => {
    if (!broker.subscription_status) {
      return <Badge variant="outline" className="text-muted-foreground">Sem licença</Badge>;
    }
    if (broker.subscription_status === "ativa") {
      const expires = new Date(broker.expires_at!);
      const now = new Date();
      if (expires < now) {
        return <Badge variant="destructive">Expirada</Badge>;
      }
      const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return (
        <Badge className="bg-green-600 hover:bg-green-700 text-white">
          Ativa · {daysLeft}d
        </Badge>
      );
    }
    if (broker.subscription_status === "cancelada") {
      return <Badge variant="destructive">Cancelada</Badge>;
    }
    return <Badge variant="secondary">{broker.subscription_status}</Badge>;
  };

  const filtered = brokers.filter((b) => {
    const q = search.toLowerCase();
    return (
      (b.display_name || "").toLowerCase().includes(q) ||
      b.creci.toLowerCase().includes(q) ||
      (b.company_name || "").toLowerCase().includes(q) ||
      (b.phone || "").includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Corretores</h1>
          <p className="font-body text-sm text-muted-foreground">Gerencie equipe e licenças de acesso</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button onClick={openCreate} className="bg-gradient-gold font-body text-sm font-semibold uppercase tracking-wider text-primary-foreground">
            <Plus className="mr-1 h-4 w-4" /> Novo Corretor
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CRECI, empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="font-display text-xl text-foreground">Nenhum corretor encontrado</p>
          <p className="mt-2 font-body text-sm text-muted-foreground">Adicione o primeiro corretor da equipe.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corretor</TableHead>
                <TableHead>CRECI</TableHead>
                <TableHead>Licença</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{b.display_name || b.company_name || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground">{b.phone || "—"} {b.company_name ? `• ${b.company_name}` : ""}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{b.creci}</TableCell>
                  <TableCell>{getStatusBadge(b)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {b.expires_at ? new Date(b.expires_at).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell>
                    {b.is_active ? (
                      <Badge className="bg-green-600/10 text-green-600 border-green-600/20">Ativo</Badge>
                    ) : (
                      <Badge variant="destructive">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => openLicenseDialog(b)} className="gap-1" title="Liberar 30 dias">
                        <ShieldCheck className="h-4 w-4" />
                        30d
                      </Button>
                      {b.subscription_status === "ativa" && (
                        <Button size="sm" variant="ghost" onClick={() => cancelSubscription(b)} title="Cancelar licença">
                          <ShieldOff className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" asChild title="Ver perfil público">
                        <Link to={`/corretor/${b.slug || b.id}`} target="_blank">
                          <ExternalLink className="h-4 w-4 text-primary" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(b)} title="Editar">
                        <Pencil className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleActive(b)} title={b.is_active ? "Desativar" : "Ativar"}>
                        {b.is_active ? <UserCheck className="h-4 w-4 text-green-500" /> : <UserX className="h-4 w-4 text-destructive" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Broker Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingBroker(null); }}>
        <DialogContent className="max-w-lg border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingBroker ? "Editar Corretor" : "Novo Corretor"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!editingBroker && (
              <>
                <div className="space-y-2">
                  <Label className="font-body text-sm">Nome Completo</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="border-border bg-secondary" />
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-sm">E-mail *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border-border bg-secondary" />
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-sm">Senha *</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="border-border bg-secondary" />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label className="font-body text-sm">CRECI *</Label>
              <Input value={form.creci} onChange={(e) => setForm({ ...form, creci: e.target.value })} className="border-border bg-secondary" />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">Slug (URL amigável)</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-gerado se vazio" className="border-border bg-secondary" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body text-sm">Empresa</Label>
                <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="border-border bg-secondary" />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Comissão (%)</Label>
                <Input type="number" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })} className="border-border bg-secondary" />
              </div>
            </div>
            <Button
              onClick={editingBroker ? handleUpdate : handleCreate}
              className="mt-2 w-full bg-gradient-gold font-body text-sm font-semibold uppercase tracking-wider text-primary-foreground"
            >
              {editingBroker ? "Salvar Alterações" : "Cadastrar Corretor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm License Dialog */}
      <Dialog open={licenseDialogOpen} onOpenChange={setLicenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Confirmar Pagamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium text-foreground">
                {selectedBroker?.display_name || selectedBroker?.company_name || "Corretor"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                CRECI: {selectedBroker?.creci}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Será liberado acesso por <strong>30 dias</strong> a partir de hoje.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Expira em: <strong>{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR")}</strong>
              </p>
            </div>
            <div>
              <Label>Observações (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Pago via PIX, comprovante recebido..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLicenseDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmPayment}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Confirmar e Liberar Acesso
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Brokers;
