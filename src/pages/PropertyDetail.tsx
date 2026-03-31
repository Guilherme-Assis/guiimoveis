import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bed, Bath, Car, Maximize, MapPin, Check, Phone, Mail } from "lucide-react";
import { formatPrice } from "@/data/properties";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MortgageCalculator from "@/components/MortgageCalculator";
import VirtualTourViewer from "@/components/VirtualTourViewer";
import FavoriteButton from "@/components/FavoriteButton";
import PropertyLocationMap from "@/components/PropertyLocationMap";

const PropertyDetail = () => {
  const { slug } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data } = await supabase.rpc("get_property_by_slug", { _slug: slug });
      setProperty(data?.[0] || null);
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-body text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Header />
        <p className="font-display text-2xl text-foreground">Imóvel não encontrado</p>
        <Link to="/" className="mt-4 font-body text-primary hover:underline">
          Voltar ao início
        </Link>
      </div>
    );
  }

  const statusLabels: Record<string, string> = { venda: "Venda", aluguel: "Aluguel", lancamento: "Lançamento" };
  const typeLabels: Record<string, string> = { casa: "Casa", apartamento: "Apartamento", cobertura: "Cobertura", terreno: "Terreno", fazenda: "Fazenda", mansao: "Mansão" };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative h-[60vh] w-full overflow-hidden">
        <img src={property.image_url || "/placeholder.svg"} alt={property.title} className="h-full w-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <Link to="/" className="mb-4 inline-flex items-center gap-2 font-body text-sm text-muted-foreground transition-colors hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Voltar aos imóveis
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="bg-gradient-gold px-3 py-1 font-body text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                  {statusLabels[property.status]}
                </span>
                <span className="border border-border px-3 py-1 font-body text-xs uppercase tracking-wider text-muted-foreground">
                  {typeLabels[property.type]}
                </span>
                <FavoriteButton propertyId={property.id} size="md" className="ml-auto" />
              </div>

              <h1 className="mb-3 font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">{property.title}</h1>

              <div className="mb-6 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-body text-base">{property.location}, {property.city} - {property.state}</span>
              </div>

              <p className="font-display text-3xl font-semibold text-gradient-gold md:text-4xl">{formatPrice(Number(property.price))}</p>

              <div className="my-8 flex flex-wrap gap-6 border-y border-border py-6">
                {property.bedrooms > 0 && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-display text-xl font-semibold text-foreground">{property.bedrooms}</p>
                      <p className="font-body text-xs text-muted-foreground">Quartos</p>
                    </div>
                  </div>
                )}
                {property.bathrooms > 0 && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-display text-xl font-semibold text-foreground">{property.bathrooms}</p>
                      <p className="font-body text-xs text-muted-foreground">Banheiros</p>
                    </div>
                  </div>
                )}
                {property.parking_spaces > 0 && (
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-display text-xl font-semibold text-foreground">{property.parking_spaces}</p>
                      <p className="font-body text-xs text-muted-foreground">Vagas</p>
                    </div>
                  </div>
                )}
                {Number(property.area) > 0 && (
                  <div className="flex items-center gap-2">
                    <Maximize className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-display text-xl font-semibold text-foreground">{property.area}m²</p>
                      <p className="font-body text-xs text-muted-foreground">Área Construída</p>
                    </div>
                  </div>
                )}
                {Number(property.land_area) > 0 && (
                  <div className="flex items-center gap-2">
                    <Maximize className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-display text-xl font-semibold text-foreground">{Number(property.land_area).toLocaleString("pt-BR")}m²</p>
                      <p className="font-body text-xs text-muted-foreground">Terreno</p>
                    </div>
                  </div>
                )}
              </div>

              {property.description && (
                <div className="mb-10">
                  <h2 className="mb-4 font-display text-2xl font-semibold text-foreground">Sobre o Imóvel</h2>
                  <p className="font-body text-base leading-relaxed text-muted-foreground">{property.description}</p>
                </div>
              )}

              {property.features && property.features.length > 0 && (
                <div className="mb-10">
                  <h2 className="mb-4 font-display text-2xl font-semibold text-foreground">Características</h2>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {property.features.map((feature: string) => (
                      <div key={feature} className="flex items-center gap-2 font-body text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary" /> {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Virtual Tour */}
              {property.virtual_tour_url && (
                <div className="mb-10">
                  <VirtualTourViewer url={property.virtual_tour_url} title={property.title} />
                </div>
              )}

              {/* Location Map */}
              <PropertyLocationMap
                latitude={property.latitude ? Number(property.latitude) : null}
                longitude={property.longitude ? Number(property.longitude) : null}
                address={property.location}
                city={property.city}
                state={property.state}
                title={property.title}
              />
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="space-y-6">
              <div className="sticky top-24 space-y-6">
                <div className="border border-border bg-card p-8">
                  <h3 className="mb-2 font-display text-xl font-semibold text-foreground">Agende uma Visita</h3>
                  <p className="mb-6 font-body text-sm text-muted-foreground">
                    Entre em contato com nossos consultores especializados.
                  </p>
                  <div className="flex flex-col gap-3">
                    <a href="tel:+5511999999999" className="flex items-center justify-center gap-2 bg-gradient-gold py-3 font-body text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-all hover:shadow-[var(--shadow-gold)]">
                      <Phone className="h-4 w-4" /> Ligar Agora
                    </a>
                    <a href="mailto:contato@eliteimoveis.com" className="flex items-center justify-center gap-2 border border-primary py-3 font-body text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                      <Mail className="h-4 w-4" /> Enviar E-mail
                    </a>
                  </div>
                  <div className="luxury-divider my-6" />
                  <p className="font-body text-xs text-center text-muted-foreground">Atendimento exclusivo e personalizado</p>
                </div>

                {/* Mortgage Calculator */}
                <MortgageCalculator propertyPrice={Number(property.price)} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PropertyDetail;
