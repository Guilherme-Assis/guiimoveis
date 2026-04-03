import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";
import { propertyTypes, propertyStatuses, amenityOptions, PropertyType, PropertyStatus } from "@/data/properties";

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
  amenities: string[];
  neighborhood: string;
  acceptsPets: string;
  furnished: string;
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
  amenities: [],
  neighborhood: "",
  acceptsPets: "",
  furnished: "",
};

interface PropertyFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  resultCount: number;
  availableCities?: string[];
  availableStates?: string[];
  availableNeighborhoods?: string[];
}

const salePriceOptions = [
  { value: "", label: "Qualquer" },
  { value: "200000", label: "R$ 200K" },
  { value: "500000", label: "R$ 500K" },
  { value: "1000000", label: "R$ 1M" },
  { value: "3000000", label: "R$ 3M" },
  { value: "5000000", label: "R$ 5M" },
  { value: "10000000", label: "R$ 10M" },
  { value: "20000000", label: "R$ 20M" },
  { value: "50000000", label: "R$ 50M" },
];

const rentalPriceOptions = [
  { value: "", label: "Qualquer" },
  { value: "1000", label: "R$ 1.000" },
  { value: "2000", label: "R$ 2.000" },
  { value: "3000", label: "R$ 3.000" },
  { value: "5000", label: "R$ 5.000" },
  { value: "8000", label: "R$ 8.000" },
  { value: "10000", label: "R$ 10.000" },
  { value: "15000", label: "R$ 15.000" },
  { value: "25000", label: "R$ 25.000" },
  { value: "50000", label: "R$ 50.000" },
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

const yesNoOptions = [
  { value: "", label: "Todos" },
  { value: "true", label: "Sim" },
  { value: "false", label: "Não" },
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

const PropertyFilters = ({
  filters,
  onChange,
  resultCount,
  availableCities = [],
  availableStates = [],
  availableNeighborhoods = [],
}: PropertyFiltersProps) => {
  const [expanded, setExpanded] = useState(false);

  const update = (key: keyof FilterState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleAmenity = (amenity: string) => {
    const current = filters.amenities || [];
    const updated = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    onChange({ ...filters, amenities: updated });
  };

  const isRentalFilter = filters.status === "aluguel";
  const priceOptions = isRentalFilter ? rentalPriceOptions : salePriceOptions;

  const activeCount = Object.entries(filters).filter(
    ([key, val]) => {
      if (key === "sortBy") return false;
      if (key === "amenities") return (val as string[]).length > 0;
      return val !== "";
    }
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
                  options={[
                    { value: "", label: "Todas" },
                    ...availableCities.map((c) => ({ value: c, label: c })),
                  ]}
                />
                <SelectField
                  label="Estado"
                  value={filters.state}
                  onChange={(v) => update("state", v)}
                  options={[
                    { value: "", label: "Todos" },
                    ...availableStates.map((s) => ({ value: s, label: s })),
                  ]}
                />
                <SelectField
                  label="Quartos (mín.)"
                  value={filters.minBedrooms}
                  onChange={(v) => update("minBedrooms", v)}
                  options={bedroomOptions}
                />
                <SelectField
                  label={isRentalFilter ? "Aluguel Mínimo" : "Preço Mínimo"}
                  value={filters.minPrice}
                  onChange={(v) => update("minPrice", v)}
                  options={priceOptions}
                />
                <SelectField
                  label={isRentalFilter ? "Aluguel Máximo" : "Preço Máximo"}
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
                    { value: "50", label: "50m²" },
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
                {availableNeighborhoods.length > 0 && (
                  <SelectField
                    label="Bairro"
                    value={filters.neighborhood}
                    onChange={(v) => update("neighborhood", v)}
                    options={[
                      { value: "", label: "Todos" },
                      ...availableNeighborhoods.map((n) => ({ value: n, label: n })),
                    ]}
                  />
                )}
              </div>

              {/* Rental-specific filters */}
              {isRentalFilter && (
                <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                  <SelectField
                    label="Aceita Pets"
                    value={filters.acceptsPets}
                    onChange={(v) => update("acceptsPets", v)}
                    options={yesNoOptions}
                  />
                  <SelectField
                    label="Mobiliado"
                    value={filters.furnished}
                    onChange={(v) => update("furnished", v)}
                    options={yesNoOptions}
                  />
                </div>
              )}

              {/* Amenities Filter */}
              <div className="mt-4 pb-2">
                <label className="mb-2 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                  Comodidades
                </label>
                <div className="flex flex-wrap gap-2">
                  {amenityOptions.map((amenity) => {
                    const isActive = (filters.amenities || []).includes(amenity);
                    return (
                      <button
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        className={`flex items-center gap-1.5 border px-3 py-1.5 font-body text-xs transition-all ${
                          isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {isActive && <Check className="h-3 w-3" />}
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PropertyFilters;
