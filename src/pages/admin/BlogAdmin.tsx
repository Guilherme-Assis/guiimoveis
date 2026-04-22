import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { slugify } from "@/lib/slugify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import KorretoraLoader from "@/components/KorretoraLoader";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

const emptyPost = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  is_published: false,
};

const BlogAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState(emptyPost);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("blog_posts").select("id, title, slug, excerpt, content, cover_image_url, is_published, published_at, created_at").order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyPost);
    setDialogOpen(true);
  };

  const openEdit = (p: Post) => {
    setEditing(p);
    setForm({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt || "",
      content: p.content,
      cover_image_url: p.cover_image_url || "",
      is_published: p.is_published,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Preencha título e conteúdo", variant: "destructive" });
      return;
    }

    const generatedSlug = form.slug.trim() || slugify(form.title);
    const payload = {
      title: form.title.trim(),
      slug: generatedSlug,
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      cover_image_url: form.cover_image_url.trim() || null,
      is_published: form.is_published,
      published_at: form.is_published ? new Date().toISOString() : null,
      author_id: user!.id,
    };

    if (editing) {
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Post atualizado!" });
    } else {
      const { error } = await supabase.from("blog_posts").insert(payload);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Post criado!" });
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este post?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    toast({ title: "Post excluído" });
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Blog</h1>
          <p className="font-body text-sm text-muted-foreground">Gerencie artigos e conteúdo SEO</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-gold font-body text-sm font-semibold uppercase tracking-wider text-primary-foreground">
          <Plus className="mr-1 h-4 w-4" /> Novo Post
        </Button>
      </div>

      {loading ? (
        <KorretoraLoader compact status="Carregando posts..." />
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="font-display text-xl text-foreground">Nenhum post ainda</p>
          <p className="mt-2 font-body text-sm text-muted-foreground">Comece escrevendo seu primeiro artigo.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="flex items-center justify-between border border-border bg-card p-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">{p.title}</h3>
                <p className="font-body text-xs text-muted-foreground">
                  /{p.slug} • {p.is_published ? "Publicado" : "Rascunho"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-6 items-center rounded-full px-2 font-body text-xs ${p.is_published ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
                  {p.is_published ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
                  {p.is_published ? "Público" : "Rascunho"}
                </span>
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
            <DialogTitle className="font-display text-xl">{editing ? "Editar Post" : "Novo Post"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="font-body text-sm">Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border-border bg-secondary" />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">Slug (URL)</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-gerado se vazio" className="border-border bg-secondary" />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">Resumo</Label>
              <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} className="border-border bg-secondary" maxLength={300} />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">URL da Imagem de Capa</Label>
              <Input value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="https://..." className="border-border bg-secondary" />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">Conteúdo *</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={12} className="border-border bg-secondary" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              <Label className="font-body text-sm">Publicar</Label>
            </div>
            <Button onClick={handleSave} className="mt-2 w-full bg-gradient-gold font-body text-sm font-semibold uppercase tracking-wider text-primary-foreground">
              {editing ? "Salvar" : "Criar Post"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogAdmin;
