import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyMap from "@/components/PropertyMap";

const MapSearch = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadProperties = async () => {
      // Only load properties that already have coordinates — no client-side geocoding
      const { data } = await supabase
        .from("db_properties")
        .select("id, title, price, latitude, longitude, slug, image_url, city, state, location, type")
        .eq("availability", "available")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      setProperties(data || []);
      setLoading(false);
    };
    loadProperties();
  }, []);

  const filteredCount = properties.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      p.state?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q)
    );
  }).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="container mx-auto px-6 pb-16 pt-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 flex items-center gap-3 font-display text-4xl font-bold text-foreground">
            <MapPin className="h-8 w-8 text-primary" /> Busca por Mapa
          </h1>
          <p className="mb-6 font-body text-muted-foreground">
            Encontre imóveis por localização geográfica.
          </p>
        </motion.div>

        {/* Search bar */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por bairro, rua, cidade, estado ou tipo..."
              className="border-border bg-card pl-10 pr-10 font-body text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <span className="font-body text-sm text-muted-foreground">
            {filteredCount} {filteredCount === 1 ? "imóvel" : "imóveis"} encontrado{filteredCount !== 1 ? "s" : ""}
          </span>
        </div>

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
          <PropertyMap properties={properties} searchQuery={searchQuery} />
        )}
      </section>
      <Footer />
    </div>
  );
};

export default MapSearch;
