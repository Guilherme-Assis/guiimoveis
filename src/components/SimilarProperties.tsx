import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PropertyCard from "@/components/PropertyCard";
import { Property } from "@/data/properties";

const COLUMNS = "id,slug,title,type,status,price,location,city,state,bedrooms,bathrooms,parking_spaces,area,land_area,image_url,is_highlight,rental_price,accepts_pets,furnished,features,open_for_partnership";

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

interface Props {
  propertyId: string;
  type: string;
  city: string;
  price: number;
}

const SimilarProperties = ({ propertyId, type, city, price }: Props) => {
  const { data: properties = [] } = useQuery({
    queryKey: ["similar", propertyId],
    queryFn: async () => {
      // Try same type + city first
      const { data } = await supabase
        .from("db_properties")
        .select(COLUMNS)
        .eq("availability", "available")
        .neq("id", propertyId)
        .eq("type", type as any)
        .eq("city", city)
        .gte("price", price * 0.5)
        .lte("price", price * 1.5)
        .limit(6);

      if (data && data.length >= 3) return data.map(mapRow);

      // Fallback: same city
      const { data: fallback } = await supabase
        .from("db_properties")
        .select(COLUMNS)
        .eq("availability", "available")
        .neq("id", propertyId)
        .eq("city", city)
        .limit(6);

      return (fallback || []).map(mapRow);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!propertyId,
  });

  if (properties.length === 0) return null;

  return (
    <section className="border-t border-border bg-card/50 py-16">
      <div className="container mx-auto px-6">
        <h2 className="mb-2 font-display text-2xl font-semibold text-foreground">
          Imóveis Semelhantes
        </h2>
        <p className="mb-8 font-body text-sm text-muted-foreground">
          Outros imóveis que podem te interessar
        </p>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {properties.slice(0, 6).map((p, i) => (
            <PropertyCard key={p.id} property={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SimilarProperties;
