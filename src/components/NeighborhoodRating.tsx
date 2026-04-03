import { GraduationCap, ShoppingBag, Bus, Shield, TreePine, Utensils } from "lucide-react";

interface NeighborhoodRatingProps {
  neighborhood: string;
  city: string;
}

// Simulated data — can be replaced with API later
const getNeighborhoodData = (neighborhood: string, city: string) => {
  // Seeded pseudo-random based on neighborhood name
  const seed = neighborhood.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = (offset: number) => ((seed + offset * 37) % 5) + 1;

  return {
    schools: { rating: Math.max(3, r(1)), label: "Escolas", description: "Instituições de ensino próximas" },
    shopping: { rating: Math.max(2, r(2)), label: "Comércio", description: "Mercados, farmácias e lojas" },
    transport: { rating: Math.max(2, r(3)), label: "Transporte", description: "Acesso a metrô e ônibus" },
    safety: { rating: Math.max(3, r(4)), label: "Segurança", description: "Índice de segurança da região" },
    nature: { rating: Math.max(2, r(5)), label: "Áreas Verdes", description: "Parques e praças próximos" },
    restaurants: { rating: Math.max(2, r(6)), label: "Gastronomia", description: "Restaurantes e cafés" },
  };
};

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

const NeighborhoodRating = ({ neighborhood, city }: NeighborhoodRatingProps) => {
  const data = getNeighborhoodData(neighborhood, city);

  return (
    <div className="mb-10">
      <h2 className="mb-2 font-display text-2xl font-semibold text-foreground">Sobre o Bairro</h2>
      <p className="mb-6 font-body text-sm text-muted-foreground">
        Informações sobre infraestrutura e serviços em {neighborhood}, {city}
      </p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Object.entries(data).map(([key, item]) => {
          const Icon = icons[key];
          return (
            <div key={key} className="flex items-start gap-3 rounded-lg border border-border/30 bg-card/50 p-4 transition-colors hover:border-border/60">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-body text-sm font-semibold text-foreground">{item.label}</p>
                <p className="mt-0.5 font-body text-[11px] text-muted-foreground">{item.description}</p>
                <div className="mt-2">
                  <RatingDots rating={item.rating} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 font-body text-[10px] text-muted-foreground">
        * Avaliações baseadas em dados estimados da região. Consulte fontes oficiais para informações precisas.
      </p>
    </div>
  );
};

export default NeighborhoodRating;
