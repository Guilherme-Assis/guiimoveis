import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import KorretoraLoader from "@/components/KorretoraLoader";

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    if (!user) { setProperties([]); setLoading(false); return; }
    setLoading(true);

    const { data: favs } = await supabase
      .from("favorites")
      .select("property_id")
      .eq("user_id", user.id);

    if (favs && favs.length > 0) {
      const ids = favs.map((f) => f.property_id);
      const { data: props } = await supabase
        .from("db_properties")
        .select("id,slug,title,type,status,price,location,city,state,bedrooms,bathrooms,parking_spaces,area,land_area,image_url,is_highlight,rental_price,accepts_pets,furnished,features,open_for_partnership")
        .in("id", ids)
        .eq("availability", "available");
      setProperties(props || []);
    } else {
      setProperties([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Listen for favorites changes — handles adds from other pages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("favorites-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "favorites", filter: `user_id=eq.${user.id}` },
        () => { loadFavorites(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, loadFavorites]);

  // Optimistic removal — called by FavoriteButton via custom event
  useEffect(() => {
    const handler = (e: CustomEvent<{ propertyId: string }>) => {
      setProperties((prev) => prev.filter((p) => p.id !== e.detail.propertyId));
    };
    window.addEventListener("favorite-removed" as any, handler);
    return () => window.removeEventListener("favorite-removed" as any, handler);
  }, []);

  const adaptProperty = (p: any) => ({
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

  if (authLoading || loading) {
    return <KorretoraLoader status="Carregando favoritos..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-40 text-center">
          <Heart className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="font-display text-2xl text-foreground">Faça login para ver seus favoritos</p>
          <Link to="/login" className="mt-4 font-body text-primary hover:underline">Entrar</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="container mx-auto px-6 pb-16 pt-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 flex items-center gap-3 font-display text-4xl font-bold text-foreground">
            <Heart className="h-8 w-8 text-primary" /> Meus Favoritos
          </h1>
          <p className="mb-12 font-body text-muted-foreground">
            {properties.length} {properties.length === 1 ? "imóvel salvo" : "imóveis salvos"} para ver depois.
          </p>
        </motion.div>

        {properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="mb-4 h-16 w-16 text-muted-foreground/20" />
            <p className="font-display text-xl text-foreground">Nenhum favorito ainda</p>
            <p className="mt-2 font-body text-sm text-muted-foreground">Explore imóveis e salve seus preferidos.</p>
            <Link to="/" className="mt-4 font-body text-primary hover:underline">Ver imóveis</Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {properties.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
                >
                  <PropertyCard property={adaptProperty(p)} index={i} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default Favorites;
