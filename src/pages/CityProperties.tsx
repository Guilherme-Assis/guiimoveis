import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters, { FilterState, defaultFilters } from "@/components/PropertyFilters";
import { supabase } from "@/integrations/supabase/client";
import { Property, typeLabelsMap } from "@/data/properties";
import { MapPin, ArrowLeft } from "lucide-react";

const CityProperties = () => {
  const { citySlug } = useParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ ...defaultFilters });
  const [cityName, setCityName] = useState("");
  const [stateName, setStateName] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("db_properties")
        .select("id,slug,title,type,status,price,location,city,state,bedrooms,bathrooms,parking_spaces,area,land_area,description,features,image_url,images,is_highlight")
        .eq("availability", "available");

      if (data) {
        const allProps: (Property & { rawCity: string; rawState: string })[] = data.map((p: any) => ({
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
          rawCity: p.city,
          rawState: p.state,
        }));

        // Match city slug
        const normalize = (s: string) =>
          s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

        const matched = allProps.filter((p) => {
          const slug = normalize(`${p.rawState}-${p.rawCity}`);
          return slug === citySlug;
        });

        if (matched.length > 0) {
          setCityName(matched[0].rawCity);
          setStateName(matched[0].rawState);
        }

        setProperties(matched);
      }
      setLoading(false);
    };
    load();
  }, [citySlug]);

  const availableNeighborhoods = useMemo(
    () => [...new Set(properties.map((p) => p.location))].sort(),
    [properties]
  );

  const filteredProperties = useMemo(() => {
    let result = [...properties];

    if (filters.type) result = result.filter((p) => p.type === filters.type);
    if (filters.status) result = result.filter((p) => p.status === filters.status);
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
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "area-desc": result.sort((a, b) => (b.area || b.landArea) - (a.area || a.landArea)); break;
      case "bedrooms-desc": result.sort((a, b) => b.bedrooms - a.bedrooms); break;
      default: result.sort((a, b) => (b.isHighlight ? 1 : 0) - (a.isHighlight ? 1 : 0));
    }

    return result;
  }, [filters, properties]);

  const pageTitle = cityName ? `Imóveis em ${cityName} - ${stateName}` : "Imóveis";
  const pageDescription = cityName
    ? `Encontre os melhores imóveis à venda e para alugar em ${cityName}, ${stateName}. ${properties.length} imóveis disponíveis.`
    : "";

  // Set document title for SEO
  useEffect(() => {
    if (cityName) {
      document.title = `${pageTitle} | Gui Imóveis`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", pageDescription);
      } else {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = pageDescription;
        document.head.appendChild(meta);
      }
    }
    return () => {
      document.title = "Gui Imóveis";
    };
  }, [cityName, pageTitle, pageDescription]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* City Hero */}
      <section className="border-b border-border bg-card/50 pt-24 pb-12">
        <div className="container mx-auto px-6">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-2 font-body text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao início
          </Link>
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {cityName ? `Imóveis em ${cityName}` : "Carregando..."}
            </h1>
          </div>
          {cityName && (
            <p className="mt-2 font-body text-muted-foreground">
              {properties.length} {properties.length === 1 ? "imóvel disponível" : "imóveis disponíveis"} em{" "}
              {cityName}, {stateName}
            </p>
          )}
        </div>
      </section>

      <PropertyFilters
        filters={filters}
        onChange={setFilters}
        resultCount={filteredProperties.length}
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
            <p className="font-display text-2xl text-foreground">Nenhum imóvel encontrado</p>
            <p className="mt-2 font-body text-muted-foreground">
              {cityName
                ? `Não encontramos imóveis em ${cityName} com os filtros selecionados.`
                : "Cidade não encontrada."}
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

export default CityProperties;
