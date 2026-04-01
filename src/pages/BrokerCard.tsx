import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Phone, Mail, Building2, MapPin, Copy, Check, Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const BrokerCard = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const [broker, setBroker] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const profileUrl = `${window.location.origin}/corretor/${slug}`;
  const cardUrl = `${window.location.origin}/corretor/${slug}/cartao`;

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data: brokerData } = await supabase.rpc("get_broker_by_slug", { _slug: slug });
      const b = brokerData?.[0];
      if (b) {
        setBroker(b);
        const { data: profileData } = await supabase.rpc("get_public_profile", { _user_id: b.user_id });
        setProfile(profileData?.[0] || null);
        const { data: propData } = await supabase
          .from("db_properties")
          .select("id, title, slug, price, city, image_url, type, status, bedrooms, area")
          .eq("broker_id", b.id)
          .eq("availability", "available")
          .limit(6);
        setProperties(propData || []);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast({ title: "Link copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: profile?.display_name || "Corretor", url: profileUrl });
    } else {
      handleCopy();
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(price);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="font-body text-muted-foreground">Carregando...</p></div>;
  if (!broker) return <div className="flex min-h-screen flex-col items-center justify-center bg-background"><p className="font-display text-2xl text-foreground">Corretor não encontrado</p><Link to="/" className="mt-4 font-body text-primary hover:underline">Voltar</Link></div>;

  const displayName = profile?.display_name || "Corretor";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Card Header */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          {/* Cover */}
          <div className="relative h-28 bg-gradient-to-r from-primary/80 to-primary">
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="h-24 w-24 rounded-full border-4 border-card object-cover shadow-lg" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-primary/20 font-display text-3xl font-bold text-primary shadow-lg">
                  {displayName.charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="px-6 pb-6 pt-16 text-center">
            <h1 className="font-display text-2xl font-bold text-foreground">{displayName}</h1>
            <p className="mt-1 font-body text-xs font-semibold uppercase tracking-widest text-primary">
              CRECI {broker.creci}
            </p>
            {broker.company_name && (
              <p className="mt-1 flex items-center justify-center gap-1 font-body text-sm text-muted-foreground">
                <Building2 className="h-3 w-3" /> {broker.company_name}
              </p>
            )}
            {profile?.bio && (
              <p className="mt-4 font-body text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
            )}
            {profile?.phone && (
              <a href={`https://wa.me/55${profile.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-2.5 font-body text-sm font-semibold text-white transition hover:bg-green-700">
                <Phone className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>

          {/* QR Code */}
          <div className="border-t border-border px-6 py-6">
            <div className="flex flex-col items-center gap-3">
              <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Escaneie para ver o perfil completo</p>
              <div className="rounded-xl bg-white p-3">
                <QRCodeSVG value={profileUrl} size={140} level="M" />
              </div>
            </div>
          </div>

          {/* Share Actions */}
          <div className="flex gap-2 border-t border-border px-6 py-4">
            <Button onClick={handleCopy} variant="outline" className="flex-1 font-body text-xs" size="sm">
              {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
              {copied ? "Copiado!" : "Copiar Link"}
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1 font-body text-xs" size="sm">
              <Share2 className="mr-1 h-3 w-3" /> Compartilhar
            </Button>
            <Button asChild variant="default" className="flex-1 font-body text-xs" size="sm">
              <Link to={`/corretor/${slug}`}>
                <ExternalLink className="mr-1 h-3 w-3" /> Perfil
              </Link>
            </Button>
          </div>
        </div>

        {/* Properties */}
        {properties.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
              Imóveis ({properties.length})
            </h2>
            <div className="space-y-3">
              {properties.map((p) => (
                <Link key={p.id} to={`/imovel/${p.slug || p.id}`}
                  className="flex gap-3 overflow-hidden rounded-xl border border-border bg-card p-3 transition hover:border-primary/50 hover:shadow-md">
                  <img src={p.image_url || "/placeholder.svg"} alt={p.title}
                    className="h-20 w-20 flex-shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-medium text-foreground">{p.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 font-body text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {p.city}
                    </p>
                    <p className="mt-1 font-display text-sm font-bold text-primary">{formatPrice(Number(p.price))}</p>
                    <p className="font-body text-xs text-muted-foreground">
                      {p.bedrooms} quartos · {Number(p.area)}m²
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="mt-8 text-center font-body text-xs text-muted-foreground">
          Powered by <Link to="/" className="text-primary hover:underline">ÉLITE Imóveis</Link>
        </p>
      </div>
    </div>
  );
};

export default BrokerCard;
