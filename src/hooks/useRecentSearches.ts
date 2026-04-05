import { useState, useCallback } from "react";
import { FilterState, defaultFilters } from "@/components/PropertyFilters";

const STORAGE_KEY = "elite-recent-searches";
const MAX_RECENT = 5;

export interface SavedSearch {
  id: string;
  label: string;
  filters: FilterState;
  savedAt: number;
}

const buildLabel = (f: FilterState): string => {
  const parts: string[] = [];
  if (f.type) parts.push(f.type === "mansão" ? "Mansão" : f.type.charAt(0).toUpperCase() + f.type.slice(1));
  if (f.status) parts.push(f.status === "lançamento" ? "Lançamento" : f.status.charAt(0).toUpperCase() + f.status.slice(1));
  if (f.city) parts.push(f.city);
  if (f.neighborhood) parts.push(f.neighborhood);
  if (f.minBedrooms) parts.push(`${f.minBedrooms}+ quartos`);
  if (f.minPrice || f.maxPrice) {
    const min = f.minPrice ? `R$${Number(f.minPrice).toLocaleString("pt-BR")}` : "";
    const max = f.maxPrice ? `R$${Number(f.maxPrice).toLocaleString("pt-BR")}` : "";
    parts.push(min && max ? `${min}-${max}` : min || `até ${max}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Busca geral";
};

const isNonDefault = (f: FilterState): boolean => {
  return Object.keys(defaultFilters).some((key) => {
    const k = key as keyof FilterState;
    const dv = defaultFilters[k];
    const fv = f[k];
    if (Array.isArray(dv)) return (fv as string[]).length > 0;
    return fv !== dv;
  });
};

const loadSearches = (): SavedSearch[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

export const useRecentSearches = () => {
  const [searches, setSearches] = useState<SavedSearch[]>(loadSearches);

  const addSearch = useCallback((filters: FilterState) => {
    if (!isNonDefault(filters)) return;
    const label = buildLabel(filters);
    setSearches((prev) => {
      // Deduplicate by label
      const filtered = prev.filter((s) => s.label !== label);
      const newList = [
        { id: crypto.randomUUID(), label, filters, savedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
  }, []);

  const removeSearch = useCallback((id: string) => {
    setSearches((prev) => {
      const newList = prev.filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSearches([]);
  }, []);

  return { searches, addSearch, removeSearch, clearAll };
};
