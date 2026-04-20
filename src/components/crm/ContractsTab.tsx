import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText, Plus, ChevronRight, GripVertical, Trash2, Download, Eye,
  Copy, Search, Home, Key, ShieldCheck, AlertTriangle, DollarSign,
  Clock, Users, PawPrint, Sofa, Hammer, Scale, BookOpen, FileSignature,
} from "lucide-react";
import CrmHero from "./CrmHero";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

/* ─── Clause Data ─── */
interface Clause {
  id: string;
  title: string;
  content: string;
  category: "identificacao" | "objeto" | "financeiro" | "obrigacoes" | "garantias" | "rescisao" | "geral";
  contractType: "venda" | "aluguel" | "ambos";
  icon: typeof FileText;
}

const categoryLabels: Record<string, string> = {
  identificacao: "Identificação",
  objeto: "Objeto",
  financeiro: "Financeiro",
  obrigacoes: "Obrigações",
  garantias: "Garantias",
  rescisao: "Rescisão",
  geral: "Geral",
};

const categoryColors: Record<string, string> = {
  identificacao: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  objeto: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  financeiro: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  obrigacoes: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  garantias: "border-primary/40 bg-primary/10 text-primary",
  rescisao: "border-destructive/40 bg-destructive/10 text-destructive",
  geral: "border-muted-foreground/40 bg-muted/30 text-muted-foreground",
};

