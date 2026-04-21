import { lazy, Suspense } from "react";
import { useCompare } from "@/contexts/CompareContext";

const CompareBar = lazy(() => import("@/components/CompareBar"));

export default function LazyCompareBar() {
  const { compareList } = useCompare();

  if (compareList.length === 0) return null;

  return (
    <Suspense fallback={null}>
      <CompareBar />
    </Suspense>
  );
}
