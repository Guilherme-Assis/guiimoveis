import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, Plus } from "lucide-react";
const logoKorretora = "/logo-korretora.webp";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = "korretora_pwa_dismissed_at";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  // iOS Safari
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window.navigator as any).standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

const InstallPwaPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    // Não exibir dentro do editor/preview iframe
    if (isInIframe()) return;
    // Já instalado
    if (isStandalone()) return;

    // Respeitar dispensa recente
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_TTL_MS) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // pequeno delay para não atrapalhar a primeira impressão
      setTimeout(() => setVisible(true), 1500);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // iOS não dispara beforeinstallprompt — mostrar instruções manuais
    if (isIos() && !isStandalone()) {
      setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, 2000);
    }

    const installedHandler = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 220 }}
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md sm:inset-x-auto sm:right-4 sm:bottom-4"
        >
          <div className="rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-xl">
            <button
              onClick={handleDismiss}
              aria-label="Dispensar"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
                <img src={logoKorretora} alt="KORRETORA" className="h-10 w-10 object-contain" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-base font-semibold text-foreground">
                  Instalar KORRETORA
                </h3>
                <p className="mt-0.5 font-body text-xs text-muted-foreground">
                  {iosHint
                    ? "Adicione à sua tela de início para acesso rápido."
                    : "Instale o app para acesso direto da tela inicial."}
                </p>
              </div>
            </div>

            {iosHint ? (
              <div className="mt-3 space-y-2 rounded-xl bg-muted/40 p-3">
                <div className="flex items-center gap-2 font-body text-xs text-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Share className="h-3.5 w-3.5" />
                  </span>
                  <span>1. Toque em <strong>Compartilhar</strong> no Safari</span>
                </div>
                <div className="flex items-center gap-2 font-body text-xs text-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                  <span>2. Escolha <strong>Adicionar à Tela de Início</strong></span>
                </div>
                <button
                  onClick={handleDismiss}
                  className="mt-1 w-full rounded-lg border border-border bg-background py-2 font-body text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary/50"
                >
                  Entendi
                </button>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 rounded-lg border border-border bg-background py-2 font-body text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                >
                  Agora não
                </button>
                <button
                  onClick={handleInstall}
                  className="flex flex-[1.4] items-center justify-center gap-2 rounded-lg bg-primary py-2 font-body text-xs uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Download className="h-3.5 w-3.5" /> Instalar
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPwaPrompt;
