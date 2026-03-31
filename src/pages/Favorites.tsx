import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const load = async () => {
      const { data: favs } = await supabase
        .from("favorites")
        .select("property_id")
        .eq("user_id", user.id);

      if (favs && favs.length > 0) {
        const ids = favs.map((f) => f.property_id);
        const { data: props } = await supabase
          .from("db_properties")
          .select("*")
          .in("id", ids)
          .eq("availability", "available");
        setProperties(props || []);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const adaptProperty = (p: any) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    type: p.type,
    status: p.status,
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
  });

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-body text-muted-foreground">Carregando...</p>
      </div>
    );
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
            Imóveis que você salvou para ver depois.
          </p>
        </motion.div>

        {properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-display text-xl text-foreground">Nenhum favorito ainda</p>
            <p className="mt-2 font-body text-sm text-muted-foreground">Explore imóveis e salve seus preferidos.</p>
            <Link to="/" className="mt-4 font-body text-primary hover:underline">Ver imóveis</Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((p, i) => (
              <PropertyCard key={p.id} property={adaptProperty(p)} index={i} />
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default Favorites;
