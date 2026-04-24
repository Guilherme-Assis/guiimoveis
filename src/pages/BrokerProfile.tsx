import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import BrokerReviews from "@/components/BrokerReviews";
import { ArrowLeft, Phone, Mail, Building2, Copy, Check, Share2, QrCode, MapPin, Award, Star, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";

const BrokerProfile = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const [broker, setBroker] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [partnershipCount, setPartnershipCount] = useState(0);

  const profileUrl = `${window.location.origin}/corretor/${slug}`;

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data: brokerData } = await supabase.rpc("get_broker_by_slug", { _slug: slug });
      const b = brokerData?.[0];
      if (b) {
        setBroker(b);
        const { data: profileData } = await supabase.rpc("get_public_profile", { _user_id: b.user_id });
        setProfile(profileData?.[0] || null);
        const { data: propData } = await supabase.rpc("get_broker_properties_with_proposals", { _broker_id: b.id });
        const props = propData || [];
        setProperties(props);
        setPartnershipCount(props.filter((p: any) => p.open_for_partnership).length);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="font-body text-sm text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <p className="font-display text-2xl text-foreground">Corretor não encontrado</p>
        <Link to="/" className="mt-4 font-body text-primary hover:underline">Voltar ao início</Link>
      </div>
    );
  }

  const displayName = profile?.display_name || "Corretor";

  const adaptProperty = (p: any) => ({
    id: p.id, slug: p.slug, title: p.title, type: p.type, status: p.status,
    price: Number(p.price), location: p.location, city: p.city, state: p.state,
    bedrooms: p.bedrooms, bathrooms: p.bathrooms, parkingSpaces: p.parking_spaces,
    area: Number(p.area), landArea: Number(p.land_area), description: p.description || "",
    features: p.features || [], image: p.image_url || "/placeholder.svg",
    images: p.images || [], isHighlight: p.is_highlight,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast({ title: "Link copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: displayName, url: profileUrl });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Cover */}
      <div className="relative h-48 bg-gradient-to-r from-primary/90 via-primary to-primary/80 sm:h-56">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
      </div>

      <section className="container relative mx-auto px-4 pb-16 sm:px-6">
        {/* Back button */}
        <Link to="/" className="absolute left-4 top-[-180px] inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 font-body text-xs text-muted-foreground backdrop-blur-sm hover:text-primary sm:left-6 sm:top-[-200px]">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>

        {/* Profile Card */}
        <div className="-mt-20 rounded-2xl border border-border bg-card shadow-lg sm:-mt-24">
          <div className="px-6 pb-6 pt-4 sm:px-8 sm:pb-8">
            {/* Avatar + Name Row */}
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end">
              {/* Avatar */}
              <div className="-mt-16 sm:-mt-20">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="h-28 w-28 rounded-2xl border-4 border-card object-cover shadow-xl sm:h-32 sm:w-32"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-card bg-primary/10 font-display text-4xl font-bold text-primary shadow-xl sm:h-32 sm:w-32">
                    {displayName.charAt(0)}
                  </div>
                )}
              </div>

              {/* Name + Meta */}
              <div className="flex-1 text-center sm:pb-1 sm:text-left">
                <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                  {displayName}
                </h1>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <Badge variant="secondary" className="gap-1 font-body text-xs">
                    <Award className="h-3 w-3" /> CRECI {broker.creci}
                  </Badge>
                  {broker.company_name && (
                    <Badge variant="outline" className="gap-1 font-body text-xs">
                      <Building2 className="h-3 w-3" /> {broker.company_name}
                    </Badge>
                  )}
                  {partnershipCount > 0 && (
                    <Badge variant="outline" className="gap-1 border-primary/30 font-body text-xs text-primary">
                      <Handshake className="h-3 w-3" /> {partnershipCount} para parceria
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                {profile?.phone && (
                  <Button asChild size="sm" className="bg-green-600 font-body text-xs hover:bg-green-700">
                    <a href={`https://wa.me/55${profile.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                      <Phone className="mr-1.5 h-3.5 w-3.5" /> WhatsApp
                    </a>
                  </Button>
                )}
                <Button onClick={handleShare} variant="outline" size="sm" className="font-body text-xs">
                  <Share2 className="mr-1.5 h-3.5 w-3.5" /> Compartilhar
                </Button>
                <Button onClick={handleCopy} variant="ghost" size="sm" className="font-body text-xs">
                  {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                  {copied ? "Copiado!" : "Link"}
                </Button>
                <Button onClick={() => setShowQr(!showQr)} variant="ghost" size="sm" className="font-body text-xs">
                  <QrCode className="h-3.5 w-3.5" />
                </Button>
                <Button asChild variant="ghost" size="sm" className="font-body text-xs">
                  <Link to={`/corretor/${slug}/cartao`}>Cartão Digital</Link>
                </Button>
              </div>
            </div>

            {/* QR Code */}
            {showQr && (
              <div className="mt-4 flex justify-center sm:justify-start sm:pl-36">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <QRCodeSVG value={profileUrl} size={140} level="M" />
                </div>
              </div>
            )}

            {/* Bio */}
            {profile?.bio && (
              <p className="mt-6 max-w-3xl font-body text-sm leading-relaxed text-muted-foreground sm:pl-36">
                {profile.bio}
              </p>
            )}

            {/* Stats Row */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 border-t border-border pt-6 sm:justify-start sm:pl-36">
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-foreground">{properties.length}</p>
                <p className="font-body text-xs text-muted-foreground">Imóveis Ativos</p>
              </div>
              {partnershipCount > 0 && (
                <div className="text-center">
                  <p className="font-display text-2xl font-bold text-primary">{partnershipCount}</p>
                  <p className="font-body text-xs text-muted-foreground">Para Parceria</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <BrokerReviews brokerId={broker.id} />
        </div>

        {/* Properties Section */}
        <div className="mt-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                Imóveis deste Corretor
              </h2>
              <p className="font-body text-sm text-muted-foreground">{properties.length} imóveis disponíveis</p>
            </div>
          </div>

          {properties.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((p, i) => (
                <PropertyCard key={p.id} property={adaptProperty(p)} index={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
              <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-body text-muted-foreground">Este corretor ainda não possui imóveis cadastrados.</p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default BrokerProfile;
