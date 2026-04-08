import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, ShieldCheck, ShieldOff, Calendar, Search, RefreshCw } from "lucide-react";

type UserWithSub = {
  user_id: string;
  display_name: string | null;
  email: string;
  phone: string | null;
  role: string | null;
  subscription_status: string | null;
  expires_at: string | null;
  subscription_id: string | null;
};

const Users = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithSub | null>(null);
  const [notes, setNotes] = useState("");

  const load = async () => {
    setLoading(true);

    // Get all profiles (admin can see all)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, phone");

    // Get all roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    // Get active subscriptions
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("id, user_id, status, expires_at")
      .order("expires_at", { ascending: false });

    // Build user list from profiles
    const userMap = new Map<string, UserWithSub>();

    (profiles || []).forEach((p: any) => {
      const roleRecord = (roles || []).find((r: any) => r.user_id === p.user_id);
      // Find latest subscription
      const sub = (subs || []).find((s: any) => s.user_id === p.user_id);
      
      userMap.set(p.user_id, {
        user_id: p.user_id,
        display_name: p.display_name,
        email: "", // Will be filled if available
        phone: p.phone,
        role: roleRecord?.role || null,
        subscription_status: sub?.status || null,
        expires_at: sub?.expires_at || null,
        subscription_id: sub?.id || null,
      });
    });

    setUsers(Array.from(userMap.values()));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const confirmPayment = async (userRow: UserWithSub) => {
    setSelectedUser(userRow);
    setNotes("");
    setDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedUser || !currentUser) return;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { error } = await supabase.from("subscriptions").insert({
      user_id: selectedUser.user_id,
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
    setDialogOpen(false);
    load();
  };

  const cancelSubscription = async (userRow: UserWithSub) => {
    if (!userRow.subscription_id) return;

    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelada" as any })
      .eq("id", userRow.subscription_id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Licença cancelada" });
    load();
  };

  const getStatusBadge = (user: UserWithSub) => {
    if (!user.subscription_status) {
      return <Badge variant="outline" className="text-muted-foreground">Sem licença</Badge>;
    }
    if (user.subscription_status === "ativa") {
      const expires = new Date(user.expires_at!);
      const now = new Date();
      if (expires < now) {
        return <Badge variant="destructive">Expirada</Badge>;
      }
      const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return (
        <Badge className="bg-green-600 hover:bg-green-700 text-white">
          Ativa · {daysLeft}d restantes
        </Badge>
      );
    }
    if (user.subscription_status === "cancelada") {
      return <Badge variant="destructive">Cancelada</Badge>;
    }
    return <Badge variant="secondary">{user.subscription_status}</Badge>;
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.display_name || "").toLowerCase().includes(q) ||
      u.user_id.toLowerCase().includes(q) ||
      (u.phone || "").includes(q)
    );
  });

  // Separate admins from regular users
  const adminUsers = filtered.filter((u) => u.role === "admin");
  const regularUsers = filtered.filter((u) => u.role !== "admin");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Usuários</h1>
          <p className="text-sm text-muted-foreground">Confirme pagamentos e gerencie licenças mensais</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Licença</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regularUsers.length === 0 && adminUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {adminUsers.map((u) => (
                    <TableRow key={u.user_id} className="bg-primary/5">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{u.display_name || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground">{u.phone || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-primary text-primary-foreground">Admin</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-muted-foreground">N/A</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">—</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        Acesso permanente
                      </TableCell>
                    </TableRow>
                  ))}
                  {regularUsers.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{u.display_name || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground">{u.phone || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{u.role || "Usuário"}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(u)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.expires_at
                          ? new Date(u.expires_at).toLocaleDateString("pt-BR")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => confirmPayment(u)}
                            className="gap-1"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Liberar 30 dias
                          </Button>
                          {u.subscription_status === "ativa" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => cancelSubscription(u)}
                              className="gap-1"
                            >
                              <ShieldOff className="h-4 w-4" />
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Confirm Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                {selectedUser?.display_name || "Usuário"}
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
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
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

export default Users;
