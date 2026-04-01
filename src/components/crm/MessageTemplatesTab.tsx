import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Mail, Copy, Phone, Plus, Edit, Trash2 } from "lucide-react";

const categoryColors: Record<string, string> = {
  whatsapp: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  email: "border-sky-500/40 bg-sky-500/10 text-sky-300",
};

const stageLabels: Record<string, string> = {
  novo: "Novo", em_contato: "Em Contato", qualificado: "Qualificado",
  proposta: "Proposta", fechado: "Fechado", perdido: "Perdido",
};

const defaultTemplates = [
  { name: "Primeiro Contato", category: "whatsapp" as const, stage: "novo", body: `Olá {{nome}}! 👋\n\nSou {{corretor}} da GUI Imóveis. Vi que você demonstrou interesse em imóveis na região de {{bairro}}.\n\nTenho ótimas opções que podem ser perfeitas para você! Posso te enviar algumas sugestões?\n\nAguardo seu retorno! 😊` },
  { name: "Agendamento de Visita", category: "whatsapp" as const, stage: "em_contato", body: `Olá {{nome}}! 🏡\n\nTenho disponibilidade para uma visita ao imóvel {{imovel}} nos seguintes horários:\n\n📅 {{data1}}\n📅 {{data2}}\n\nQual horário fica melhor para você?` },
  { name: "Pós-Visita", category: "whatsapp" as const, stage: "qualificado", body: `Olá {{nome}}! 😊\n\nEspero que tenha gostado da visita ao {{imovel}}!\n\nO que achou? Ficou com alguma dúvida?\n\nSe quiser, posso agendar outra visita ou apresentar opções similares.` },
  { name: "Envio de Proposta", category: "whatsapp" as const, stage: "proposta", body: `Olá {{nome}}! 📋\n\nPreparei a proposta para o {{imovel}}:\n\n💰 Valor: {{valor}}\n📝 Condições: {{condicoes}}\n\nA proposta é válida até {{validade}}.` },
  { name: "Primeiro Contato", category: "email" as const, stage: "novo", subject: "Bem-vindo(a) à GUI Imóveis!", body: `Olá {{nome}},\n\nSeja bem-vindo(a)! Sou {{corretor}}, consultor imobiliário da GUI Imóveis.\n\nRecebi seu interesse e ficarei feliz em ajudá-lo(a).\n\nAtenciosamente,\n{{corretor}}` },
  { name: "Proposta Comercial", category: "email" as const, stage: "proposta", subject: "Proposta Comercial - {{imovel}}", body: `Prezado(a) {{nome}},\n\nSegue a proposta comercial para o imóvel {{imovel}}:\n\n• Valor: {{valor}}\n• Condições: {{condicoes}}\n• Válida até: {{validade}}\n\nAtenciosamente,\n{{corretor}}` },
];

interface TemplateForm {
  name: string;
  category: "whatsapp" | "email";
  stage: string;
  subject: string;
  body: string;
}

const emptyForm: TemplateForm = { name: "", category: "whatsapp", stage: "", subject: "", body: "" };

