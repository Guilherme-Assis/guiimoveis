import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyMap from "@/components/PropertyMap";

const MapSearch = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("db_properties")
      .select("id, title, price, latitude, longitude, slug, image_url, city, type")
      .eq("availability", "available")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .then(({ data }) => {
        setProperties(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="container mx-auto px-6 pb-16 pt-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 flex items-center gap-3 font-display text-4xl font-bold text-foreground">
            <MapPin className="h-8 w-8 text-primary" /> Busca por Mapa
          </h1>
          <p className="mb-8 font-body text-muted-foreground">
            Encontre imóveis por localização geográfica.
          </p>
        </motion.div>

        {loading ? (
          <p className="font-body text-muted-foreground">Carregando mapa...</p>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-display text-xl text-foreground">Nenhum imóvel com localização cadastrada</p>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              Adicione coordenadas (latitude/longitude) aos imóveis no painel admin.
            </p>
          </div>
        ) : (
          <PropertyMap properties={properties} />
        )}
      </section>
      <Footer />
    </div>
  );
};

export default MapSearch;
