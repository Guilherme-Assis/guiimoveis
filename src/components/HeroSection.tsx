import { Search, Building2, Users, MapPin, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-mansion.webp";

interface HeroSectionProps {
  onScrollToListings: () => void;
}

const stats = [
  { icon: Building2, value: "500+", label: "Imóveis" },
  { icon: Users, value: "100+", label: "Corretores" },
  { icon: MapPin, value: "50+", label: "Cidades" },
  { icon: TrendingUp, value: "98%", label: "Satisfação" },
];

const HeroSection = ({ onScrollToListings }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Mansão de luxo ao entardecer"
          className="h-full w-full object-cover"
          width={1920}
          height={1080}
          loading="eager"
          decoding="async"
          {...({ fetchpriority: "high" } as any)}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-screen flex-col items-center justify-center px-6 text-center">
        <div className="max-w-4xl">
          <p className="mb-4 text-sm font-body uppercase tracking-[0.3em] text-primary drop-shadow-lg">
            Comunidade de Corretores Autônomos
          </p>
          <h1 className="mb-4 sm:mb-6 font-display text-3xl sm:text-5xl font-semibold leading-tight text-foreground md:text-7xl lg:text-8xl [text-shadow:_0_2px_20px_rgba(0,0,0,0.5)]">
            Conecte-se.{" "}
            <span className="text-gradient-gold italic">Parceria.</span>
            <br />
            Resultados.
          </h1>
          <p className="mx-auto mb-6 sm:mb-10 max-w-2xl font-body text-base sm:text-lg font-light text-muted-foreground md:text-xl [text-shadow:_0_1px_10px_rgba(0,0,0,0.4)]">
            A maior comunidade de corretores autônomos do Brasil. Divulgue seus imóveis,
            encontre parceiros e feche mais negócios juntos.
          </p>
        </div>

        <button
          onClick={onScrollToListings}
          className="group flex items-center gap-3 bg-gradient-gold px-6 py-3 sm:px-8 sm:py-4 font-body text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-all hover:shadow-[var(--shadow-gold)] hover:scale-105"
        >
          <Search className="h-4 w-4" />
          Explorar Imóveis
        </button>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-body">
            Scroll
          </span>
          <div className="h-8 w-[1px] bg-gradient-gold animate-pulse" />
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 border-t border-border/30 bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 gap-4 py-8 md:grid-cols-4 md:gap-8 md:py-12">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-2 text-center">
                <stat.icon className="h-6 w-6 text-primary" />
                <span className="font-display text-2xl font-bold text-foreground md:text-3xl">
                  {stat.value}
                </span>
                <span className="font-body text-xs uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
