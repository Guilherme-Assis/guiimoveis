import { useRef, useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PropertyFilters, { FilterState, defaultFilters } from "@/components/PropertyFilters";
import PropertyCard from "@/components/PropertyCard";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Property, typeLabelsMap } from "@/data/properties";
import { Link } from "react-router-dom";
import { slugifyCity } from "@/data/properties";
import { MapPin } from "lucide-react";

const Index = () => {
  const listingsRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [dbProperties, setDbProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("db_properties")
      .select("*")
      .eq("availability", "available")
      .then(({ data }) => {
        if (data) {
          setDbProperties(
            data.map((p: any) => ({
              id: p.id,
              slug: p.slug,
              title: p.title,
              type: p.type === "mansao" ? "mansão" : p.type,
              status: p.status === "lancamento" ? "lançamento" : p.status,
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
              rentalPrice: Number(p.rental_price) || 0,
              acceptsPets: p.accepts_pets || false,
              furnished: p.furnished || false,
            }))
          );
        }
        setLoading(false);
      });
  }, []);

  const availableCities = useMemo(() => [...new Set(dbProperties.map((p) => p.city))].sort(), [dbProperties]);
  const availableStates = useMemo(() => [...new Set(dbProperties.map((p) => p.state))].sort(), [dbProperties]);
  const availableNeighborhoods = useMemo(() => {
    let filtered = dbProperties;
    if (filters.city) filtered = filtered.filter((p) => p.city === filters.city);
    return [...new Set(filtered.map((p) => p.location))].sort();
  }, [dbProperties, filters.city]);

  const filteredProperties = useMemo(() => {
    let result = [...dbProperties];

    if (filters.type) result = result.filter((p) => p.type === filters.type);
    if (filters.status) result = result.filter((p) => p.status === filters.status);
    if (filters.city) result = result.filter((p) => p.city === filters.city);
    if (filters.state) result = result.filter((p) => p.state === filters.state);
    if (filters.neighborhood) result = result.filter((p) => p.location === filters.neighborhood);
    if (filters.minPrice) result = result.filter((p) => p.price >= Number(filters.minPrice));
    if (filters.maxPrice) result = result.filter((p) => p.price <= Number(filters.maxPrice));
    if (filters.minBedrooms) result = result.filter((p) => p.bedrooms >= Number(filters.minBedrooms));
    if (filters.minArea) {
      const min = Number(filters.minArea);
      result = result.filter((p) => (p.area || p.landArea) >= min);
    }
    if (filters.maxArea) {
      const max = Number(filters.maxArea);
      result = result.filter((p) => (p.area || p.landArea) <= max);
    }
    if (filters.amenities && filters.amenities.length > 0) {
      result = result.filter((p) =>
        filters.amenities.every((amenity) =>
          p.features.some((f) => f.toLowerCase().includes(amenity.toLowerCase()))
        )
      );
    }

    switch (filters.sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "area-desc":
        result.sort((a, b) => (b.area || b.landArea) - (a.area || a.landArea));
        break;
      case "bedrooms-desc":
        result.sort((a, b) => b.bedrooms - a.bedrooms);
        break;
      default:
        result.sort((a, b) => (b.isHighlight ? 1 : 0) - (a.isHighlight ? 1 : 0));
    }

    return result;
  }, [filters, dbProperties]);

  // Compute city groups for SEO links
  const cityGroups = useMemo(() => {
    const map = new Map<string, { city: string; state: string; count: number }>();
    dbProperties.forEach((p) => {
      const key = `${p.city}-${p.state}`;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
      } else {
        map.set(key, { city: p.city, state: p.state, count: 1 });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [dbProperties]);

  const scrollToListings = () => {
    listingsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection onScrollToListings={scrollToListings} />

      <div ref={listingsRef} id="listings">
        <PropertyFilters
          filters={filters}
          onChange={setFilters}
          resultCount={filteredProperties.length}
          availableCities={availableCities}
          availableStates={availableStates}
          availableNeighborhoods={availableNeighborhoods}
        />

        <section className="container mx-auto px-6 py-16">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="font-body text-muted-foreground">Carregando imóveis...</p>
            </div>
          ) : filteredProperties.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredProperties.map((property, i) => (
                <PropertyCard key={property.id} property={property} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="font-display text-2xl text-foreground">
                Nenhum imóvel encontrado
              </p>
              <p className="mt-2 font-body text-muted-foreground">
                Tente ajustar os filtros para encontrar o imóvel ideal.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* SEO City Links */}
      {cityGroups.length > 0 && (
        <section className="border-t border-border bg-card/50 py-16">
          <div className="container mx-auto px-6">
            <h2 className="mb-2 font-display text-2xl font-semibold text-foreground">
              Imóveis por Cidade
            </h2>
            <p className="mb-8 font-body text-sm text-muted-foreground">
              Encontre imóveis exclusivos nas principais cidades do Brasil
            </p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {cityGroups.map(({ city, state, count }) => (
                <Link
                  key={`${city}-${state}`}
                  to={`/imoveis/${slugifyCity(city, state)}`}
                  className="flex items-center gap-2 border border-border bg-card p-3 font-body text-sm text-foreground transition-all hover:border-primary hover:shadow-sm"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">
                    {city} - {state}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Index;
