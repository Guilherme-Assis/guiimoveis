import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { formatPrice } from "@/data/properties";
import { ArrowLeft, Phone, Mail, Building2 } from "lucide-react";

const BrokerProfile = () => {
  const { slug } = useParams();
  const [broker, setBroker] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data: brokerData } = await supabase.rpc("get_broker_by_slug", { _slug: slug });
      const broker = brokerData?.[0];
      if (broker) {
        setBroker(broker);
        const { data: profileData } = await supabase.rpc("get_public_profile", { _user_id: broker.user_id });
        setProfile(profileData?.[0] || null);
        const { data: propData } = await supabase.from("db_properties").select("*").eq("broker_id", broker.id).eq("availability", "available");
        setProperties(propData || []);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="font-body text-muted-foreground">Carregando...</p></div>;
  if (!broker) return <div className="flex min-h-screen flex-col items-center justify-center bg-background"><p className="font-display text-2xl text-foreground">Corretor não encontrado</p><Link to="/" className="mt-4 font-body text-primary hover:underline">Voltar</Link></div>;

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="container mx-auto px-6 pb-16 pt-32">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="mb-12 border border-border bg-card p-8">
          <div className="flex items-center gap-6">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 font-display text-2xl font-bold text-primary">
                {(profile?.display_name || "C").charAt(0)}
              </div>
            )}
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">{profile?.display_name || "Corretor"}</h1>
              <p className="font-body text-sm text-primary">CRECI: {broker.creci}</p>
              {broker.company_name && <p className="font-body text-sm text-muted-foreground">{broker.company_name}</p>}
            </div>
          </div>
          {profile?.bio && <p className="mt-6 font-body text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>}
        </div>

        <h2 className="mb-6 font-display text-2xl font-semibold text-foreground">
          <Building2 className="mr-2 inline h-5 w-5 text-primary" />
          Imóveis deste Corretor ({properties.length})
        </h2>

        {properties.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((p, i) => (
              <PropertyCard key={p.id} property={adaptProperty(p)} index={i} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center font-body text-muted-foreground">Este corretor ainda não possui imóveis cadastrados.</p>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default BrokerProfile;
