import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/slugify";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

type DbProperty = {
  id: string;
  title: string;
  type: string;
  status: string;
  availability: string;
  price: number;
  location: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  parking_spaces: number;
  area: number;
  land_area: number;
  description: string | null;
  features: string[];
  image_url: string | null;
  is_highlight: boolean;
  slug: string | null;
  broker_id: string | null;
};

const emptyProperty = {
  title: "", type: "casa" as "casa" | "apartamento" | "cobertura" | "terreno" | "fazenda" | "mansao", status: "venda" as "venda" | "aluguel" | "lancamento",
  price: 0, location: "", city: "", state: "SP",
  bedrooms: 0, bathrooms: 0, parking_spaces: 0,
  area: 0, land_area: 0, description: "",
  features: [] as string[], image_url: "", is_highlight: false, slug: "",
  latitude: "" as string | number, longitude: "" as string | number, virtual_tour_url: "",
};

const Properties = () => {
  const { role, brokerId } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<DbProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DbProperty | null>(null);
  const [form, setForm] = useState(emptyProperty);
  const [featuresInput, setFeaturesInput] = useState("");

  const load = async () => {
    setLoading(true);
    let query = supabase.from("db_properties").select("*").order("created_at", { ascending: false });
    if (role === "broker" && brokerId) {
      query = query.eq("broker_id", brokerId);
    }
    const { data } = await query;
    setProperties((data as DbProperty[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [role, brokerId]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProperty);
    setFeaturesInput("");
    setDialogOpen(true);
  };

  const openEdit = (p: DbProperty) => {
    setEditing(p);
    setForm({
      title: p.title, type: p.type as typeof emptyProperty.type, status: p.status as typeof emptyProperty.status,
      price: p.price, location: p.location, city: p.city, state: p.state,
      bedrooms: p.bedrooms, bathrooms: p.bathrooms, parking_spaces: p.parking_spaces,
      area: p.area, land_area: p.land_area, description: p.description || "",
      features: p.features || [], image_url: p.image_url || "", is_highlight: p.is_highlight,
      slug: p.slug || "",
      latitude: (p as any).latitude || "", longitude: (p as any).longitude || "",
      virtual_tour_url: (p as any).virtual_tour_url || "",
    });
    setFeaturesInput((p.features || []).join(", "));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.location.trim() || !form.city.trim() || form.price <= 0) {
      toast({ title: "Campos obrigatórios", description: "Preencha título, localização, cidade e preço.", variant: "destructive" });
      return;
    }

    const features = featuresInput.split(",").map((f) => f.trim()).filter(Boolean);
    const generatedSlug = form.slug.trim() || slugify(`${form.title}-${form.city}`);
    const payload: any = {
      ...form,
      features,
      slug: generatedSlug,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      virtual_tour_url: form.virtual_tour_url.trim() || null,
      broker_id: role === "broker" ? brokerId : (editing?.broker_id || null),
    };

    if (editing) {
      const { error } = await supabase.from("db_properties").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Imóvel atualizado!" });
    } else {
      const { error } = await supabase.from("db_properties").insert(payload);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Imóvel cadastrado!" });
    }
    setDialogOpen(false);
    load();
  };

  const toggleAvailability = async (p: DbProperty) => {
    const newStatus = p.availability === "available" ? "unavailable" : "available";
    await supabase.from("db_properties").update({ availability: newStatus }).eq("id", p.id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este imóvel?")) return;
    await supabase.from("db_properties").delete().eq("id", id);
    toast({ title: "Imóvel excluído" });
    load();
  };

  const typeLabels: Record<string, string> = {
    casa: "Casa", apartamento: "Apartamento", cobertura: "Cobertura",
    terreno: "Terreno", fazenda: "Fazenda", mansao: "Mansão",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Imóveis</h1>
          <p className="font-body text-sm text-muted-foreground">Gerencie o catálogo de imóveis</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-gold font-body text-sm font-semibold uppercase tracking-wider text-primary-foreground">
          <Plus className="mr-1 h-4 w-4" /> Novo Imóvel
        </Button>
      </div>

      {loading ? (
        <p className="font-body text-muted-foreground">Carregando...</p>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="font-display text-xl text-foreground">Nenhum imóvel cadastrado</p>
          <p className="mt-2 font-body text-sm text-muted-foreground">Comece adicionando seu primeiro imóvel.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => (
            <div key={p.id} className="flex items-center justify-between border border-border bg-card p-4">
              <div className="flex items-center gap-4">
                {p.image_url && (
                  <img src={p.image_url} alt={p.title} className="h-16 w-24 rounded object-cover" />
                )}
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{p.title}</h3>
                  <p className="font-body text-xs text-muted-foreground">
                    {typeLabels[p.type] || p.type} • {p.city}/{p.state} • R$ {Number(p.price).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleAvailability(p)}
                  title={p.availability === "available" ? "Tornar indisponível" : "Tornar disponível"}
                >
                  {p.availability === "available" ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-destructive" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editing ? "Editar Imóvel" : "Novo Imóvel"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="font-body text-sm">Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border-border bg-secondary" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body text-sm">Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as typeof emptyProperty.type })}>
                  <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="apartamento">Apartamento</SelectItem>
                    <SelectItem value="cobertura">Cobertura</SelectItem>
                    <SelectItem value="terreno">Terreno</SelectItem>
                    <SelectItem value="fazenda">Fazenda</SelectItem>
                    <SelectItem value="mansao">Mansão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof emptyProperty.status })}>
                  <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venda">Venda</SelectItem>
                    <SelectItem value="aluguel">Aluguel</SelectItem>
                    <SelectItem value="lancamento">Lançamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-body text-sm">Preço (R$) *</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="border-border bg-secondary" />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Cidade *</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="border-border bg-secondary" />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Estado</Label>
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="border-border bg-secondary" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-body text-sm">Slug (URL amigável)</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-gerado se vazio" className="border-border bg-secondary" />
            </div>

            <div className="space-y-2">
              <Label className="font-body text-sm">Localização (bairro) *</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="border-border bg-secondary" />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="font-body text-sm">Quartos</Label>
                <Input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })} className="border-border bg-secondary" />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Banheiros</Label>
                <Input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })} className="border-border bg-secondary" />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Vagas</Label>
                <Input type="number" value={form.parking_spaces} onChange={(e) => setForm({ ...form, parking_spaces: Number(e.target.value) })} className="border-border bg-secondary" />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Área (m²)</Label>
                <Input type="number" value={form.area} onChange={(e) => setForm({ ...form, area: Number(e.target.value) })} className="border-border bg-secondary" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body text-sm">Terreno (m²)</Label>
                <Input type="number" value={form.land_area} onChange={(e) => setForm({ ...form, land_area: Number(e.target.value) })} className="border-border bg-secondary" />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">URL da Imagem</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className="border-border bg-secondary" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-body text-sm">Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="border-border bg-secondary" />
            </div>

            <div className="space-y-2">
              <Label className="font-body text-sm">Características (separadas por vírgula)</Label>
              <Input value={featuresInput} onChange={(e) => setFeaturesInput(e.target.value)} placeholder="Piscina, Churrasqueira, Sauna" className="border-border bg-secondary" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body text-sm">Latitude</Label>
                <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="-23.5505" className="border-border bg-secondary" />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Longitude</Label>
                <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="-46.6333" className="border-border bg-secondary" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-body text-sm">URL Tour Virtual 360°</Label>
              <Input value={form.virtual_tour_url} onChange={(e) => setForm({ ...form, virtual_tour_url: e.target.value })} placeholder="https://..." className="border-border bg-secondary" />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.is_highlight} onCheckedChange={(v) => setForm({ ...form, is_highlight: v })} />
              <Label className="font-body text-sm">Destaque na página inicial</Label>
            </div>

            <Button onClick={handleSave} className="mt-2 w-full bg-gradient-gold font-body text-sm font-semibold uppercase tracking-wider text-primary-foreground">
              {editing ? "Salvar Alterações" : "Cadastrar Imóvel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Properties;
