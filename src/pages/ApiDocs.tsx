import { useState, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Lock,
  Globe,
  Search,
  Play,
  LogIn,
  LogOut,
  Loader2,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;

interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  description: string;
  auth: boolean;
  requestBody?: Record<string, unknown>;
  queryParams?: { name: string; type: string; description: string; required?: boolean }[];
  responseExample?: unknown;
  tags: string[];
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "POST", path: "/auth/login", summary: "Login — obter token JWT", auth: false,
    description: "Autentica com email e senha. Retorna access_token e refresh_token para usar nos endpoints protegidos.",
    requestBody: { email: "seu@email.com", password: "sua_senha" },
    responseExample: { access_token: "eyJ...", refresh_token: "abc...", expires_in: 3600, token_type: "bearer", user: { id: "uuid", email: "seu@email.com" } },
    tags: ["Autenticação"],
  },
  {
    method: "POST", path: "/auth/refresh", summary: "Renovar token JWT", auth: false,
    description: "Renova um token expirado usando o refresh_token obtido no login.",
    requestBody: { refresh_token: "abc..." },
    responseExample: { access_token: "eyJ...", refresh_token: "new_abc...", expires_in: 3600, token_type: "bearer" },
    tags: ["Autenticação"],
  },
  {
    method: "GET", path: "/auth/me", summary: "Dados do usuário autenticado", auth: true,
    description: "Retorna informações do usuário logado, incluindo roles e perfil completo.",
    responseExample: { user: { id: "uuid", email: "user@email.com", roles: ["admin"], profile: { display_name: "João", avatar_url: null, phone: "11999999999" } } },
    tags: ["Autenticação"],
  },
  {
    method: "GET", path: "/properties", summary: "Listar imóveis disponíveis", auth: false,
    description: "Retorna lista de imóveis com filtros, paginação e ordenação. Acesso público.",
    queryParams: [
      { name: "limit", type: "number", description: "Máximo de registros (default: 50, max: 100)" },
      { name: "offset", type: "number", description: "Offset para paginação" },
      { name: "order", type: "string", description: "Ordenação: coluna.asc ou coluna.desc (ex: price.asc)" },
      { name: "select", type: "string", description: "Colunas: id,title,price,city" },
      { name: "eq.city", type: "string", description: "Filtrar por cidade exata" },
      { name: "eq.type", type: "string", description: "Tipo: casa, apartamento, cobertura, etc." },
      { name: "eq.status", type: "string", description: "Status: venda, aluguel, lancamento" },
      { name: "gte.price", type: "number", description: "Preço mínimo" },
      { name: "lte.price", type: "number", description: "Preço máximo" },
      { name: "gte.bedrooms", type: "number", description: "Quartos mínimos" },
      { name: "like.title", type: "string", description: "Busca parcial no título" },
    ],
    responseExample: { data: [{ id: "uuid", title: "Casa em Alphaville", price: 850000, city: "Barueri", bedrooms: 4 }], count: 1, limit: 50, offset: 0 },
    tags: ["Imóveis"],
  },
  {
    method: "GET", path: "/properties/{id}", summary: "Buscar imóvel por ID", auth: false,
    description: "Retorna detalhes completos de um imóvel específico.",
    responseExample: { data: { id: "uuid", title: "Casa em Alphaville", price: 850000, city: "Barueri" } },
    tags: ["Imóveis"],
  },
  {
    method: "GET", path: "/properties/by-slug?slug={slug}", summary: "Buscar imóvel por slug", auth: false,
    description: "Busca um imóvel pelo slug amigável para URL.",
    queryParams: [{ name: "slug", type: "string", description: "Slug do imóvel", required: true }],
    tags: ["Imóveis"],
  },
  {
    method: "POST", path: "/properties/search", summary: "Busca avançada de imóveis", auth: false,
    description: "Busca com filtros complexos via body JSON.",
    requestBody: { city: "São Paulo", type: "apartamento", status: "venda", minPrice: 300000, maxPrice: 800000, minBedrooms: 2, minArea: 60, limit: 20 },
    tags: ["Imóveis"],
  },
  {
    method: "POST", path: "/properties", summary: "Criar imóvel", auth: true,
    description: "Cria um novo imóvel. Requer permissão de admin ou corretor.",
    requestBody: { title: "Apartamento Centro", type: "apartamento", status: "venda", price: 450000, city: "São Paulo", state: "SP", location: "Centro", area: 75, bedrooms: 2, bathrooms: 1, parking_spaces: 1 },
    tags: ["Imóveis"],
  },
  {
    method: "PATCH", path: "/properties/{id}", summary: "Atualizar imóvel", auth: true,
    description: "Atualiza dados de um imóvel existente.",
    requestBody: { price: 500000, is_highlight: true },
    tags: ["Imóveis"],
  },
  {
    method: "DELETE", path: "/properties/{id}", summary: "Remover imóvel", auth: true,
    description: "Remove um imóvel. Requer permissão de admin ou do corretor proprietário.",
    tags: ["Imóveis"],
  },
  {
    method: "GET", path: "/brokers", summary: "Listar corretores ativos", auth: true,
    description: "Retorna lista de corretores. Requer autenticação.",
    tags: ["Corretores"],
  },
  {
    method: "GET", path: "/brokers/{id}", summary: "Buscar corretor por ID", auth: true,
    description: "Detalhes de um corretor específico.",
    tags: ["Corretores"],
  },
  {
    method: "POST", path: "/brokers", summary: "Criar corretor", auth: true,
    description: "Cria um novo corretor. Apenas admins.",
    requestBody: { user_id: "uuid", creci: "12345-SP", company_name: "Imobiliária ABC" },
    tags: ["Corretores"],
  },
  {
    method: "PATCH", path: "/brokers/{id}", summary: "Atualizar corretor", auth: true,
    description: "Atualiza dados do corretor.",
    requestBody: { company_name: "Nova Imobiliária", commission_rate: 6.0 },
    tags: ["Corretores"],
  },
  {
    method: "GET", path: "/leads", summary: "Listar leads", auth: true,
    description: "Retorna leads do corretor autenticado ou todos (admin).",
    queryParams: [
      { name: "eq.status", type: "string", description: "Status: novo, em_contato, qualificado, proposta, fechado, perdido" },
      { name: "eq.priority", type: "string", description: "Prioridade: baixa, media, alta" },
    ],
    tags: ["CRM"],
  },
  {
    method: "POST", path: "/leads", summary: "Criar lead", auth: true,
    description: "Cria um novo lead vinculado ao corretor.",
    requestBody: { broker_id: "uuid", name: "João Silva", email: "joao@email.com", phone: "11999999999", source: "site", status: "novo" },
    tags: ["CRM"],
  },
  {
    method: "PATCH", path: "/leads/{id}", summary: "Atualizar lead", auth: true,
    description: "Atualiza status, prioridade ou dados do lead.",
    requestBody: { status: "qualificado", priority: "alta" },
    tags: ["CRM"],
  },
  {
    method: "DELETE", path: "/leads/{id}", summary: "Remover lead", auth: true,
    description: "Remove um lead.",
    tags: ["CRM"],
  },
  {
    method: "GET", path: "/proposals", summary: "Listar propostas", auth: true,
    description: "Retorna propostas do corretor ou todas (admin).",
    tags: ["CRM"],
  },
  {
    method: "POST", path: "/proposals", summary: "Criar proposta", auth: true,
    description: "Cria uma nova proposta para um lead e imóvel.",
    requestBody: { broker_id: "uuid", lead_id: "uuid", property_id: "uuid", proposed_value: 750000, conditions: "Pagamento à vista", valid_until: "2025-12-31" },
    tags: ["CRM"],
  },
  {
    method: "PATCH", path: "/proposals/{id}", summary: "Atualizar proposta", auth: true,
    description: "Atualiza status ou valor da proposta.",
    requestBody: { status: "aceita", counter_value: 720000 },
    tags: ["CRM"],
  },
  {
    method: "GET", path: "/visits", summary: "Listar visitas", auth: true,
    description: "Retorna visitas agendadas/realizadas.",
    tags: ["CRM"],
  },
  {
    method: "POST", path: "/visits", summary: "Agendar visita", auth: true,
    description: "Cria um agendamento de visita.",
    requestBody: { broker_id: "uuid", lead_id: "uuid", property_id: "uuid", visit_date: "2025-06-15T14:00:00Z" },
    tags: ["CRM"],
  },
  {
    method: "PATCH", path: "/visits/{id}", summary: "Atualizar visita", auth: true,
    description: "Atualiza status ou feedback da visita.",
    requestBody: { status: "realizada", feedback: "Cliente muito interessado", interest_level: 5 },
    tags: ["CRM"],
  },
  {
    method: "GET", path: "/tasks", summary: "Listar tarefas", auth: true,
    description: "Retorna tarefas do corretor.",
    tags: ["CRM"],
  },
  {
    method: "POST", path: "/tasks", summary: "Criar tarefa", auth: true,
    description: "Cria uma nova tarefa.",
    requestBody: { broker_id: "uuid", title: "Ligar para cliente", type: "ligacao", priority: "alta", due_date: "2025-06-15T10:00:00Z" },
    tags: ["CRM"],
  },
  {
    method: "PATCH", path: "/tasks/{id}", summary: "Atualizar tarefa", auth: true,
    description: "Atualiza status da tarefa.",
    requestBody: { status: "concluida" },
    tags: ["CRM"],
  },
  {
    method: "GET", path: "/interactions", summary: "Listar interações", auth: true,
    description: "Retorna interações com leads.",
    tags: ["CRM"],
  },
  {
    method: "POST", path: "/interactions", summary: "Registrar interação", auth: true,
    description: "Registra uma interação com um lead.",
    requestBody: { broker_id: "uuid", lead_id: "uuid", type: "whatsapp", description: "Enviou mensagem de acompanhamento" },
    tags: ["CRM"],
  },
  {
    method: "GET", path: "/templates", summary: "Listar templates", auth: true,
    description: "Retorna templates de mensagem do corretor.",
    tags: ["CRM"],
  },
  {
    method: "POST", path: "/templates", summary: "Criar template", auth: true,
    description: "Cria um template de mensagem.",
    requestBody: { broker_id: "uuid", name: "Boas-vindas", category: "whatsapp", stage: "novo", body: "Olá {nome}, tudo bem?" },
    tags: ["CRM"],
  },
  {
    method: "GET", path: "/favorites", summary: "Listar favoritos", auth: true,
    description: "Retorna imóveis favoritados pelo usuário autenticado.",
    tags: ["Usuário"],
  },
  {
    method: "POST", path: "/favorites", summary: "Adicionar favorito", auth: true,
    description: "Adiciona um imóvel aos favoritos.",
    requestBody: { property_id: "uuid", user_id: "uuid" },
    tags: ["Usuário"],
  },
  {
    method: "DELETE", path: "/favorites/{id}", summary: "Remover favorito", auth: true,
    description: "Remove um imóvel dos favoritos.",
    tags: ["Usuário"],
  },
  {
    method: "GET", path: "/reviews", summary: "Listar avaliações", auth: true,
    description: "Retorna avaliações de corretores.",
    tags: ["Avaliações"],
  },
  {
    method: "POST", path: "/reviews", summary: "Criar avaliação", auth: true,
    description: "Avalia um corretor.",
    requestBody: { broker_id: "uuid", user_id: "uuid", rating: 5, comment: "Excelente atendimento!" },
    tags: ["Avaliações"],
  },
  {
    method: "GET", path: "/blog-posts", summary: "Listar posts do blog", auth: false,
    description: "Retorna posts publicados. Acesso público.",
    tags: ["Blog"],
  },
  {
    method: "POST", path: "/blog-posts", summary: "Criar post", auth: true,
    description: "Cria um novo post. Apenas admins.",
    requestBody: { author_id: "uuid", title: "Dicas de compra", slug: "dicas-de-compra", content: "Conteúdo do post...", is_published: true },
    tags: ["Blog"],
  },
  {
    method: "POST", path: "/property-views", summary: "Registrar visualização", auth: false,
    description: "Registra uma visualização de imóvel para analytics.",
    requestBody: { property_id: "uuid", session_id: "session-uuid" },
    tags: ["Analytics"],
  },
  {
    method: "GET", path: "/property-views/counts?days=30", summary: "Contagem de views", auth: true,
    description: "Retorna contagem de visualizações por imóvel. Admins e corretores.",
    queryParams: [{ name: "days", type: "number", description: "Período em dias (default: 30)" }],
    tags: ["Analytics"],
  },
  {
    method: "GET", path: "/profiles", summary: "Listar perfis", auth: true,
    description: "Retorna perfis de usuários. Admins vêem todos, usuários vêem o próprio.",
    tags: ["Usuário"],
  },
  {
    method: "PATCH", path: "/profiles/{id}", summary: "Atualizar perfil", auth: true,
    description: "Atualiza perfil do usuário.",
    requestBody: { display_name: "João Silva", phone: "11999999999", bio: "Corretor há 10 anos" },
    tags: ["Usuário"],
  },
  {
    method: "POST", path: "/upload/get_upload_url", summary: "Gerar URL de upload S3", auth: true,
    description: "Gera uma URL assinada para upload direto ao S3. Retorna upload_url (PUT), object_key e public_url.",
    requestBody: { filename: "foto.jpg" },
    responseExample: { upload_url: "https://s3.sa-east-1.amazonaws.com/...", object_key: "properties/uuid.jpg", public_url: "https://s3.sa-east-1.amazonaws.com/gui-imoveis/properties/uuid.jpg", expires_in: 900 },
    tags: ["Storage"],
  },
  {
    method: "POST", path: "/upload/get_read_url", summary: "Gerar URL de leitura S3", auth: true,
    description: "Gera uma URL assinada temporária para leitura/download de um objeto S3.",
    requestBody: { object_key: "properties/uuid.jpg" },
    responseExample: { read_url: "https://s3.sa-east-1.amazonaws.com/...?X-Amz-Signature=...", expires_in: 900 },
    tags: ["Storage"],
  },
  {
    method: "GET", path: "/upload/list?prefix=properties/", summary: "Listar objetos S3", auth: true,
    description: "Lista objetos no bucket S3 com prefixo opcional. Retorna XML do ListObjectsV2.",
    queryParams: [{ name: "prefix", type: "string", description: "Prefixo para filtrar (default: properties/)" }],
    responseExample: { data: "<ListBucketResult>...</ListBucketResult>" },
    tags: ["Storage"],
  },
  {
    method: "POST", path: "—", summary: "Chat com IA (property-chat)", auth: false,
    description: "Endpoint separado: /functions/v1/property-chat. Chat com IA para buscar imóveis.",
    requestBody: { messages: [{ role: "user", content: "Quero um apartamento em SP" }], filters: { city: "São Paulo" } },
    tags: ["IA"],
  },
  {
    method: "POST", path: "—", summary: "Leitura batch S3 (s3-read)", auth: false,
    description: "Endpoint separado: /functions/v1/s3-read. Gera URLs assinadas em lote (usado internamente pelo frontend).",
    requestBody: { keys: ["properties/image1.jpg", "properties/image2.jpg"] },
    tags: ["Storage"],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  POST: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  PATCH: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  PUT: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  DELETE: "bg-red-500/15 text-red-400 border-red-500/30",
};

