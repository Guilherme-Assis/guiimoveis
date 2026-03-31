import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/slugify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, UserCheck, UserX } from "lucide-react";

type Broker = {
  id: string;
  user_id: string;
  creci: string;
  company_name: string | null;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
};

const Brokers = () => {
  const { toast } = useToast();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", creci: "", companyName: "", commissionRate: 5, slug: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("brokers").select("*").order("created_at", { ascending: false });
    setBrokers((data as Broker[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.email.trim() || !form.password.trim() || !form.creci.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha e-mail, senha e CRECI.", variant: "destructive" });
      return;
    }

    // Sign up the broker user
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

    // Add broker role
    const { error: roleError } = await supabase.from("user_roles").insert({ user_id: userId, role: "broker" });
    if (roleError) {
      toast({ title: "Erro ao atribuir role", description: roleError.message, variant: "destructive" });
      return;
    }

    // Create broker record
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
    setForm({ email: "", password: "", fullName: "", creci: "", companyName: "", commissionRate: 5, slug: "" });
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Corretores</h1>
          <p className="font-body text-sm text-muted-foreground">Gerencie a equipe de corretores</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-gradient-gold font-body text-sm font-semibold uppercase tracking-wider text-primary-foreground">
          <Plus className="mr-1 h-4 w-4" /> Novo Corretor
        </Button>
      </div>

      {loading ? (
        <p className="font-body text-muted-foreground">Carregando...</p>
      ) : brokers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="font-display text-xl text-foreground">Nenhum corretor cadastrado</p>
          <p className="mt-2 font-body text-sm text-muted-foreground">Adicione o primeiro corretor da equipe.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {brokers.map((b) => (
            <div key={b.id} className="flex items-center justify-between border border-border bg-card p-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">CRECI: {b.creci}</h3>
                <p className="font-body text-xs text-muted-foreground">
                  {b.company_name || "Autônomo"} • Comissão: {b.commission_rate}%
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => toggleActive(b)} title={b.is_active ? "Desativar" : "Ativar"}>
                  {b.is_active ? <UserCheck className="h-4 w-4 text-green-500" /> : <UserX className="h-4 w-4 text-destructive" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Novo Corretor</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
            <div className="space-y-2">
              <Label className="font-body text-sm">CRECI *</Label>
              <Input value={form.creci} onChange={(e) => setForm({ ...form, creci: e.target.value })} className="border-border bg-secondary" />
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
            <Button onClick={handleCreate} className="mt-2 w-full bg-gradient-gold font-body text-sm font-semibold uppercase tracking-wider text-primary-foreground">
              Cadastrar Corretor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Brokers;
