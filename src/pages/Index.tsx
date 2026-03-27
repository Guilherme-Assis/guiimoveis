import { useRef, useState, useMemo } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PropertyFilters, { FilterState, defaultFilters } from "@/components/PropertyFilters";
import PropertyCard from "@/components/PropertyCard";
import Footer from "@/components/Footer";
import { properties } from "@/data/properties";

const Index = () => {
  const listingsRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const filteredProperties = useMemo(() => {
    let result = [...properties];

    if (filters.type) result = result.filter((p) => p.type === filters.type);
    if (filters.status) result = result.filter((p) => p.status === filters.status);
    if (filters.city) result = result.filter((p) => p.city === filters.city);
    if (filters.state) result = result.filter((p) => p.state === filters.state);
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
  }, [filters]);

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
        />

        <section className="container mx-auto px-6 py-16">
          {filteredProperties.length > 0 ? (
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

      <Footer />
    </div>
  );
};

export default Index;
