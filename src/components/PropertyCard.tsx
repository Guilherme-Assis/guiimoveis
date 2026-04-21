import { memo, useEffect, useRef, useState } from "react";
import { Bath, Bed, Car, Check, GitCompareArrows, Handshake, MapPin, Maximize, PawPrint, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import FavoriteButton from "@/components/FavoriteButton";
import PartnerAvatars from "@/components/PartnerAvatars";
import { useCompare } from "@/contexts/CompareContext";
import { Property, formatPrice } from "@/data/properties";
import { useS3Image } from "@/hooks/useS3Image";

interface PropertyCardProps {
  property: Property & { slug?: string; rentalPrice?: number; acceptsPets?: boolean; furnished?: boolean; openForPartnership?: boolean };
  index: number;
}

const PropertyCardComponent = ({ property, index }: PropertyCardProps) => {
  const imageRef = useRef<HTMLDivElement | null>(null);
  const eager = index === 0;
  const [shouldLoadImage, setShouldLoadImage] = useState(eager);
  const resolvedImage = useS3Image(shouldLoadImage ? property.image : null);
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const inCompare = isInCompare(property.id);

  useEffect(() => {
    if (eager || !imageRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoadImage(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(imageRef.current);
    return () => observer.disconnect();
  }, [eager]);

  const statusLabels: Record<string, string> = { venda: "Venda", aluguel: "Aluguel", lançamento: "Lançamento" };
  const isRental = property.status === "aluguel";
  const displayPrice = isRental && property.rentalPrice && property.rentalPrice > 0 ? property.rentalPrice : property.price;
  const linkTo = property.slug ? `/imovel/${property.slug}` : `/imovel/${property.id}`;
  const isNew = property.isHighlight;

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    inCompare ? removeFromCompare(property.id) : addToCompare(property);
  };

  return (
    <div className="h-full">
      <Link to={linkTo} className="group flex h-full flex-col overflow-hidden border border-border bg-card transition-all duration-500 hover:scale-[1.02] hover:border-primary/30 hover:shadow-[var(--shadow-gold)]">
        <div ref={imageRef} className="relative aspect-[4/3] overflow-hidden">
          <img
            src={resolvedImage}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={eager ? "high" : "auto" as any}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            width={800}
            height={600}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className="bg-gradient-gold px-3 py-1 font-body text-xs font-semibold uppercase tracking-wider text-primary-foreground">{statusLabels[property.status]}</span>
            {isNew && <span className="flex items-center gap-1 bg-primary/90 px-2 py-1 font-body text-[10px] font-semibold uppercase tracking-wider text-primary-foreground backdrop-blur-sm"><Sparkles className="h-3 w-3" /> Destaque</span>}
            {isRental && property.furnished && <span className="bg-primary/80 px-2 py-1 font-body text-[10px] font-semibold uppercase tracking-wider text-primary-foreground backdrop-blur-sm">Mobiliado</span>}
            {property.openForPartnership && <span className="flex items-center gap-1 bg-primary/85 px-2 py-1 font-body text-[10px] font-semibold uppercase tracking-wider text-primary-foreground backdrop-blur-sm"><Handshake className="h-3 w-3" /> Parceria</span>}
          </div>
          <div className="absolute right-4 top-4 flex items-center gap-1.5">
            <button onClick={handleCompareClick} className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-300 ${inCompare ? "scale-110 bg-primary text-primary-foreground" : "bg-background/60 text-muted-foreground hover:scale-110 hover:bg-primary/20 hover:text-primary"}`} title={inCompare ? "Remover da comparação" : "Comparar"}>
              {inCompare ? <Check className="h-4 w-4" /> : <GitCompareArrows className="h-4 w-4" />}
            </button>
            <FavoriteButton propertyId={property.id} className="flex h-8 w-8 items-center justify-center rounded-full bg-background/60 backdrop-blur-sm transition-all duration-300 hover:scale-110" />
          </div>
          <div className="absolute bottom-4 left-4">
            <p className="font-display text-2xl font-semibold text-foreground [text-shadow:_0_1px_8px_rgba(0,0,0,0.5)]">{formatPrice(displayPrice)}{isRental && <span className="text-sm text-muted-foreground/80">/mês</span>}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-2 line-clamp-2 font-display text-lg font-semibold text-foreground transition-colors group-hover:text-primary">{property.title}</h3>
          <div className="mb-2 flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-primary" /><span className="font-body text-sm">{property.location}, {property.city} - {property.state}</span></div>
          {property.openForPartnership && <div className="mb-4"><PartnerAvatars propertyId={property.id} openForPartnership={!!property.openForPartnership} /></div>}

          <div className="mt-auto">
            {property.type !== "terreno" && property.type !== "sitio_chacara" && (
              <div className="flex items-center gap-4 border-t border-border pt-4">
                {property.bedrooms > 0 && <div className="flex items-center gap-1.5 text-muted-foreground transition-colors group-hover:text-foreground"><Bed className="h-4 w-4 text-primary" /><span className="font-body text-sm">{property.bedrooms}</span></div>}
                {property.bathrooms > 0 && <div className="flex items-center gap-1.5 text-muted-foreground transition-colors group-hover:text-foreground"><Bath className="h-4 w-4 text-primary" /><span className="font-body text-sm">{property.bathrooms}</span></div>}
                {property.parkingSpaces > 0 && <div className="flex items-center gap-1.5 text-muted-foreground transition-colors group-hover:text-foreground"><Car className="h-4 w-4 text-primary" /><span className="font-body text-sm">{property.parkingSpaces}</span></div>}
                {property.area > 0 && <div className="flex items-center gap-1.5 text-muted-foreground transition-colors group-hover:text-foreground"><Maximize className="h-4 w-4 text-primary" /><span className="font-body text-sm">{property.area}m²</span></div>}
                {isRental && property.acceptsPets && <div className="flex items-center gap-1.5 text-primary" title="Aceita Pets"><PawPrint className="h-4 w-4" /></div>}
              </div>
            )}
            {property.type === "terreno" && property.landArea > 0 && <div className="flex items-center gap-4 border-t border-border pt-4"><div className="flex items-center gap-1.5 text-muted-foreground"><Maximize className="h-4 w-4 text-primary" /><span className="font-body text-sm">{property.landArea.toLocaleString("pt-BR")}m² de terreno</span></div></div>}
          </div>
        </div>
      </Link>
    </div>
  );
};

const PropertyCard = memo(PropertyCardComponent, (prev, next) => prev.property.id === next.property.id && prev.index === next.index);

export default PropertyCard;
