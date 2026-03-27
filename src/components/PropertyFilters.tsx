import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { propertyTypes, propertyStatuses, cities, states, PropertyType, PropertyStatus } from "@/data/properties";

export interface FilterState {
  type: PropertyType | "";
  status: PropertyStatus | "";
  city: string;
  state: string;
  minPrice: string;
  maxPrice: string;
  minBedrooms: string;
  minArea: string;
  maxArea: string;
  sortBy: string;
}

export const defaultFilters: FilterState = {
  type: "",
  status: "",
  city: "",
  state: "",
  minPrice: "",
  maxPrice: "",
  minBedrooms: "",
  minArea: "",
  maxArea: "",
  sortBy: "relevance",
};

interface PropertyFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  resultCount: number;
}

const priceOptions = [
  { value: "", label: "Qualquer" },
  { value: "1000000", label: "R$ 1M" },
  { value: "3000000", label: "R$ 3M" },
  { value: "5000000", label: "R$ 5M" },
  { value: "10000000", label: "R$ 10M" },
  { value: "20000000", label: "R$ 20M" },
  { value: "50000000", label: "R$ 50M" },
];

const bedroomOptions = [
  { value: "", label: "Qualquer" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
  { value: "7", label: "7+" },
  { value: "10", label: "10+" },
];

const sortOptions = [
  { value: "relevance", label: "Relevância" },
  { value: "price-asc", label: "Menor Preço" },
  { value: "price-desc", label: "Maior Preço" },
  { value: "area-desc", label: "Maior Área" },
  { value: "bedrooms-desc", label: "Mais Quartos" },
];

const SelectField = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="font-body text-xs uppercase tracking-wider text-muted-foreground">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none border border-border bg-card px-3 py-2.5 pr-8 font-body text-sm text-foreground outline-none transition-colors focus:border-primary"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  </div>
);

const PropertyFilters = ({ filters, onChange, resultCount }: PropertyFiltersProps) => {
  const [expanded, setExpanded] = useState(false);

  const update = (key: keyof FilterState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const activeCount = Object.entries(filters).filter(
    ([key, val]) => val !== "" && key !== "sortBy"
  ).length;

  const clearAll = () => onChange({ ...defaultFilters });

  return (
    <div className="border-b border-border bg-card/50">
      <div className="container mx-auto px-6 py-4">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 border border-border px-4 py-2.5 font-body text-sm text-foreground transition-colors hover:border-primary"
            >
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Filtros
              {activeCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center bg-gradient-gold font-body text-xs font-bold text-primary-foreground">
                  {activeCount}
                </span>
              )}
            </button>

            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 font-body text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                <X className="h-3 w-3" />
                Limpar filtros
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="font-body text-sm text-muted-foreground">
              {resultCount} {resultCount === 1 ? "imóvel encontrado" : "imóveis encontrados"}
            </span>
            <SelectField
              label=""
              value={filters.sortBy}
              onChange={(v) => update("sortBy", v)}
              options={sortOptions}
            />
          </div>
        </div>

        {/* Expandable filters */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="luxury-divider my-4" />
              <div className="grid grid-cols-2 gap-4 pb-2 md:grid-cols-3 lg:grid-cols-5">
                <SelectField
                  label="Tipo"
                  value={filters.type}
                  onChange={(v) => update("type", v)}
                  options={[{ value: "", label: "Todos" }, ...propertyTypes]}
                />
                <SelectField
                  label="Finalidade"
                  value={filters.status}
                  onChange={(v) => update("status", v)}
                  options={[{ value: "", label: "Todas" }, ...propertyStatuses]}
                />
                <SelectField
                  label="Cidade"
                  value={filters.city}
                  onChange={(v) => update("city", v)}
                  options={[{ value: "", label: "Todas" }, ...cities.map((c) => ({ value: c, label: c }))]}
                />
                <SelectField
                  label="Estado"
                  value={filters.state}
                  onChange={(v) => update("state", v)}
                  options={[{ value: "", label: "Todos" }, ...states.map((s) => ({ value: s, label: s }))]}
                />
                <SelectField
                  label="Quartos (mín.)"
                  value={filters.minBedrooms}
                  onChange={(v) => update("minBedrooms", v)}
                  options={bedroomOptions}
                />
                <SelectField
                  label="Preço Mínimo"
                  value={filters.minPrice}
                  onChange={(v) => update("minPrice", v)}
                  options={priceOptions}
                />
                <SelectField
                  label="Preço Máximo"
                  value={filters.maxPrice}
                  onChange={(v) => update("maxPrice", v)}
                  options={priceOptions}
                />
                <SelectField
                  label="Área Mín. (m²)"
                  value={filters.minArea}
                  onChange={(v) => update("minArea", v)}
                  options={[
                    { value: "", label: "Qualquer" },
                    { value: "100", label: "100m²" },
                    { value: "300", label: "300m²" },
                    { value: "500", label: "500m²" },
                    { value: "1000", label: "1.000m²" },
                  ]}
                />
                <SelectField
                  label="Área Máx. (m²)"
                  value={filters.maxArea}
                  onChange={(v) => update("maxArea", v)}
                  options={[
                    { value: "", label: "Qualquer" },
                    { value: "500", label: "500m²" },
                    { value: "1000", label: "1.000m²" },
                    { value: "2000", label: "2.000m²" },
                    { value: "5000", label: "5.000m²" },
                  ]}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PropertyFilters;
