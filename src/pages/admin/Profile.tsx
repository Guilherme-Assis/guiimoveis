import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Copy, Check } from "lucide-react";
import KorretoraLoader from "@/components/KorretoraLoader";

const Profile = () => {
  const { user, role, brokerId } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ display_name: "", phone: "", bio: "", avatar_url: "" });
  const [creci, setCreci] = useState("");
  const [brokerSlug, setBrokerSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("profiles").select("display_name, phone, bio, avatar_url, user_id").eq("user_id", user.id).single();
      if (data) {
        setForm({
          display_name: data.display_name || "",
          phone: data.phone || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || "",
        });
      }

      if (role === "broker" && brokerId) {
        const { data: bData } = await supabase.from("brokers").select("creci, slug").eq("id", brokerId).maybeSingle();
        if (bData) {
          setCreci(bData.creci || "");
          setBrokerSlug(bData.slug || bData.creci || "");
        }
      }

      setLoading(false);
    };
    load();
  }, [user, role, brokerId]);

  const handleSave = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update(form).eq("user_id", user.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
    }
  };

  const profileUrl = brokerSlug ? `${window.location.origin}/corretor/${brokerSlug}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast({ title: "Link copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <KorretoraLoader compact status="Carregando perfil..." />;

  return (
    <div className="max-w-xl">
      <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Meu Perfil</h1>
      <p className="mb-8 font-body text-sm text-muted-foreground">Atualize suas informações pessoais</p>

      {/* Avatar preview */}
      <div className="mb-6 flex items-center gap-4">
        {form.avatar_url ? (
          <img src={form.avatar_url} alt="Avatar" className="h-20 w-20 rounded-full border-2 border-primary/30 object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/30 font-display text-2xl font-bold text-primary">
            {(form.display_name || "U").charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-display text-lg font-semibold text-foreground">{form.display_name || "Seu Nome"}</p>
          {creci && <p className="font-body text-xs text-muted-foreground">CRECI: {creci}</p>}
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="font-body text-sm">Nome de Exibição</Label>
          <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="border-border bg-secondary" />
        </div>
        <div className="space-y-2">
          <Label className="font-body text-sm">Telefone (com DDD)</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" className="border-border bg-secondary" />
          <p className="font-body text-xs text-muted-foreground">Este número será usado para contato via WhatsApp</p>
        </div>
        <div className="space-y-2">
          <Label className="font-body text-sm">URL da Foto</Label>
          <Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." className="border-border bg-secondary" />
        </div>
        {role === "broker" && (
          <div className="space-y-2">
            <Label className="font-body text-sm">CRECI</Label>
            <Input value={creci} disabled className="border-border bg-secondary/50 text-muted-foreground cursor-not-allowed" />
            <p className="font-body text-xs text-muted-foreground">O CRECI é gerenciado pelo administrador</p>
          </div>
        )}
        <div className="space-y-2">
          <Label className="font-body text-sm">Biografia</Label>
          <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} placeholder="Conte um pouco sobre você e sua experiência..." className="border-border bg-secondary" />
        </div>

        {/* Public profile link */}
        {profileUrl && (
          <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-2">
            <Label className="font-body text-sm font-semibold">Seu Perfil Público</Label>
            <div className="flex items-center gap-2">
              <Input value={profileUrl} readOnly className="border-border bg-background text-xs" />
              <Button onClick={copyLink} variant="outline" size="icon" className="shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button asChild variant="outline" size="icon" className="shrink-0">
                <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )}

        <Button onClick={handleSave} className="bg-gradient-gold font-body text-sm font-semibold uppercase tracking-wider text-primary-foreground">
          Salvar Perfil
        </Button>
      </div>
    </div>
  );
};

export default Profile;