const MessageTemplatesTab = () => {
  const { brokerId } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "whatsapp" | "email">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(emptyForm);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["message-templates", brokerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!brokerId,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: TemplateForm & { id?: string }) => {
      if (!brokerId) throw new Error("Broker não encontrado");
      const record = {
        broker_id: brokerId,
        name: payload.name.trim(),
        category: payload.category,
        stage: payload.stage.trim(),
        subject: payload.category === "email" ? payload.subject.trim() || null : null,
        body: payload.body.trim(),
      };
      if (payload.id) {
        const { error } = await supabase.from("message_templates").update(record).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("message_templates").insert(record);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      toast({ title: editingId ? "Template atualizado!" : "Template criado!" });
      closeDialog();
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("message_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      toast({ title: "Template excluído" });
    },
  });

  const seedDefaults = useMutation({
    mutationFn: async () => {
      if (!brokerId) throw new Error("Broker não encontrado");
      const records = defaultTemplates.map((t) => ({
        broker_id: brokerId,
        name: t.name,
        category: t.category,
        stage: t.stage,
        subject: t.subject || null,
        body: t.body,
      }));
      const { error } = await supabase.from("message_templates").insert(records);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      toast({ title: "Templates padrão adicionados!" });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setForm({ name: t.name, category: t.category, stage: t.stage, subject: t.subject || "", body: t.body });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.body.trim()) {
      toast({ title: "Preencha nome e corpo do template", variant: "destructive" });
      return;
    }
    saveMutation.mutate({ ...form, id: editingId || undefined });
  };

  const copyToClipboard = (t: any) => {
    const text = t.subject ? `Assunto: ${t.subject}\n\n${t.body}` : t.body;
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: `Template "${t.name}" copiado.` });
  };

  const filtered = filter === "all" ? templates : templates.filter((t: any) => t.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent">
            Templates de Mensagens
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Crie e gerencie modelos para WhatsApp e e-mail
          </p>
        </div>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button variant="outline" size="sm" onClick={() => seedDefaults.mutate()} disabled={seedDefaults.isPending} className="gap-1.5 text-xs border-border/40">
              <MessageSquare className="h-3.5 w-3.5" /> Carregar Padrões
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/20">
                <Plus className="h-3.5 w-3.5" /> Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border/50 bg-card">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{editingId ? "Editar Template" : "Novo Template"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Primeiro Contato" className="border-border/40 bg-card/50" maxLength={100} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Canal</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as any })}>
                      <SelectTrigger className="border-border/40 bg-card/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Etapa do Funil</Label>
                    <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                      <SelectTrigger className="border-border/40 bg-card/50"><SelectValue placeholder="Selecione a etapa" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="em_contato">Em Contato</SelectItem>
                        <SelectItem value="qualificado">Qualificado</SelectItem>
                        <SelectItem value="proposta">Proposta</SelectItem>
                        <SelectItem value="fechado">Fechado</SelectItem>
                        <SelectItem value="perdido">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {form.category === "email" && (
                  <div>
                    <Label>Assunto</Label>
                    <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Assunto do e-mail" className="border-border/40 bg-card/50" maxLength={200} />
                  </div>
                )}
                <div>
                  <Label>Corpo da Mensagem</Label>
                  <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Use {{nome}}, {{corretor}}, {{imovel}}, etc." rows={8} className="border-border/40 bg-card/50 font-body text-xs" maxLength={2000} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeDialog} className="border-border/40">Cancelar</Button>
                  <Button type="submit" disabled={saveMutation.isPending} className="bg-gradient-to-r from-primary to-primary/80">
                    {saveMutation.isPending ? "Salvando..." : editingId ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { id: "all" as const, label: "Todos", icon: MessageSquare },
          { id: "whatsapp" as const, label: "WhatsApp", icon: Phone },
          { id: "email" as const, label: "E-mail", icon: Mail },
        ].map((f) => (
          <Button
            key={f.id}
            variant={filter === f.id ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.id)}
            className={`gap-1.5 text-xs ${filter === f.id ? "bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/20" : "border-border/40"}`}
          >
            <f.icon className="h-3.5 w-3.5" /> {f.label}
          </Button>
        ))}
      </div>

      {/* Templates */}
      {isLoading ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando templates...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
            <div className="text-center">
              <p className="font-display text-lg font-semibold text-foreground">Nenhum template encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">Crie seu primeiro template ou carregue os modelos padrão</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((template: any) => (
            <Card key={template.id} className="border-border/30 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${categoryColors[template.category]}`}>
                      {template.category === "whatsapp" ? <Phone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{template.name}</p>
                      <div className="flex gap-1.5 mt-0.5">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${categoryColors[template.category]}`}>
                          {template.category === "whatsapp" ? "WhatsApp" : "E-mail"}
                        </Badge>
                        {template.stage && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/40 text-muted-foreground">
                            {template.stage}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => copyToClipboard(template)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEdit(template)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => { if (confirm("Excluir este template?")) deleteMutation.mutate(template.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {template.subject && (
                  <p className="text-xs font-medium text-muted-foreground mb-1">Assunto: {template.subject}</p>
                )}
                <pre className="whitespace-pre-wrap text-xs text-muted-foreground bg-muted/20 rounded-lg p-3 max-h-40 overflow-y-auto font-body leading-relaxed">
                  {template.body}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageTemplatesTab;
