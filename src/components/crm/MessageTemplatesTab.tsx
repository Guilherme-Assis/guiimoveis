import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Mail, Copy, Phone, Handshake, Home, Star, Clock } from "lucide-react";

interface Template {
  id: string;
  name: string;
  category: "whatsapp" | "email";
  stage: string;
  icon: any;
  subject?: string;
  body: string;
}

const templates: Template[] = [
  {
    id: "wpp-primeiro-contato",
    name: "Primeiro Contato",
    category: "whatsapp",
    stage: "Novo",
    icon: Phone,
    body: `Olá {{nome}}! 👋\n\nSou {{corretor}} da GUI Imóveis. Vi que você demonstrou interesse em imóveis na região de {{bairro}}.\n\nTenho ótimas opções que podem ser perfeitas para você! Posso te enviar algumas sugestões?\n\nAguardo seu retorno! 😊`,
  },
  {
    id: "wpp-agendamento-visita",
    name: "Agendamento de Visita",
    category: "whatsapp",
    stage: "Em Contato",
    icon: Home,
    body: `Olá {{nome}}! 🏡\n\nTenho disponibilidade para uma visita ao imóvel {{imovel}} nos seguintes horários:\n\n📅 {{data1}}\n📅 {{data2}}\n\nQual horário fica melhor para você?\n\nAbraços! 😊`,
  },
  {
    id: "wpp-pos-visita",
    name: "Pós-Visita / Follow-up",
    category: "whatsapp",
    stage: "Qualificado",
    icon: Star,
    body: `Olá {{nome}}! 😊\n\nEspero que tenha gostado da visita ao {{imovel}}!\n\nO que achou? Ficou com alguma dúvida?\n\nSe quiser, posso agendar outra visita ou apresentar opções similares.\n\nEstou à disposição! 🏡`,
  },
  {
    id: "wpp-proposta",
    name: "Envio de Proposta",
    category: "whatsapp",
    stage: "Proposta",
    icon: Handshake,
    body: `Olá {{nome}}! 📋\n\nPreparei a proposta para o {{imovel}} conforme conversamos:\n\n💰 Valor: {{valor}}\n📝 Condições: {{condicoes}}\n\nA proposta é válida até {{validade}}. Posso esclarecer qualquer dúvida!\n\nAbraços! 🤝`,
  },
  {
    id: "wpp-reativacao",
    name: "Reativação de Lead",
    category: "whatsapp",
    stage: "Perdido",
    icon: Clock,
    body: `Olá {{nome}}! 👋\n\nFaz um tempo que conversamos sobre imóveis. Surgiram novas oportunidades na região que podem te interessar!\n\nGostaria de receber novidades? Estou à disposição! 😊`,
  },
  {
    id: "email-primeiro-contato",
    name: "Primeiro Contato",
    category: "email",
    stage: "Novo",
    icon: Mail,
    subject: "Bem-vindo(a) à GUI Imóveis - Encontre seu imóvel ideal!",
    body: `Olá {{nome}},\n\nSeja bem-vindo(a)! Sou {{corretor}}, consultor imobiliário da GUI Imóveis.\n\nRecebi seu interesse em imóveis na região de {{bairro}} e ficarei feliz em ajudá-lo(a) a encontrar a opção perfeita.\n\nPosso agendar uma conversa para entender melhor suas preferências?\n\nAtenciosamente,\n{{corretor}}\nGUI Imóveis`,
  },
  {
    id: "email-proposta",
    name: "Proposta Comercial",
    category: "email",
    stage: "Proposta",
    icon: Handshake,
    subject: "Proposta Comercial - {{imovel}}",
    body: `Prezado(a) {{nome}},\n\nConforme nossa conversa, segue a proposta comercial para o imóvel {{imovel}}:\n\n• Valor proposto: {{valor}}\n• Condições: {{condicoes}}\n• Válida até: {{validade}}\n\nFico à disposição para qualquer esclarecimento.\n\nAtenciosamente,\n{{corretor}}\nGUI Imóveis`,
  },
  {
    id: "email-pos-venda",
    name: "Pós-Venda",
    category: "email",
    stage: "Fechado",
    icon: Star,
    subject: "Parabéns pela aquisição! - GUI Imóveis",
    body: `Prezado(a) {{nome}},\n\nParabéns pela aquisição do seu novo imóvel! 🎉\n\nFoi um prazer acompanhá-lo(a) nessa jornada. Se precisar de qualquer suporte ou tiver dúvidas sobre o processo, estou à disposição.\n\nSe conhece alguém buscando um imóvel, ficarei feliz em ajudar também!\n\nUm grande abraço,\n{{corretor}}\nGUI Imóveis`,
  },
];

const categoryColors: Record<string, string> = {
  whatsapp: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  email: "border-sky-500/40 bg-sky-500/10 text-sky-300",
};

const MessageTemplatesTab = () => {
  const [filter, setFilter] = useState<"all" | "whatsapp" | "email">("all");

  const filtered = filter === "all" ? templates : templates.filter((t) => t.category === filter);

  const copyToClipboard = (template: Template) => {
    const text = template.subject ? `Assunto: ${template.subject}\n\n${template.body}` : template.body;
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: `Template "${template.name}" copiado para a área de transferência.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent">
            Templates de Mensagens
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Modelos prontos para WhatsApp e e-mail
          </p>
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
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((template) => (
          <Card key={template.id} className="border-border/30 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${categoryColors[template.category]}`}>
                    <template.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{template.name}</p>
                    <div className="flex gap-1.5 mt-0.5">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${categoryColors[template.category]}`}>
                        {template.category === "whatsapp" ? "WhatsApp" : "E-mail"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/40 text-muted-foreground">
                        {template.stage}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => copyToClipboard(template)}>
                  <Copy className="h-4 w-4" />
                </Button>
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
    </div>
  );
};

export default MessageTemplatesTab;