const defaultClauses: Clause[] = [
  // ── Identificação ──
  {
    id: "id-partes",
    title: "Qualificação das Partes",
    content: `VENDEDOR/LOCADOR: [Nome Completo], [nacionalidade], [estado civil], [profissão], portador(a) do RG nº [RG] e CPF nº [CPF], residente e domiciliado(a) à [endereço completo].\n\nCOMPRADOR/LOCATÁRIO: [Nome Completo], [nacionalidade], [estado civil], [profissão], portador(a) do RG nº [RG] e CPF nº [CPF], residente e domiciliado(a) à [endereço completo].`,
    category: "identificacao",
    contractType: "ambos",
    icon: Users,
  },
  // ── Objeto ──
  {
    id: "obj-imovel",
    title: "Descrição do Imóvel",
    content: `O presente contrato tem como objeto o imóvel situado à [endereço completo], registrado sob a matrícula nº [matrícula] do [Cartório de Registro de Imóveis], com área total de [área] m², contendo [quartos] dormitórios, [banheiros] banheiro(s) e [vagas] vaga(s) de garagem.`,
    category: "objeto",
    contractType: "ambos",
    icon: Home,
  },
  {
    id: "obj-estado",
    title: "Estado de Conservação",
    content: `O COMPRADOR/LOCATÁRIO declara ter vistoriado o imóvel e o recebe no estado em que se encontra, conforme laudo de vistoria anexo, que passa a fazer parte integrante deste contrato.`,
    category: "objeto",
    contractType: "ambos",
    icon: Eye,
  },
  // ── Financeiro - Venda ──
  {
    id: "fin-preco-venda",
    title: "Preço e Condições de Pagamento",
    content: `O preço total da venda é de R$ [valor] ([valor por extenso]), a ser pago da seguinte forma:\n\na) Sinal: R$ [valor do sinal] na assinatura deste contrato;\nb) Parcelas: [número] parcelas mensais de R$ [valor parcela], com vencimento todo dia [dia] de cada mês;\nc) Saldo restante: R$ [valor] na data da escritura definitiva.`,
    category: "financeiro",
    contractType: "venda",
    icon: DollarSign,
  },
  {
    id: "fin-escritura",
    title: "Escritura e Registro",
    content: `A escritura definitiva de compra e venda será lavrada no prazo de [prazo] dias após a quitação total do preço. As despesas com escritura, registro e ITBI serão de responsabilidade do COMPRADOR, salvo acordo diverso entre as partes.`,
    category: "financeiro",
    contractType: "venda",
    icon: BookOpen,
  },
  // ── Financeiro - Aluguel ──
  {
    id: "fin-aluguel",
    title: "Valor do Aluguel e Reajuste",
    content: `O valor mensal do aluguel é de R$ [valor] ([valor por extenso]), com vencimento todo dia [dia] de cada mês. O aluguel será reajustado anualmente pelo índice [IGP-M/IPCA], acumulado nos últimos 12 meses.`,
    category: "financeiro",
    contractType: "aluguel",
    icon: DollarSign,
  },
  {
    id: "fin-encargos",
    title: "Encargos (Condomínio, IPTU, Taxas)",
    content: `Além do aluguel, o LOCATÁRIO será responsável pelo pagamento de:\n\na) Condomínio: valor vigente de R$ [valor];\nb) IPTU: proporcional ao período locado;\nc) Taxas de consumo: água, energia elétrica, gás e demais serviços individuais.`,
    category: "financeiro",
    contractType: "aluguel",
    icon: DollarSign,
  },
  {
    id: "fin-deposito",
    title: "Caução / Depósito",
    content: `A título de garantia, o LOCATÁRIO depositará a quantia equivalente a [número] meses de aluguel, no valor de R$ [valor], que será devolvida ao término do contrato, descontados eventuais débitos ou reparos necessários, conforme vistoria de saída.`,
    category: "financeiro",
    contractType: "aluguel",
    icon: ShieldCheck,
  },
  {
    id: "fin-fiador",
    title: "Fiador",
    content: `Como garantia locatícia, apresenta-se como FIADOR: [Nome], CPF [CPF], proprietário do imóvel situado à [endereço], matrícula nº [matrícula]. O fiador responde solidariamente por todas as obrigações do LOCATÁRIO até a efetiva entrega das chaves.`,
    category: "financeiro",
    contractType: "aluguel",
    icon: Users,
  },
  // ── Obrigações ──
  {
    id: "obr-vendedor",
    title: "Obrigações do Vendedor",
    content: `O VENDEDOR se obriga a:\n\na) Entregar o imóvel livre e desembaraçado de quaisquer ônus ou dívidas;\nb) Apresentar certidões negativas de débitos;\nc) Comparecer para a lavratura da escritura na data acordada;\nd) Manter o imóvel em boas condições até a entrega efetiva.`,
    category: "obrigacoes",
    contractType: "venda",
    icon: Scale,
  },
  {
    id: "obr-comprador",
    title: "Obrigações do Comprador",
    content: `O COMPRADOR se obriga a:\n\na) Efetuar os pagamentos nas datas e valores estipulados;\nb) Arcar com as despesas de escritura, registro e ITBI;\nc) Respeitar as normas do condomínio, quando aplicável.`,
    category: "obrigacoes",
    contractType: "venda",
    icon: Scale,
  },
  {
    id: "obr-locador",
    title: "Obrigações do Locador",
    content: `O LOCADOR se obriga a:\n\na) Entregar o imóvel em perfeitas condições de uso;\nb) Responder pelos vícios ou defeitos anteriores à locação;\nc) Realizar reparos estruturais necessários;\nd) Fornecer recibos de pagamento ao LOCATÁRIO.`,
    category: "obrigacoes",
    contractType: "aluguel",
    icon: Scale,
  },
  {
    id: "obr-locatario",
    title: "Obrigações do Locatário",
    content: `O LOCATÁRIO se obriga a:\n\na) Pagar pontualmente o aluguel e encargos;\nb) Zelar pela conservação do imóvel;\nc) Não sublocar ou ceder o imóvel sem consentimento escrito do LOCADOR;\nd) Restituir o imóvel nas condições em que recebeu, conforme vistoria.`,
    category: "obrigacoes",
    contractType: "aluguel",
    icon: Scale,
  },
  {
    id: "obr-pets",
    title: "Permissão para Animais",
    content: `Fica autorizada a permanência de animais de estimação no imóvel, desde que o LOCATÁRIO/COMPRADOR se responsabilize por quaisquer danos causados ao imóvel e áreas comuns, bem como pelo cumprimento das regras condominiais relativas a animais.`,
    category: "obrigacoes",
    contractType: "ambos",
    icon: PawPrint,
  },
  {
    id: "obr-mobilia",
    title: "Inventário de Mobília",
    content: `O imóvel é entregue mobiliado conforme lista de inventário anexa a este contrato. O LOCATÁRIO/COMPRADOR se compromete a devolver/manter todos os itens listados em bom estado de conservação, ressalvado o desgaste natural pelo uso.`,
    category: "obrigacoes",
    contractType: "ambos",
    icon: Sofa,
  },
  {
    id: "obr-reformas",
    title: "Benfeitorias e Reformas",
    content: `Quaisquer benfeitorias ou reformas no imóvel somente poderão ser realizadas mediante autorização prévia e por escrito do proprietário. As benfeitorias necessárias serão indenizadas; as úteis, somente se autorizadas; as voluptuárias não serão indenizadas e poderão ser retiradas, desde que não danifiquem o imóvel.`,
    category: "obrigacoes",
    contractType: "ambos",
    icon: Hammer,
  },
  // ── Garantias ──
  {
    id: "gar-evic",
    title: "Garantia contra Evicção",
    content: `O VENDEDOR garante ao COMPRADOR a posse mansa e pacífica do imóvel, responsabilizando-se pela evicção, nos termos dos artigos 447 a 457 do Código Civil.`,
    category: "garantias",
    contractType: "venda",
    icon: ShieldCheck,
  },
  {
    id: "gar-seguro",
    title: "Seguro do Imóvel",
    content: `O LOCATÁRIO deverá contratar seguro incêndio do imóvel locado, com cobertura mínima equivalente ao valor de avaliação do imóvel, apresentando a apólice ao LOCADOR no prazo de [prazo] dias após a assinatura deste contrato.`,
    category: "garantias",
    contractType: "aluguel",
    icon: ShieldCheck,
  },
  // ── Rescisão ──
  {
    id: "res-venda",
    title: "Rescisão Contratual (Venda)",
    content: `Em caso de inadimplência do COMPRADOR por mais de [prazo] dias, o VENDEDOR poderá rescindir o presente contrato, retendo [percentual]% do valor já pago a título de multa compensatória e perdas e danos, restituindo o saldo remanescente.`,
    category: "rescisao",
    contractType: "venda",
    icon: AlertTriangle,
  },
  {
    id: "res-aluguel",
    title: "Rescisão Contratual (Aluguel)",
    content: `O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de [prazo] dias. Em caso de rescisão antecipada pelo LOCATÁRIO, será devida multa proporcional ao período restante, calculada sobre [número] meses de aluguel.`,
    category: "rescisao",
    contractType: "aluguel",
    icon: AlertTriangle,
  },
  {
    id: "res-multa",
    title: "Multa por Atraso",
    content: `O atraso no pagamento do aluguel ou parcelas implicará multa de [percentual]% sobre o valor devido, acrescido de juros moratórios de [percentual]% ao mês, calculados pro rata die.`,
    category: "rescisao",
    contractType: "ambos",
    icon: AlertTriangle,
  },
  // ── Geral ──
  {
    id: "ger-prazo",
    title: "Prazo do Contrato",
    content: `O presente contrato terá vigência de [prazo] meses, com início em [data início] e término em [data término], podendo ser renovado mediante acordo entre as partes.`,
    category: "geral",
    contractType: "aluguel",
    icon: Clock,
  },
  {
    id: "ger-foro",
    title: "Foro",
    content: `As partes elegem o foro da comarca de [cidade/UF] para dirimir quaisquer dúvidas ou litígios decorrentes do presente contrato, renunciando a qualquer outro, por mais privilegiado que seja.`,
    category: "geral",
    contractType: "ambos",
    icon: Scale,
  },
  {
    id: "ger-testemunhas",
    title: "Assinaturas e Testemunhas",
    content: `E por estarem assim justos e contratados, assinam o presente instrumento em [número] vias de igual teor e forma, na presença de duas testemunhas.\n\n[Cidade], [data].\n\n\n___________________________\nVENDEDOR/LOCADOR\n\n___________________________\nCOMPRADOR/LOCATÁRIO\n\nTestemunhas:\n\n1. ___________________________\nNome: \nCPF:\n\n2. ___________________________\nNome:\nCPF:`,
    category: "geral",
    contractType: "ambos",
    icon: Key,
  },
];

