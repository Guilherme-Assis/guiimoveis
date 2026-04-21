import { lazy, Suspense, useEffect, useState } from "react";

const InstallPwaPrompt = lazy(() => import("@/components/InstallPwaPrompt"));

export default function LazyInstallPwaPrompt() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => setShouldLoad(true), 3000);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  if (!shouldLoad) return null;

  return (
    <Suspense fallback={null}>
      <InstallPwaPrompt />
    </Suspense>
  );
}
