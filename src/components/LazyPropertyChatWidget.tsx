import { lazy, Suspense, useState } from "react";
import { MessageCircle } from "lucide-react";

const PropertyChatWidget = lazy(() => import("@/components/PropertyChatWidget"));

const ChatFallback = () => (
  <div className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-primary shadow-[var(--shadow-gold)]">
    <MessageCircle className="h-5 w-5 animate-pulse" />
  </div>
);

export default function LazyPropertyChatWidget() {
  const [shouldLoad, setShouldLoad] = useState(false);

  if (!shouldLoad) {
    return (
      <button
        onClick={() => setShouldLoad(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground shadow-lg transition-all hover:opacity-90"
        aria-label="Abrir assistente de imóveis"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden text-sm font-medium sm:inline">Encontrar meu imóvel</span>
      </button>
    );
  }

  return (
    <Suspense fallback={<ChatFallback />}>
      <PropertyChatWidget defaultOpen />
    </Suspense>
  );
}
