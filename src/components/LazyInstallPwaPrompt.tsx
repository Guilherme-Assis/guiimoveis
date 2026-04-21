import { lazy, Suspense, useEffect, useState } from "react";

const InstallPwaPrompt = lazy(() => import("@/components/InstallPwaPrompt"));

export default function LazyInstallPwaPrompt() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const scheduleLoad = () => {
      if ("requestIdleCallback" in window) {
        const idleId = (window as Window & { requestIdleCallback: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number }).requestIdleCallback(
          () => setShouldLoad(true),
          { timeout: 4000 },
        );

        return () => {
          if ("cancelIdleCallback" in window) {
            (window as Window & { cancelIdleCallback: (handle: number) => void }).cancelIdleCallback(idleId);
          }
        };
      }

      const timeoutId = window.setTimeout(() => setShouldLoad(true), 3000);
      return () => window.clearTimeout(timeoutId);
    };

    if (document.readyState === "complete") {
      return scheduleLoad();
    }

    let cleanup: (() => void) | undefined;
    const handleLoad = () => {
      cleanup = scheduleLoad();
    };

    window.addEventListener("load", handleLoad, { once: true });
    return () => {
      window.removeEventListener("load", handleLoad);
      cleanup?.();
    };
  }, []);

  if (!shouldLoad) return null;

  return (
    <Suspense fallback={null}>
      <InstallPwaPrompt />
    </Suspense>
  );
}
