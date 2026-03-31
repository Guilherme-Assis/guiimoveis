import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ display_name: "", phone: "", bio: "", avatar_url: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setForm({
          display_name: data.display_name || "",
          phone: data.phone || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || "",
        });
      }
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update(form).eq("user_id", user.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
    }
  };

  if (loading) return <p className="font-body text-muted-foreground">Carregando...</p>;

  return (
    <div className="max-w-xl">
      <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Meu Perfil</h1>
      <p className="mb-8 font-body text-sm text-muted-foreground">Atualize suas informações pessoais</p>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="font-body text-sm">Nome de Exibição</Label>
          <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="border-border bg-secondary" />
        </div>
        <div className="space-y-2">
          <Label className="font-body text-sm">Telefone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" className="border-border bg-secondary" />
        </div>
        <div className="space-y-2">
          <Label className="font-body text-sm">URL do Avatar</Label>
          <Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." className="border-border bg-secondary" />
        </div>
        <div className="space-y-2">
          <Label className="font-body text-sm">Biografia</Label>
          <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} className="border-border bg-secondary" />
        </div>
        <Button onClick={handleSave} className="bg-gradient-gold font-body text-sm font-semibold uppercase tracking-wider text-primary-foreground">
          Salvar Perfil
        </Button>
      </div>
    </div>
  );
};

export default Profile;
