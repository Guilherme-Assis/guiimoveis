import { GraduationCap, ShoppingBag, Bus, Shield, TreePine, Utensils } from "lucide-react";

interface NeighborhoodCategory {
  rating: number;
  count: number;
  label: string;
  description: string;
}

interface NeighborhoodRatingProps {
  neighborhood: string;
  city: string;
  neighborhoodData?: Record<string, NeighborhoodCategory> | null;
}

const icons: Record<string, any> = {
  schools: GraduationCap,
  shopping: ShoppingBag,
  transport: Bus,
  safety: Shield,
  nature: TreePine,
  restaurants: Utensils,
};

const RatingDots = ({ rating }: { rating: number }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className={`h-2 w-2 rounded-full ${i <= rating ? "bg-primary" : "bg-border"}`}
      />
    ))}
  </div>
);

const NeighborhoodRating = ({ neighborhood, city, neighborhoodData }: NeighborhoodRatingProps) => {
  if (!neighborhoodData || Object.keys(neighborhoodData).length === 0) {
    return null;
  }

  return (
    <div className="mb-10">
      <h2 className="mb-2 font-display text-2xl font-semibold text-foreground">Sobre o Bairro</h2>
      <p className="mb-6 font-body text-sm text-muted-foreground">
        Infraestrutura e serviços próximos em {neighborhood}, {city}
      </p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Object.entries(neighborhoodData).map(([key, item]) => {
          const Icon = icons[key];
          if (!Icon) return null;
          return (
            <div key={key} className="flex items-start gap-3 rounded-lg border border-border/30 bg-card/50 p-4 transition-colors hover:border-border/60">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-body text-sm font-semibold text-foreground">{item.label}</p>
                <p className="mt-0.5 font-body text-[11px] text-muted-foreground">
                  {item.count > 0 ? `${item.count} encontrados` : item.description}
                </p>
                <div className="mt-2">
                  <RatingDots rating={item.rating} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 font-body text-[10px] text-muted-foreground">
        * Dados obtidos via OpenStreetMap num raio de 1.5km do imóvel.
      </p>
    </div>
  );
};

export default NeighborhoodRating;
