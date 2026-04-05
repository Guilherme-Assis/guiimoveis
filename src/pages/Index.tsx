import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PropertyFilters, { FilterState, defaultFilters } from "@/components/PropertyFilters";
import PropertyCard from "@/components/PropertyCard";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/data/properties";
import { Link } from "react-router-dom";
import { slugifyCity } from "@/data/properties";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 18;

const mapRow = (p: any): Property & { rentalPrice: number; acceptsPets: boolean; furnished: boolean; openForPartnership: boolean } => ({
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
  description: "",
  features: p.features || [],
  image: p.image_url || "/placeholder.svg",
  images: [],
  isHighlight: p.is_highlight,
  rentalPrice: Number(p.rental_price) || 0,
  acceptsPets: p.accepts_pets || false,
  furnished: p.furnished || false,
  openForPartnership: p.open_for_partnership || false,
});

const LISTING_COLUMNS = "id,slug,title,type,status,price,location,city,state,bedrooms,bathrooms,parking_spaces,area,land_area,image_url,is_highlight,rental_price,accepts_pets,furnished,features,open_for_partnership";

const Index = () => {
  const listingsRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [dbProperties, setDbProperties] = useState<(Property & { rentalPrice: number; acceptsPets: boolean; furnished: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Separate query for filter options (cities/states/neighborhoods) — lightweight
  const [filterOptions, setFilterOptions] = useState<{ city: string; state: string; location: string }[]>([]);

  useEffect(() => {
    supabase
      .from("db_properties")
      .select("city,state,location")
      .eq("availability", "available")
      .then(({ data }) => {
        if (data) setFilterOptions(data as any);
      });
  }, []);

  // Main data fetch with server-side filtering & pagination
  const fetchProperties = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("db_properties")
      .select(LISTING_COLUMNS, { count: "exact" })
      .eq("availability", "available");

    // Apply server-side filters
    if (filters.type) query = query.eq("type", filters.type === "mansão" ? "mansao" : filters.type);
    if (filters.status) query = query.eq("status", filters.status === "lançamento" ? "lancamento" : filters.status);
    if (filters.city) query = query.eq("city", filters.city);
    if (filters.state) query = query.eq("state", filters.state);
    if (filters.neighborhood) query = query.eq("location", filters.neighborhood);
    if (filters.minBedrooms) query = query.gte("bedrooms", Number(filters.minBedrooms));
    if (filters.acceptsPets === "true") query = query.eq("accepts_pets", true);
    if (filters.acceptsPets === "false") query = query.eq("accepts_pets", false);
    if (filters.furnished === "true") query = query.eq("furnished", true);
    if (filters.furnished === "false") query = query.eq("furnished", false);

    // Price filters
    if (filters.minPrice) {
      const isRental = filters.status === "aluguel";
      if (isRental) {
        query = query.gte("rental_price", Number(filters.minPrice));
      } else {
        query = query.gte("price", Number(filters.minPrice));
      }
    }
    if (filters.maxPrice) {
      const isRental = filters.status === "aluguel";
      if (isRental) {
        query = query.lte("rental_price", Number(filters.maxPrice));
      } else {
        query = query.lte("price", Number(filters.maxPrice));
      }
    }

    // Area filters
    if (filters.minArea) query = query.gte("area", Number(filters.minArea));
    if (filters.maxArea) query = query.lte("area", Number(filters.maxArea));

    // Sorting
    switch (filters.sortBy) {
      case "price-asc":
        query = query.order("price", { ascending: true });
        break;
      case "price-desc":
        query = query.order("price", { ascending: false });
        break;
      case "area-desc":
        query = query.order("area", { ascending: false });
        break;
      case "bedrooms-desc":
        query = query.order("bedrooms", { ascending: false });
        break;
      default:
        query = query.order("is_highlight", { ascending: false }).order("created_at", { ascending: false });
    }

    // Pagination
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, count } = await query;

    if (data) {
      setDbProperties(data.map(mapRow));
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  }, [filters, currentPage]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const availableCities = useMemo(() => [...new Set(filterOptions.map((p) => p.city))].sort(), [filterOptions]);
  const availableStates = useMemo(() => [...new Set(filterOptions.map((p) => p.state))].sort(), [filterOptions]);
  const availableNeighborhoods = useMemo(() => {
    let filtered = filterOptions;
    if (filters.city) filtered = filtered.filter((p) => p.city === filters.city);
    return [...new Set(filtered.map((p) => p.location))].sort();
  }, [filterOptions, filters.city]);

  // Client-side amenity filtering (features are arrays, hard to filter server-side)
  const displayProperties = useMemo(() => {
    let result = dbProperties;
    if (filters.amenities && filters.amenities.length > 0) {
      result = result.filter((p) =>
        filters.amenities.every((amenity) =>
          p.features.some((f) => f.toLowerCase().includes(amenity.toLowerCase()))
        )
      );
    }
    return result;
  }, [dbProperties, filters.amenities]);

  // City groups for SEO
  const cityGroups = useMemo(() => {
    const map = new Map<string, { city: string; state: string; count: number }>();
    filterOptions.forEach((p) => {
      const key = `${p.city}-${p.state}`;
      const existing = map.get(key);
      if (existing) existing.count++;
      else map.set(key, { city: p.city, state: p.state, count: 1 });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filterOptions]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const scrollToListings = () => {
    listingsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    listingsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection onScrollToListings={scrollToListings} />

      <div ref={listingsRef} id="listings">
        <PropertyFilters
          filters={filters}
          onChange={setFilters}
          resultCount={totalCount}
          availableCities={availableCities}
          availableStates={availableStates}
          availableNeighborhoods={availableNeighborhoods}
        />

        <section className="container mx-auto px-6 py-16">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="font-body text-muted-foreground">Carregando imóveis...</p>
            </div>
          ) : displayProperties.length > 0 ? (
            <>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {displayProperties.map((property, i) => (
                  <PropertyCard key={property.id} property={property} index={i} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-12 flex items-center justify-center gap-1" aria-label="Paginação">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {pageNumbers.map((page, idx) =>
                    page === "..." ? (
                      <span key={`dots-${idx}`} className="px-2 font-body text-sm text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="icon"
                        onClick={() => goToPage(page)}
                        aria-current={currentPage === page ? "page" : undefined}
                        className="h-9 w-9"
                      >
                        {page}
                      </Button>
                    )
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Próxima página"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </nav>
              )}
            </>
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