/* ─── Selected clause in the contract ─── */
interface SelectedClause {
  clauseId: string;
  content: string;
  order: number;
}

const ContractsTab = () => {
  const [contractType, setContractType] = useState<"venda" | "aluguel">("venda");
  const [contractTitle, setContractTitle] = useState("Contrato de Compra e Venda de Imóvel");
  const [selectedClauses, setSelectedClauses] = useState<SelectedClause[]>([]);
  const [searchClause, setSearchClause] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingClauseIdx, setEditingClauseIdx] = useState<number | null>(null);

  // Filter available clauses
  const availableClauses = defaultClauses.filter((c) => {
    const matchType = c.contractType === "ambos" || c.contractType === contractType;
    const matchSearch = !searchClause || c.title.toLowerCase().includes(searchClause.toLowerCase()) || c.content.toLowerCase().includes(searchClause.toLowerCase());
    const matchCategory = categoryFilter === "all" || c.category === categoryFilter;
    const alreadyAdded = selectedClauses.some((sc) => sc.clauseId === c.id);
    return matchType && matchSearch && matchCategory && !alreadyAdded;
  });

  const addClause = (clause: Clause) => {
    setSelectedClauses((prev) => [
      ...prev,
      { clauseId: clause.id, content: clause.content, order: prev.length + 1 },
    ]);
    toast({ title: `Cláusula "${clause.title}" adicionada` });
  };

  const removeClause = (idx: number) => {
    setSelectedClauses((prev) => prev.filter((_, i) => i !== idx).map((c, i) => ({ ...c, order: i + 1 })));
  };

  const updateClauseContent = (idx: number, content: string) => {
    setSelectedClauses((prev) => prev.map((c, i) => (i === idx ? { ...c, content } : c)));
  };

  const moveClause = (idx: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= selectedClauses.length) return;
    setSelectedClauses((prev) => {
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr.map((c, i) => ({ ...c, order: i + 1 }));
    });
  };

  const getClauseMeta = (clauseId: string) => defaultClauses.find((c) => c.id === clauseId);

  const handleContractTypeChange = (type: "venda" | "aluguel") => {
    setContractType(type);
    setContractTitle(
      type === "venda"
        ? "Contrato de Compra e Venda de Imóvel"
        : "Contrato de Locação de Imóvel"
    );
    // Remove clauses that don't match the new type
    setSelectedClauses((prev) =>
      prev
        .filter((sc) => {
          const meta = getClauseMeta(sc.clauseId);
          return meta && (meta.contractType === "ambos" || meta.contractType === type);
        })
        .map((c, i) => ({ ...c, order: i + 1 }))
    );
  };

  const generateFullText = () => {
    const header = `${contractTitle.toUpperCase()}\n${"═".repeat(50)}\n\n`;
    const body = selectedClauses
      .map((sc, i) => {
        const meta = getClauseMeta(sc.clauseId);
        return `CLÁUSULA ${i + 1}ª — ${meta?.title?.toUpperCase() || "CLÁUSULA"}\n\n${sc.content}`;
      })
      .join("\n\n" + "─".repeat(50) + "\n\n");
    return header + body;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateFullText());
    toast({ title: "Contrato copiado para a área de transferência" });
  };

  const downloadAsTxt = () => {
    const blob = new Blob([generateFullText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${contractTitle.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Contrato baixado com sucesso" });
  };

  const loadTemplate = () => {
    const templateClauses = defaultClauses
      .filter((c) => c.contractType === "ambos" || c.contractType === contractType)
      .map((c, i) => ({ clauseId: c.id, content: c.content, order: i + 1 }));
    setSelectedClauses(templateClauses);
    toast({ title: "Template completo carregado" });
  };

  return (
    <div className="space-y-6">
      <CrmHero
        icon={FileSignature}
        title="Contratos"
        subtitle="Monte contratos personalizados selecionando cláusulas"
        accent="sky"
        actions={
          <>
            <Select value={contractType} onValueChange={(v) => handleContractTypeChange(v as "venda" | "aluguel")}>
              <SelectTrigger className="w-44 border-border/40 bg-card/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venda">Compra e Venda</SelectItem>
                <SelectItem value="aluguel">Locação</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={loadTemplate} className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Carregar Template
            </Button>
            {selectedClauses.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)} className="gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> Visualizar
                </Button>
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1.5">
                  <Copy className="h-3.5 w-3.5" /> Copiar
                </Button>
                <Button size="sm" onClick={downloadAsTxt} className="gap-1.5 bg-gradient-to-r from-primary to-primary/80">
                  <Download className="h-3.5 w-3.5" /> Baixar
                </Button>
              </>
            )}
          </>
        }
      />

      {/* Main Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Clause Library */}
        <div className="lg:col-span-4">
          <Card className="border-border/40">
            <div className="border-b border-border/30 p-4">
              <h3 className="mb-3 font-display text-sm font-semibold text-foreground">Biblioteca de Cláusulas</h3>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cláusula..."
                    value={searchClause}
                    onChange={(e) => setSearchClause(e.target.value)}
                    className="h-8 border-border/40 bg-card/50 pl-8 text-xs"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 border-border/40 bg-card/50 text-xs">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ScrollArea className="h-[60vh]">
              <div className="space-y-1 p-2">
                {availableClauses.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <FileText className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">
                      {selectedClauses.length === defaultClauses.filter((c) => c.contractType === "ambos" || c.contractType === contractType).length
                        ? "Todas as cláusulas já foram adicionadas"
                        : "Nenhuma cláusula encontrada"}
                    </p>
                  </div>
                ) : (
                  availableClauses.map((clause) => (
                    <button
                      key={clause.id}
                      onClick={() => addClause(clause)}
                      className="group flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left transition-colors hover:bg-primary/5"
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <clause.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground">{clause.title}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${categoryColors[clause.category]}`}>
                            {categoryLabels[clause.category]}
                          </Badge>
                          {clause.contractType !== "ambos" && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/40 text-muted-foreground">
                              {clause.contractType === "venda" ? "Venda" : "Aluguel"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Plus className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Right: Contract Builder */}
        <div className="lg:col-span-8">
          <Card className="border-border/40">
            <div className="border-b border-border/30 p-4">
              <Input
                value={contractTitle}
                onChange={(e) => setContractTitle(e.target.value)}
                className="border-none bg-transparent p-0 font-display text-lg font-bold text-foreground focus-visible:ring-0"
              />
              <p className="mt-1 font-body text-xs text-muted-foreground">
                {selectedClauses.length} cláusula{selectedClauses.length !== 1 ? "s" : ""} selecionada{selectedClauses.length !== 1 ? "s" : ""}
              </p>
            </div>

            <ScrollArea className="h-[60vh]">
              {selectedClauses.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-20">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                    <FileText className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <div className="text-center">
                    <p className="font-display text-base font-semibold text-foreground">Comece a montar seu contrato</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Selecione cláusulas da biblioteca à esquerda ou carregue um template completo
                    </p>
                  </div>
                  <Button variant="outline" onClick={loadTemplate} className="gap-2">
                    <FileText className="h-4 w-4" /> Carregar Template Completo
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {selectedClauses.map((sc, idx) => {
                    const meta = getClauseMeta(sc.clauseId);
                    const isEditing = editingClauseIdx === idx;
                    return (
                      <div
                        key={`${sc.clauseId}-${idx}`}
                        className="group rounded-lg border border-border/30 bg-card/50 transition-all hover:border-border/60"
                      >
                        {/* Clause header */}
                        <div className="flex items-center gap-2 border-b border-border/20 px-3 py-2">
                          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${categoryColors[meta?.category || "geral"]}`}>
                            {sc.order}ª
                          </Badge>
                          <span className="flex-1 truncate text-xs font-semibold text-foreground">
                            {meta?.title || "Cláusula"}
                          </span>
                          <div className="flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => moveClause(idx, "up")}
                              disabled={idx === 0}
                            >
                              <ChevronRight className="h-3 w-3 -rotate-90" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => moveClause(idx, "down")}
                              disabled={idx === selectedClauses.length - 1}
                            >
                              <ChevronRight className="h-3 w-3 rotate-90" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-primary"
                              onClick={() => setEditingClauseIdx(isEditing ? null : idx)}
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => removeClause(idx)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Clause content */}
                        <div className="p-3">
                          {isEditing ? (
                            <Textarea
                              value={sc.content}
                              onChange={(e) => updateClauseContent(idx, e.target.value)}
                              className="min-h-[120px] border-border/30 bg-background/50 font-body text-xs leading-relaxed"
                            />
                          ) : (
                            <p className="whitespace-pre-wrap font-body text-xs leading-relaxed text-muted-foreground">
                              {sc.content}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-border/50 bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{contractTitle}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-6">
            {selectedClauses.map((sc, idx) => {
              const meta = getClauseMeta(sc.clauseId);
              return (
                <div key={idx}>
                  <h4 className="mb-2 font-display text-sm font-bold text-foreground">
                    CLÁUSULA {idx + 1}ª — {meta?.title?.toUpperCase()}
                  </h4>
                  <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-muted-foreground">
                    {sc.content}
                  </p>
                  {idx < selectedClauses.length - 1 && <div className="mt-4 border-t border-border/20" />}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractsTab;
