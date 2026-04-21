import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };

interface Filters {
  city?: string;
  type?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
}

const GUIDED_QUESTIONS = [
  { key: "status", question: "Você está procurando imóvel para **compra** ou **aluguel**?", options: ["Compra", "Aluguel", "Lançamento"] },
  { key: "type", question: "Qual **tipo de imóvel** você procura?", options: ["Casa", "Apartamento", "Cobertura", "Terreno", "Kitnet", "Outro"] },
  { key: "city", question: "Em qual **cidade** você deseja o imóvel?", options: null },
  { key: "bedrooms", question: "Quantos **quartos** você precisa?", options: ["1", "2", "3", "4+"] },
  { key: "budget", question: "Qual seu **orçamento máximo**?", options: ["Até R$ 300 mil", "R$ 300-500 mil", "R$ 500 mil - 1 milhão", "Acima de R$ 1 milhão"] },
];

const STATUS_MAP: Record<string, string> = { Compra: "venda", Aluguel: "aluguel", "Lançamento": "lancamento" };
const TYPE_MAP: Record<string, string> = { Casa: "casa", Apartamento: "apartamento", Cobertura: "cobertura", Terreno: "terreno", Kitnet: "kitnet" };
const BUDGET_MAP: Record<string, number> = { "Até R$ 300 mil": 300000, "R$ 300-500 mil": 500000, "R$ 500 mil - 1 milhão": 1000000, "Acima de R$ 1 milhão": 99999999 };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/property-chat`;

export default function PropertyChatWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [guidedDone, setGuidedDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(rafId);
  }, [messages, step]);

  const buildFilters = useCallback((): Filters => {
    const f: Filters = {};
    if (answers.status) f.status = STATUS_MAP[answers.status] || undefined;
    if (answers.type && answers.type !== "Outro") f.type = TYPE_MAP[answers.type] || undefined;
    if (answers.city) f.city = answers.city;
    if (answers.bedrooms) f.bedrooms = answers.bedrooms === "4+" ? 4 : parseInt(answers.bedrooms);
    if (answers.budget) f.maxPrice = BUDGET_MAP[answers.budget] || undefined;
    return f;
  }, [answers]);

  const streamChat = async (allMessages: Message[], filters: Filters) => {
    setLoading(true);
    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, filters }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro de conexão" }));
        if (resp.status === 429) toast.error("Muitas solicitações, tente novamente em alguns segundos.");
        else if (resp.status === 402) toast.error("Créditos de IA esgotados.");
        else toast.error(err.error || "Erro ao conectar com o assistente.");
        setLoading(false);
        return;
      }

      if (!resp.body) { setLoading(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch {
      toast.error("Erro de conexão com o assistente.");
    }
    setLoading(false);
  };

  const handleGuidedAnswer = (answer: string) => {
    const q = GUIDED_QUESTIONS[step];
    const newAnswers = { ...answers, [q.key]: answer };
    setAnswers(newAnswers);
    setMessages((prev) => [...prev, { role: "user", content: answer }]);

    if (step + 1 < GUIDED_QUESTIONS.length) {
      setStep(step + 1);
    } else {
      setGuidedDone(true);
      // Build summary and call AI
      const summary = `Estou procurando um imóvel para ${newAnswers.status || "compra"}, tipo ${newAnswers.type || "qualquer"}, na cidade ${newAnswers.city || "qualquer"}, com ${newAnswers.bedrooms || "qualquer número de"} quartos, orçamento ${newAnswers.budget || "sem limite"}.`;
      const allMsgs: Message[] = [{ role: "user", content: summary }];
      const f: Filters = {};
      if (newAnswers.status) f.status = STATUS_MAP[newAnswers.status];
      if (newAnswers.type && newAnswers.type !== "Outro") f.type = TYPE_MAP[newAnswers.type];
      if (newAnswers.city) f.city = newAnswers.city;
      if (newAnswers.bedrooms) f.bedrooms = newAnswers.bedrooms === "4+" ? 4 : parseInt(newAnswers.bedrooms);
      if (newAnswers.budget) f.maxPrice = BUDGET_MAP[newAnswers.budget];
      streamChat(allMsgs, f);
    }
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput("");
    streamChat(allMsgs, buildFilters());
  };

  const handleReset = () => {
    setMessages([]);
    setStep(0);
    setAnswers({});
    setGuidedDone(false);
    setInput("");
  };

  const currentQuestion = !guidedDone && step < GUIDED_QUESTIONS.length ? GUIDED_QUESTIONS[step] : null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground shadow-lg hover:opacity-90 transition-all animate-in fade-in slide-in-from-bottom-4"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium hidden sm:inline">Encontrar meu imóvel</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-2rem)] rounded-2xl border bg-background shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground rounded-t-2xl">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold text-sm">Assistente GUI Imóveis</span>
            </div>
            <div className="flex gap-1">
              <button onClick={handleReset} className="p-1.5 rounded-full hover:bg-primary-foreground/20 transition">
                <RotateCcw className="h-4 w-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-primary-foreground/20 transition">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Welcome message */}
            {messages.length === 0 && !guidedDone && (
              <div className="bg-muted rounded-xl p-3 text-sm">
                Olá! 👋 Sou o assistente virtual da <strong>GUI Imóveis</strong>. Vou te ajudar a encontrar o imóvel ideal! Responda algumas perguntas rápidas para começar.
              </div>
            )}

            {/* Rendered messages */}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted prose prose-sm max-w-none"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <ReactMarkdown
                      components={{
                        a: ({ href, children }) => (
                          <a href={href} className="text-primary underline font-medium" target={href?.startsWith("http") ? "_blank" : undefined}>
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-4 py-2 text-sm flex items-center gap-1">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse delay-100">●</span>
                  <span className="animate-pulse delay-200">●</span>
                </div>
              </div>
            )}

            {/* Guided question options */}
            {currentQuestion && !loading && (
              <div className="space-y-2">
                <div className="bg-muted rounded-xl p-3 text-sm">
                  <ReactMarkdown>{currentQuestion.question}</ReactMarkdown>
                </div>
                {currentQuestion.options ? (
                  <div className="flex flex-wrap gap-2">
                    {currentQuestion.options.map((opt) => (
                      <Button key={opt} size="sm" variant="outline" onClick={() => handleGuidedAnswer(opt)} className="text-xs">
                        {opt}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (input.trim()) {
                        handleGuidedAnswer(input.trim());
                        setInput("");
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Digite aqui..."
                      className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button size="sm" type="submit"><Send className="h-4 w-4" /></Button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Free chat input (after guided) */}
          {guidedDone && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 p-3 border-t"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte algo sobre imóveis..."
                disabled={loading}
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
              <Button size="sm" type="submit" disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
