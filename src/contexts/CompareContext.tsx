import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Property } from "@/data/properties";

type CompareProperty = Property & { slug?: string; rentalPrice?: number; acceptsPets?: boolean; furnished?: boolean };

interface CompareContextType {
  compareList: CompareProperty[];
  addToCompare: (property: CompareProperty) => void;
  removeFromCompare: (id: string) => void;
  isInCompare: (id: string) => boolean;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [compareList, setCompareList] = useState<CompareProperty[]>([]);

  const addToCompare = useCallback((property: CompareProperty) => {
    setCompareList((prev) => {
      if (prev.length >= 3) return prev;
      if (prev.some((p) => p.id === property.id)) return prev;
      return [...prev, property];
    });
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    setCompareList((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const isInCompare = useCallback((id: string) => compareList.some((p) => p.id === id), [compareList]);

  const clearCompare = useCallback(() => setCompareList([]), []);

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, isInCompare, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
};
