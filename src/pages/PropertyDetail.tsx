import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bed, Bath, Car, Maximize, MapPin, Check, Phone, Mail, PawPrint, Sofa, CalendarDays, FileText, User, MessageCircle } from "lucide-react";
import { formatPrice } from "@/data/properties";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MortgageCalculator from "@/components/MortgageCalculator";
import RentalCostCalculator from "@/components/RentalCostCalculator";
import VirtualTourViewer from "@/components/VirtualTourViewer";
import FavoriteButton from "@/components/FavoriteButton";
import PropertyLocationMap from "@/components/PropertyLocationMap";
import PropertyImageGallery from "@/components/PropertyImageGallery";
import SocialShare from "@/components/SocialShare";
import NeighborhoodRating from "@/components/NeighborhoodRating";
import FloorPlanGallery from "@/components/FloorPlanGallery";
import SEOHead from "@/components/SEOHead";
import { useTrackPropertyView } from "@/hooks/useTrackPropertyView";

const PropertyDetail = () => {
  const { slug } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [broker, setBroker] = useState<any>(null);
  const [brokerProfile, setBrokerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data } = await supabase.rpc("get_property_by_slug", { _slug: slug });
      const prop = data?.[0] || null;
      setProperty(prop);

      if (prop?.broker_id) {
        const { data: bData } = await supabase.rpc("get_active_broker", { _broker_id: prop.broker_id });
        const b = bData?.[0] || null;
        setBroker(b);
        if (b?.user_id) {
          const { data: pData } = await supabase.rpc("get_public_profile", { _user_id: b.user_id });
          setBrokerProfile(pData?.[0] || null);
        }
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  // Track property view
  useTrackPropertyView(property?.id);

  const jsonLd = useMemo(() => {
    if (!property) return undefined;
    const isRental = property.status === "aluguel";
    const price = isRental && Number(property.rental_price) > 0 ? Number(property.rental_price) : Number(property.price);
    return {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: property.title,
      description: property.description || "",
      url: window.location.href,
      image: property.image_url || "",
      address: {
        "@type": "PostalAddress",
        streetAddress: property.location,
        addressLocality: property.city,
        addressRegion: property.state,
        addressCountry: "BR",
      },
      offers: {
        "@type": "Offer",
        price,
        priceCurrency: "BRL",
        availability: "https://schema.org/InStock",
      },
      numberOfRooms: property.bedrooms,
      numberOfBathroomsTotal: property.bathrooms,
      floorSize: { "@type": "QuantitativeValue", value: Number(property.area), unitCode: "MTK" },
    };
  }, [property]);

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
  const typeLabels: Record<string, string> = {
    casa: "Casa", apartamento: "Apartamento", cobertura: "Cobertura",
    terreno: "Terreno", fazenda: "Fazenda", mansao: "Mansão",
    kitnet: "Kitnet / Studio", flat: "Flat", loft: "Loft",
    casa_condominio: "Casa em Condomínio", sitio_chacara: "Sítio / Chácara",
  };

  const isRental = property.status === "aluguel";
  const rentalPrice = Number(property.rental_price) || 0;
  const condominiumFee = Number(property.condominium_fee) || 0;
  const iptu = Number(property.iptu) || 0;
  const displayPrice = isRental && rentalPrice > 0 ? rentalPrice : Number(property.price);

  // Detect floor plan images (images that contain "planta" in the URL or last images if more than 4)
  const allImages = property.images || [];
  const floorPlans = allImages.filter((img: string) => img.toLowerCase().includes("planta") || img.toLowerCase().includes("floor"));

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={property.title}
        description={`${typeLabels[property.type]} em ${property.location}, ${property.city} - ${property.state}. ${property.bedrooms} quartos, ${property.area}m². ${formatPrice(displayPrice)}${isRental ? "/mês" : ""}`}
        image={property.image_url}
        url={window.location.href}
        type="product"
        jsonLd={jsonLd}
      />
      <Header />

      <PropertyImageGallery
        mainImage={property.image_url}
        images={property.images}
        title={property.title}
      />
      <div className="container mx-auto px-6 -mt-4">
        <Link to="/" className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Voltar aos imóveis
        </Link>
      </div>

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
                {isRental && property.furnished && (
                  <span className="flex items-center gap-1 border border-primary/30 bg-primary/10 px-3 py-1 font-body text-xs uppercase tracking-wider text-primary">
                    <Sofa className="h-3 w-3" /> Mobiliado
                  </span>
                )}
                {isRental && property.accepts_pets && (
                  <span className="flex items-center gap-1 border border-green-500/30 bg-green-500/10 px-3 py-1 font-body text-xs uppercase tracking-wider text-green-400">
                    <PawPrint className="h-3 w-3" /> Aceita Pets
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <SocialShare
                    title={property.title}
                    price={`${formatPrice(displayPrice)}${isRental ? "/mês" : ""}`}
                    location={`${property.location}, ${property.city}`}
                  />
                  <FavoriteButton propertyId={property.id} size="md" />
                </div>
              </div>

              <h1 className="mb-3 font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">{property.title}</h1>

              <div className="mb-6 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-body text-base">{property.location}, {property.city} - {property.state}</span>
              </div>

              <div className="flex flex-wrap items-baseline gap-3">
                <p className="font-display text-3xl font-semibold text-gradient-gold md:text-4xl">
                  {formatPrice(displayPrice)}
                  {isRental && <span className="text-lg text-muted-foreground">/mês</span>}
                </p>
                {isRental && condominiumFee > 0 && (
                  <span className="font-body text-sm text-muted-foreground">
                    + {formatPrice(condominiumFee)} cond.
                  </span>
                )}
              </div>

              {/* Rental details section */}
              {isRental && (
                <div className="my-6 flex flex-wrap gap-4 rounded border border-border bg-secondary/30 p-4">
                  {property.min_contract_months > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 text-primary" />
                      <span>Contrato mín. <strong className="text-foreground">{property.min_contract_months} meses</strong></span>
                    </div>
                  )}
                  {iptu > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span>IPTU <strong className="text-foreground">{formatPrice(iptu)}/mês</strong></span>
                    </div>
                  )}
                  {property.available_from && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span>Disponível a partir de <strong className="text-foreground">{new Date(property.available_from).toLocaleDateString("pt-BR")}</strong></span>
                    </div>
                  )}
                </div>
              )}

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

              {/* Floor Plans */}
              <FloorPlanGallery floorPlans={floorPlans} title={property.title} />

              {/* Neighborhood Rating */}
              <NeighborhoodRating neighborhood={property.location} city={property.city} />

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
                {broker ? (
                  <div className="border border-border bg-card p-8">
                    <h3 className="mb-4 font-display text-xl font-semibold text-foreground">
                      Corretor Responsável
                    </h3>
                    <div className="flex items-center gap-4 mb-4">
                      {brokerProfile?.avatar_url ? (
                        <img src={brokerProfile.avatar_url} alt={brokerProfile?.display_name || "Corretor"} className="h-16 w-16 rounded-full object-cover border-2 border-primary/30" />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/30">
                          <User className="h-7 w-7 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-display text-lg font-semibold text-foreground">{brokerProfile?.display_name || "Corretor"}</p>
                        <p className="font-body text-xs text-primary font-medium">CRECI {broker.creci}</p>
                        {broker.company_name && <p className="font-body text-xs text-muted-foreground">{broker.company_name}</p>}
                      </div>
                    </div>

                    {brokerProfile?.bio && (
                      <p className="mb-4 font-body text-sm text-muted-foreground leading-relaxed">{brokerProfile.bio}</p>
                    )}

                    {/* Contact details */}
                    <div className="mb-4 space-y-2 rounded-lg border border-border bg-secondary/50 p-4">
                      {brokerProfile?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-body text-sm text-foreground">{brokerProfile.phone}</span>
                        </div>
                      )}
                      {broker.slug && (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-primary shrink-0" />
                          <Link to={`/corretor/${broker.slug || broker.id}`} className="font-body text-sm text-primary hover:underline truncate">
                            Ver perfil completo
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      {brokerProfile?.phone && (
                        <a href={`https://wa.me/55${brokerProfile.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${brokerProfile?.display_name || ""}! Vi o imóvel "${property.title}" na comunidade ÉLITE e gostaria de mais informações. ${window.location.href}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-gradient-gold py-3 font-body text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-all hover:shadow-[var(--shadow-gold)]">
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </a>
                      )}
                      {brokerProfile?.phone && (
                        <a href={`tel:+55${brokerProfile.phone.replace(/\D/g, "")}`} className="flex items-center justify-center gap-2 border border-primary py-3 font-body text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                          <Phone className="h-4 w-4" /> Ligar
                        </a>
                      )}
                    </div>
                    <div className="luxury-divider my-6" />
                    <p className="font-body text-xs text-center text-muted-foreground">Corretor autônomo da comunidade ÉLITE</p>
                  </div>
                ) : (
                  <div className="border border-border bg-card p-8">
                    <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                      Interessado?
                    </h3>
                    <p className="mb-6 font-body text-sm text-muted-foreground">
                      Este imóvel ainda não possui um corretor vinculado.
                    </p>
                  </div>
                )}

                {/* Show Rental Cost Calculator for rentals, Mortgage Calculator for sales */}
                {isRental ? (
                  <RentalCostCalculator
                    rentalPrice={rentalPrice > 0 ? rentalPrice : displayPrice}
                    condominiumFee={condominiumFee}
                    iptu={iptu}
                  />
                ) : (
                  <MortgageCalculator propertyPrice={Number(property.price)} />
                )}
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