const TAG_COLORS: Record<string, string> = {
  "Autenticação": "bg-rose-500/10 text-rose-400",
  "Imóveis": "bg-primary/10 text-primary",
  "Corretores": "bg-violet-500/10 text-violet-400",
  "CRM": "bg-sky-500/10 text-sky-400",
  "Usuário": "bg-emerald-500/10 text-emerald-400",
  "Avaliações": "bg-amber-500/10 text-amber-400",
  "Blog": "bg-pink-500/10 text-pink-400",
  "Analytics": "bg-cyan-500/10 text-cyan-400",
  "IA": "bg-purple-500/10 text-purple-400",
  "Storage": "bg-orange-500/10 text-orange-400",
};

const STATUS_COLORS: Record<number, string> = {
  200: "text-emerald-400",
  201: "text-emerald-400",
  400: "text-amber-400",
  401: "text-red-400",
  403: "text-red-400",
  404: "text-amber-400",
  500: "text-red-400",
};

const AuthPanel = ({
  token,
  userEmail,
  onLogin,
  onLogout,
}: {
  token: string | null;
  userEmail: string | null;
  onLogin: (email: string, password: string) => Promise<void>;
  onLogout: () => void;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await onLogin(email, password);
      toast.success("Autenticado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  if (token) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                <User className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="font-body text-xs text-emerald-400 font-semibold">Autenticado</p>
                <p className="font-mono text-[11px] text-muted-foreground truncate">{userEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowToken(!showToken)}
                className="text-muted-foreground hover:text-foreground text-xs h-7"
              >
                {showToken ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                Token
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-7"
              >
                <LogOut className="h-3 w-3 mr-1" /> Sair
              </Button>
            </div>
          </div>
          {showToken && (
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-background/80 border border-border/30 px-2 py-1.5 font-mono text-[10px] text-foreground overflow-x-auto max-h-16 block break-all">
                  {token}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(token);
                    toast.success("Token copiado!");
                  }}
                  className="shrink-0 rounded border border-border px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <LogIn className="h-4 w-4 text-amber-400" />
          <h3 className="font-display text-sm font-semibold text-foreground">Login para testar APIs protegidas</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-1">
            <Label className="font-body text-[11px] text-muted-foreground">E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@email.com"
              className="h-8 text-sm bg-background border-border"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <div className="space-y-1">
            <Label className="font-body text-[11px] text-muted-foreground">Senha</Label>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-8 text-sm bg-background border-border pr-8"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </div>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleLogin}
              disabled={loading || !email || !password}
              size="sm"
              className="h-8 bg-gradient-gold text-primary-foreground font-body text-xs font-semibold"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><LogIn className="h-3 w-3 mr-1" /> Entrar</>}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EndpointCard = ({
  endpoint,
  token,
}: {
  endpoint: Endpoint;
  token: string | null;
}) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tryOpen, setTryOpen] = useState(false);
  const [body, setBody] = useState(endpoint.requestBody ? JSON.stringify(endpoint.requestBody, null, 2) : "");
  const [pathOverride, setPathOverride] = useState("");
  const [response, setResponse] = useState<{ status: number; data: any; time: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const isExternal = endpoint.path.startsWith("—");

  const copyUrl = () => {
    const url = isExternal
      ? endpoint.description.match(/\/functions\/v1\/\S+/)?.[0] || ""
      : `${BASE_URL}${endpoint.path}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("URL copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  const executeRequest = useCallback(async () => {
    if (isExternal) {
      toast.error("Endpoint externo — use a URL diretamente.");
      return;
    }
    if (endpoint.auth && !token) {
      toast.error("Faça login primeiro para testar endpoints protegidos.");
      return;
    }

    setLoading(true);
    setResponse(null);

    const resolvedPath = pathOverride || endpoint.path;
    const url = `${BASE_URL}${resolvedPath}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const start = performance.now();
    try {
      const opts: RequestInit = { method: endpoint.method, headers };
      if (["POST", "PATCH", "PUT"].includes(endpoint.method) && body.trim()) {
        opts.body = body;
      }
      const res = await fetch(url, opts);
      const elapsed = Math.round(performance.now() - start);
      const data = await res.json().catch(() => null);
      setResponse({ status: res.status, data, time: elapsed });
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setResponse({ status: 0, data: { error: err.message }, time: elapsed });
    } finally {
      setLoading(false);
    }
  }, [endpoint, token, body, pathOverride, isExternal]);

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden transition-all hover:border-border/80">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-secondary/30 transition-colors"
      >
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
        <span className={`inline-flex w-16 shrink-0 items-center justify-center rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${METHOD_COLORS[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <code className="font-mono text-sm text-foreground flex-1 truncate">{endpoint.path}</code>
        <span className="hidden sm:inline font-body text-xs text-muted-foreground truncate max-w-[200px]">{endpoint.summary}</span>
        {endpoint.auth ? <Lock className="h-3.5 w-3.5 shrink-0 text-amber-400" /> : <Globe className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
      </button>

      {open && (
        <div className="border-t border-border/30 bg-secondary/10 p-4 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-display text-sm font-semibold text-foreground">{endpoint.summary}</h4>
              <p className="mt-1 font-body text-xs text-muted-foreground">{endpoint.description}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={copyUrl} className="flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} URL
              </button>
              {!isExternal && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTryOpen(!tryOpen)}
                  className={`h-7 text-[11px] gap-1 ${tryOpen ? "border-primary text-primary" : ""}`}
                >
                  <Play className="h-3 w-3" /> Try it
                </Button>
              )}
            </div>
          </div>

          {endpoint.auth && (
            <div className="flex items-center gap-2 rounded bg-amber-500/5 border border-amber-500/20 px-3 py-2">
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-body text-[11px] text-amber-300">
                Requer autenticação — {token ? "✅ Token ativo" : "⚠️ Faça login acima"}
              </span>
            </div>
          )}

          {endpoint.queryParams && endpoint.queryParams.length > 0 && (
            <div>
              <h5 className="font-body text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Query Parameters</h5>
              <div className="space-y-1">
                {endpoint.queryParams.map((p) => (
                  <div key={p.name} className="flex items-center gap-2 text-xs">
                    <code className="bg-background/50 px-1.5 py-0.5 rounded font-mono text-[11px] text-foreground">{p.name}</code>
                    <span className="text-muted-foreground/60">{p.type}</span>
                    {p.required && <Badge variant="outline" className="text-[9px] py-0 px-1 border-red-500/30 text-red-400">required</Badge>}
                    <span className="text-muted-foreground text-[11px]">{p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {endpoint.requestBody && (
            <div>
              <h5 className="font-body text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Request Body</h5>
              <pre className="rounded bg-background/80 border border-border/30 p-3 font-mono text-[11px] text-foreground overflow-x-auto">
                {JSON.stringify(endpoint.requestBody, null, 2)}
              </pre>
            </div>
          )}

          {endpoint.responseExample && (
            <div>
              <h5 className="font-body text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Response Example</h5>
              <pre className="rounded bg-background/80 border border-border/30 p-3 font-mono text-[11px] text-foreground overflow-x-auto">
                {JSON.stringify(endpoint.responseExample, null, 2)}
              </pre>
            </div>
          )}

          {/* ─── Try-it Panel ─── */}
          {tryOpen && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <h5 className="font-display text-xs font-semibold text-primary flex items-center gap-1.5">
                <Play className="h-3.5 w-3.5" /> Testar Endpoint
              </h5>

              <div className="space-y-2">
                <Label className="font-body text-[11px] text-muted-foreground">Path (edite para substituir {"{id}"}, {"{slug}"}, etc.)</Label>
                <Input
                  value={pathOverride || endpoint.path}
                  onChange={(e) => setPathOverride(e.target.value)}
                  className="h-7 font-mono text-xs bg-background border-border"
                />
              </div>

              {["POST", "PATCH", "PUT"].includes(endpoint.method) && (
                <div className="space-y-2">
                  <Label className="font-body text-[11px] text-muted-foreground">Body (JSON)</Label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                    className="w-full rounded border border-border bg-background px-3 py-2 font-mono text-[11px] text-foreground resize-y focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              <Button
                onClick={executeRequest}
                disabled={loading}
                size="sm"
                className="bg-primary text-primary-foreground font-body text-xs"
              >
                {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
                Executar {endpoint.method}
              </Button>

              {response && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className={`font-bold ${STATUS_COLORS[response.status] || "text-muted-foreground"}`}>
                      {response.status || "ERR"}
                    </span>
                    <span className="text-muted-foreground">{response.time}ms</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
                        toast.success("Response copiado!");
                      }}
                      className="ml-auto text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  <pre className="rounded bg-background border border-border/30 p-3 font-mono text-[11px] text-foreground overflow-x-auto max-h-80">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ApiDocs = () => {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setToken(data.session?.access_token || null);
    setUserEmail(data.user?.email || null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setToken(null);
    setUserEmail(null);
    toast.success("Desconectado");
  };

  const allTags = [...new Set(ENDPOINTS.flatMap((e) => e.tags))];

  const filtered = ENDPOINTS.filter((e) => {
    if (activeTag && !e.tags.includes(activeTag)) return false;
    if (search) {
      const s = search.toLowerCase();
      return e.summary.toLowerCase().includes(s) || e.path.toLowerCase().includes(s) || e.description.toLowerCase().includes(s);
    }
    return true;
  });

  const grouped = allTags
    .filter((tag) => !activeTag || tag === activeTag)
    .map((tag) => ({
      tag,
      endpoints: filtered.filter((e) => e.tags.includes(tag)),
    }))
    .filter((g) => g.endpoints.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-3xl font-bold text-foreground">API Documentation</h1>
            <Badge className="bg-primary/10 text-primary border-primary/30">v1.0</Badge>
          </div>
          <p className="font-body text-muted-foreground max-w-2xl">
            REST API completa para integração com a comunidade ÉLITE. Conecte seu app, divulgue imóveis e gerencie parcerias entre corretores autônomos. Todos os endpoints respeitam as políticas de segurança (RLS).
          </p>
        </div>

        <div className="mb-6">
          <AuthPanel token={token} userEmail={userEmail} onLogin={handleLogin} onLogout={handleLogout} />
        </div>

        <Card className="mb-6 border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <span className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">Base URL</span>
              <code className="flex-1 rounded bg-background border border-border/50 px-3 py-1.5 font-mono text-sm text-foreground">{BASE_URL}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(BASE_URL); toast.success("URL copiada!"); }}
                className="shrink-0 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-border/40">
          <CardContent className="p-4 space-y-2">
            <h3 className="font-display text-sm font-semibold text-foreground">Filtragem e Paginação</h3>
            <div className="grid gap-2 sm:grid-cols-2 text-xs font-body text-muted-foreground">
              <div><code className="text-foreground">?eq.campo=valor</code> — Igual</div>
              <div><code className="text-foreground">?gte.campo=valor</code> — Maior ou igual</div>
              <div><code className="text-foreground">?lte.campo=valor</code> — Menor ou igual</div>
              <div><code className="text-foreground">?like.campo=texto</code> — Busca parcial</div>
              <div><code className="text-foreground">?in.campo=a,b,c</code> — Lista de valores</div>
              <div><code className="text-foreground">?limit=20&offset=0</code> — Paginação</div>
              <div><code className="text-foreground">?order=price.desc</code> — Ordenação</div>
              <div><code className="text-foreground">?select=id,title</code> — Colunas específicas</div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar endpoints..."
              className="w-full rounded border border-border bg-background pl-10 pr-4 py-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTag(null)}
              className={`rounded-full px-3 py-1 font-body text-[11px] transition-colors ${!activeTag ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              Todos
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`rounded-full px-3 py-1 font-body text-[11px] transition-colors ${activeTag === tag ? "bg-primary text-primary-foreground" : TAG_COLORS[tag] || "bg-secondary text-muted-foreground"}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          {grouped.map(({ tag, endpoints }) => (
            <div key={tag}>
              <h2 className="mb-3 font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${TAG_COLORS[tag]?.split(" ")[0] || "bg-muted"}`} />
                {tag}
                <span className="font-body text-xs font-normal text-muted-foreground">({endpoints.length})</span>
              </h2>
              <div className="space-y-2">
                {endpoints.map((ep, i) => (
                  <EndpointCard key={`${ep.method}-${ep.path}-${i}`} endpoint={ep} token={token} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-body text-muted-foreground">Nenhum endpoint encontrado.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ApiDocs;
