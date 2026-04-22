import { lazy, Suspense, useEffect, useState, forwardRef } from "react";

const InstallPwaPrompt = lazy(() => import("@/components/InstallPwaPrompt"));

const InstallPwaPromptSlot = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref}>
    <InstallPwaPrompt />
  </div>
));

InstallPwaPromptSlot.displayName = "InstallPwaPromptSlot";

export default function LazyInstallPwaPrompt() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => setShouldLoad(true), 3000);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  if (!shouldLoad) return null;

  return (
    <Suspense fallback={null}>
      <InstallPwaPromptSlot />
    </Suspense>
  );
}
