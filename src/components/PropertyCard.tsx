import { motion } from "framer-motion";
import { Bed, Bath, Car, Maximize, MapPin } from "lucide-react";
import { Property, formatPrice } from "@/data/properties";
import { Link } from "react-router-dom";

interface PropertyCardProps {
  property: Property & { slug?: string };
  index: number;
}

const PropertyCard = ({ property, index }: PropertyCardProps) => {
  const statusLabels: Record<string, string> = {
    venda: "Venda",
    aluguel: "Aluguel",
    lançamento: "Lançamento",
  };

  const linkTo = property.slug ? `/imovel/${property.slug}` : `/imovel/${property.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <Link
        to={linkTo}
        className="group block overflow-hidden border border-border bg-card transition-all duration-500 hover:border-primary/30 hover:shadow-[var(--shadow-gold)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={property.image}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            width={1024}
            height={768}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          <div className="absolute left-4 top-4">
            <span className="bg-gradient-gold px-3 py-1 font-body text-xs font-semibold uppercase tracking-wider text-primary-foreground">
              {statusLabels[property.status]}
            </span>
          </div>
          <div className="absolute bottom-4 left-4">
            <p className="font-display text-2xl font-semibold text-foreground">
              {formatPrice(property.price)}
            </p>
          </div>
        </div>

        <div className="p-5">
          <h3 className="mb-2 font-display text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
            {property.title}
          </h3>
          <div className="mb-4 flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="font-body text-sm">
              {property.location}, {property.city} - {property.state}
            </span>
          </div>

          {property.type !== "terreno" && (
            <div className="flex items-center gap-4 border-t border-border pt-4">
              {property.bedrooms > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Bed className="h-4 w-4 text-primary" />
                  <span className="font-body text-sm">{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Bath className="h-4 w-4 text-primary" />
                  <span className="font-body text-sm">{property.bathrooms}</span>
                </div>
              )}
              {property.parkingSpaces > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Car className="h-4 w-4 text-primary" />
                  <span className="font-body text-sm">{property.parkingSpaces}</span>
                </div>
              )}
              {property.area > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Maximize className="h-4 w-4 text-primary" />
                  <span className="font-body text-sm">{property.area}m²</span>
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
      </Link>
    </motion.div>
  );
};

export default PropertyCard;
