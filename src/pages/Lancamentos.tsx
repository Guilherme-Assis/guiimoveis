import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters, { FilterState, defaultFilters } from "@/components/PropertyFilters";
import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/data/properties";
import { Building2, MapPin, CalendarDays, TrendingUp } from "lucide-react";

const Lancamentos = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    status: "lançamento",
  });

  useEffect(() => {
    supabase
      .from("db_properties")
      .select("id,slug,title,type,status,price,location,city,state,bedrooms,bathrooms,parking_spaces,area,land_area,description,features,image_url,images,is_highlight")
      .eq("availability", "available")
      .eq("status", "lancamento")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setProperties(
            data.map((p: any) => ({
              id: p.id,
              slug: p.slug,
              title: p.title,
              type: p.type === "mansao" ? "mansão" : p.type,
              status: "lançamento" as const,
              price: Number(p.price),
              location: p.location,
              city: p.city,
              state: p.state,
              bedrooms: p.bedrooms,
              bathrooms: p.bathrooms,
              parkingSpaces: p.parking_spaces,
              area: Number(p.area),
              landArea: Number(p.land_area),
              description: p.description || "",
              features: p.features || [],
              image: p.image_url || "/placeholder.svg",
              images: p.images || [],
              isHighlight: p.is_highlight,
            }))
          );
        }
        setLoading(false);
      });

    document.title = "Lançamentos - Imóveis na Planta | Gui Imóveis";
    return () => { document.title = "Gui Imóveis"; };
  }, []);

  const availableCities = useMemo(() => [...new Set(properties.map((p) => p.city))].sort(), [properties]);
  const availableStates = useMemo(() => [...new Set(properties.map((p) => p.state))].sort(), [properties]);

  const filteredProperties = useMemo(() => {
    let result = [...properties];

    if (filters.type) result = result.filter((p) => p.type === filters.type);
    if (filters.city) result = result.filter((p) => p.city === filters.city);
    if (filters.state) result = result.filter((p) => p.state === filters.state);
    if (filters.minPrice) result = result.filter((p) => p.price >= Number(filters.minPrice));
    if (filters.maxPrice) result = result.filter((p) => p.price <= Number(filters.maxPrice));
    if (filters.minBedrooms) result = result.filter((p) => p.bedrooms >= Number(filters.minBedrooms));
    if (filters.minArea) result = result.filter((p) => (p.area || p.landArea) >= Number(filters.minArea));
    if (filters.maxArea) result = result.filter((p) => (p.area || p.landArea) <= Number(filters.maxArea));
    if (filters.amenities?.length > 0) {
      result = result.filter((p) =>
        filters.amenities.every((a) => p.features.some((f) => f.toLowerCase().includes(a.toLowerCase())))
      );
    }

    switch (filters.sortBy) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "area-desc": result.sort((a, b) => (b.area || b.landArea) - (a.area || a.landArea)); break;
      case "bedrooms-desc": result.sort((a, b) => b.bedrooms - a.bedrooms); break;
      default: result.sort((a, b) => (b.isHighlight ? 1 : 0) - (a.isHighlight ? 1 : 0));
    }

    return result;
  }, [filters, properties]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card pt-24 pb-16">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
        </div>
        <div className="container relative mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="bg-gradient-gold px-3 py-1 font-body text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                Na Planta
              </span>
            </div>
            <h1 className="mb-3 font-display text-3xl font-bold text-foreground md:text-5xl">
              Lançamentos Imobiliários
            </h1>
            <p className="mb-8 max-w-2xl font-body text-lg text-muted-foreground">
              Invista em imóveis na planta com condições exclusivas. Garanta seu imóvel novo,
              moderno e personalizável.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 rounded border border-border bg-background p-4">
                <CalendarDays className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-display text-lg font-semibold text-foreground">Pré-lançamento</p>
                  <p className="font-body text-xs text-muted-foreground">Preços especiais na fase inicial</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded border border-border bg-background p-4">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-display text-lg font-semibold text-foreground">Valorização</p>
                  <p className="font-body text-xs text-muted-foreground">Alto potencial de valorização</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded border border-border bg-background p-4">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-display text-lg font-semibold text-foreground">Personalização</p>
                  <p className="font-body text-xs text-muted-foreground">Escolha acabamentos e layout</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <PropertyFilters
        filters={filters}
        onChange={setFilters}
        resultCount={filteredProperties.length}
        availableCities={availableCities}
        availableStates={availableStates}
      />

      <section className="container mx-auto px-6 py-16">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="font-body text-muted-foreground">Carregando lançamentos...</p>
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property, i) => (
              <PropertyCard key={property.id} property={property} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-display text-2xl text-foreground">Nenhum lançamento encontrado</p>
            <p className="mt-2 font-body text-muted-foreground">
              Novos lançamentos em breve. Fique atento!
            </p>
            <Link to="/" className="mt-4 font-body text-primary hover:underline">
              Ver todos os imóveis
            </Link>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Lancamentos;
