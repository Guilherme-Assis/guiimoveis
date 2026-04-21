import { memo } from "react";
import { motion } from "framer-motion";
import { Bed, Bath, Car, Maximize, MapPin, PawPrint, GitCompareArrows, Check, Handshake, Sparkles } from "lucide-react";
import { Property, formatPrice } from "@/data/properties";
import { Link } from "react-router-dom";
import FavoriteButton from "@/components/FavoriteButton";
import { useS3Image } from "@/hooks/useS3Image";
import { useCompare } from "@/contexts/CompareContext";
import PartnerAvatars from "@/components/PartnerAvatars";

interface PropertyCardProps {
  property: Property & { slug?: string; rentalPrice?: number; acceptsPets?: boolean; furnished?: boolean; openForPartnership?: boolean };
  index: number;
}

const PropertyCardComponent = ({ property, index }: PropertyCardProps) => {
  const resolvedImage = useS3Image(property.image);
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const inCompare = isInCompare(property.id);

  const statusLabels: Record<string, string> = {
    venda: "Venda",
    aluguel: "Aluguel",
    lançamento: "Lançamento",
  };

  const isRental = property.status === "aluguel";
  const displayPrice = isRental && property.rentalPrice && property.rentalPrice > 0
    ? property.rentalPrice
    : property.price;

  const linkTo = property.slug ? `/imovel/${property.slug}` : `/imovel/${property.id}`;

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(property.id);
    } else {
      addToCompare(property);
    }
  };

  const isNew = property.isHighlight;

  // First 6 cards render immediately (no animation) to prioritize LCP.
  // Below-the-fold cards keep a subtle entrance.
  const isAboveFold = index < 6;

  return (
    <motion.div
      className="h-full"
      initial={isAboveFold ? false : { opacity: 0, y: 20 }}
      whileInView={isAboveFold ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.4, delay: 0 }}
    >
      <Link
        to={linkTo}
        className="group flex h-full flex-col overflow-hidden border border-border bg-card transition-all duration-500 hover:border-primary/30 hover:shadow-[var(--shadow-gold)] hover:scale-[1.02]"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={resolvedImage}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading={index < 3 ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={index < 3 ? "high" : "auto" as any}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            width={800}
            height={600}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className="bg-gradient-gold px-3 py-1 font-body text-xs font-semibold uppercase tracking-wider text-primary-foreground">
              {statusLabels[property.status]}
            </span>
            {isNew && (
              <span className="flex items-center gap-1 bg-primary/90 px-2 py-1 font-body text-[10px] font-semibold uppercase tracking-wider text-primary-foreground backdrop-blur-sm">
                <Sparkles className="h-3 w-3" /> Destaque
              </span>
            )}
            {isRental && property.furnished && (
              <span className="bg-primary/80 px-2 py-1 font-body text-[10px] font-semibold uppercase tracking-wider text-primary-foreground backdrop-blur-sm">
                Mobiliado
              </span>
            )}
            {property.openForPartnership && (
              <span className="flex items-center gap-1 bg-emerald-600/90 px-2 py-1 font-body text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                <Handshake className="h-3 w-3" /> Parceria
              </span>
            )}
          </div>
          <div className="absolute right-4 top-4 flex items-center gap-1.5">
            <button
              onClick={handleCompareClick}
              className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-300 ${
                inCompare
                  ? "bg-primary text-primary-foreground scale-110"
                  : "bg-background/60 text-muted-foreground hover:bg-primary/20 hover:text-primary hover:scale-110"
              }`}
              title={inCompare ? "Remover da comparação" : "Comparar"}
            >
              {inCompare ? <Check className="h-4 w-4" /> : <GitCompareArrows className="h-4 w-4" />}
            </button>
            <FavoriteButton
              propertyId={property.id}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-background/60 backdrop-blur-sm transition-all duration-300 hover:scale-110"
            />
          </div>
          <div className="absolute bottom-4 left-4">
            <p className="font-display text-2xl font-semibold text-foreground [text-shadow:_0_1px_8px_rgba(0,0,0,0.5)]">
              {formatPrice(displayPrice)}
              {isRental && <span className="text-sm text-muted-foreground/80">/mês</span>}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-2 line-clamp-2 font-display text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
            {property.title}
          </h3>
          <div className="mb-2 flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="font-body text-sm">
              {property.location}, {property.city} - {property.state}
            </span>
          </div>
          {property.openForPartnership && (
            <div className="mb-4">
              <PartnerAvatars propertyId={property.id} openForPartnership={!!property.openForPartnership} />
            </div>
          )}

          <div className="mt-auto">
          {property.type !== "terreno" && property.type !== "sitio_chacara" && (
            <div className="flex items-center gap-4 border-t border-border pt-4">
              {property.bedrooms > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground transition-colors group-hover:text-foreground">
                  <Bed className="h-4 w-4 text-primary" />
                  <span className="font-body text-sm">{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground transition-colors group-hover:text-foreground">
                  <Bath className="h-4 w-4 text-primary" />
                  <span className="font-body text-sm">{property.bathrooms}</span>
                </div>
              )}
              {property.parkingSpaces > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground transition-colors group-hover:text-foreground">
                  <Car className="h-4 w-4 text-primary" />
                  <span className="font-body text-sm">{property.parkingSpaces}</span>
                </div>
              )}
              {property.area > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground transition-colors group-hover:text-foreground">
                  <Maximize className="h-4 w-4 text-primary" />
                  <span className="font-body text-sm">{property.area}m²</span>
                </div>
              )}
              {isRental && property.acceptsPets && (
                <div className="flex items-center gap-1.5 text-green-400" title="Aceita Pets">
                  <PawPrint className="h-4 w-4" />
                </div>
              )}
            </div>
          )}
          {property.type === "terreno" && property.landArea > 0 && (
            <div className="flex items-center gap-4 border-t border-border pt-4">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Maximize className="h-4 w-4 text-primary" />
                <span className="font-body text-sm">{property.landArea.toLocaleString("pt-BR")}m² de terreno</span>
              </div>
            </div>
          )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const PropertyCard = memo(PropertyCardComponent, (prev, next) =>
  prev.property.id === next.property.id && prev.index === next.index
);

export default PropertyCard;
