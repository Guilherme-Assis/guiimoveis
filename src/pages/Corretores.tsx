import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { Users, Building2, Handshake, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BrokerInfo {
  broker_id: string;
  user_id: string;
  creci: string;
  company_name: string | null;
  slug: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  partnership_count: number;
}

const Corretores = () => {
  const [brokers, setBrokers] = useState<BrokerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBroker, setExpandedBroker] = useState<string | null>(null);
  const [brokerProperties, setBrokerProperties] = useState<Record<string, any[]>>({});
  const [loadingProperties, setLoadingProperties] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.rpc("get_active_brokers_list");
      setBrokers((data as any[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const toggleBrokerProperties = async (brokerId: string) => {
    if (expandedBroker === brokerId) {
      setExpandedBroker(null);
      return;
    }
    setExpandedBroker(brokerId);
    if (brokerProperties[brokerId]) return;

    setLoadingProperties(brokerId);
    const { data } = await supabase
      .from("db_properties")
      .select("id,slug,title,type,status,price,location,city,state,bedrooms,bathrooms,parking_spaces,area,land_area,description,features,image_url,images,is_highlight")
      .eq("broker_id", brokerId)
      .eq("open_for_partnership", true)
      .eq("availability", "available");
    setBrokerProperties((prev) => ({ ...prev, [brokerId]: data || [] }));
    setLoadingProperties(null);
  };

  const adaptProperty = (p: any) => ({
    id: p.id, slug: p.slug, title: p.title, type: p.type, status: p.status,
    price: Number(p.price), location: p.location, city: p.city, state: p.state,
    bedrooms: p.bedrooms, bathrooms: p.bathrooms, parkingSpaces: p.parking_spaces,
    area: Number(p.area), landArea: Number(p.land_area), description: p.description || "",
    features: p.features || [], image: p.image_url || "/placeholder.svg",
    images: p.images || [], isHighlight: p.is_highlight,
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="font-body text-sm text-muted-foreground">Carregando corretores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="container mx-auto px-6 pb-16 pt-32">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold text-foreground">
            <Users className="mr-3 inline h-8 w-8 text-primary" />
            Nossos Corretores
          </h1>
          <p className="mt-3 font-body text-muted-foreground">
            Conheça os profissionais da nossa comunidade e seus imóveis disponíveis para parceria.
          </p>
        </div>

        {brokers.length === 0 ? (
          <p className="py-12 text-center font-body text-muted-foreground">Nenhum corretor cadastrado ainda.</p>
        ) : (
          <div className="space-y-6">
            {brokers.map((broker) => (
              <div key={broker.broker_id} className="overflow-hidden rounded-lg border border-border bg-card">
                {/* Broker header */}
                <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                  <Link to={`/corretor/${broker.slug || broker.broker_id}`} className="shrink-0">
                    {broker.avatar_url ? (
                      <img
                        src={broker.avatar_url}
                        alt={broker.display_name || "Corretor"}
                        className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/20 transition-all hover:ring-primary"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 font-display text-xl font-bold text-primary ring-2 ring-primary/20 transition-all hover:ring-primary">
                        {(broker.display_name || "C").charAt(0)}
                      </div>
                    )}
                  </Link>

                  <div className="flex-1">
                    <Link
                      to={`/corretor/${broker.slug || broker.broker_id}`}
                      className="font-display text-xl font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {broker.display_name || "Corretor"}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-3 font-body text-sm text-muted-foreground">
                      <span>CRECI: {broker.creci}</span>
                      {broker.company_name && <span>• {broker.company_name}</span>}
                      {broker.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {broker.phone}
                        </span>
                      )}
                    </div>
                    {broker.bio && (
                      <p className="mt-2 line-clamp-2 font-body text-sm text-muted-foreground">{broker.bio}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {broker.partnership_count > 0 && (
                      <Badge variant="secondary" className="gap-1 font-body">
                        <Handshake className="h-3.5 w-3.5" />
                        {broker.partnership_count} {broker.partnership_count === 1 ? "imóvel" : "imóveis"} para parceria
                      </Badge>
                    )}
                    {broker.partnership_count > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleBrokerProperties(broker.broker_id)}
                        className="font-body text-xs"
                      >
                        <Building2 className="mr-1 h-3.5 w-3.5" />
                        {expandedBroker === broker.broker_id ? "Ocultar" : "Ver Imóveis"}
                        {expandedBroker === broker.broker_id ? (
                          <ChevronUp className="ml-1 h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="ml-1 h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded properties */}
                {expandedBroker === broker.broker_id && (
                  <div className="border-t border-border bg-muted/30 p-6">
                    {loadingProperties === broker.broker_id ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : brokerProperties[broker.broker_id]?.length > 0 ? (
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {brokerProperties[broker.broker_id].map((p, i) => (
                          <PropertyCard key={p.id} property={adaptProperty(p)} index={i} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-center font-body text-sm text-muted-foreground">Nenhum imóvel para parceria encontrado.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default Corretores;
