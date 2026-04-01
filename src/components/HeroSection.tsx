import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useS3Image } from "@/hooks/useS3Image";

const heroImageUrl = "https://s3.sa-east-1.amazonaws.com/gui-imoveis/properties/hero-mansion.jpg";

interface HeroSectionProps {
  onScrollToListings: () => void;
}

const HeroSection = ({ onScrollToListings }: HeroSectionProps) => {
  const heroImage = useS3Image(heroImageUrl);
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Mansão de luxo ao entardecer"
          className="h-full w-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-4xl"
        >
          <p className="mb-4 text-sm font-body uppercase tracking-[0.3em] text-primary">
            Imóveis de Alto Padrão
          </p>
          <h1 className="mb-4 sm:mb-6 font-display text-3xl sm:text-5xl font-semibold leading-tight text-foreground md:text-7xl lg:text-8xl">
            Onde o Luxo{" "}
            <span className="text-gradient-gold italic">Encontra</span>
            <br />
            seu Endereço
          </h1>
          <p className="mx-auto mb-6 sm:mb-10 max-w-2xl font-body text-base sm:text-lg font-light text-muted-foreground md:text-xl">
            Descubra propriedades exclusivas que redefinem o conceito de
            sofisticação e elegância no mercado imobiliário brasileiro.
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          onClick={onScrollToListings}
          className="group flex items-center gap-3 bg-gradient-gold px-6 py-3 sm:px-8 sm:py-4 font-body text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-all hover:shadow-[var(--shadow-gold)] hover:scale-105"
        >
          <Search className="h-4 w-4" />
          Explorar Imóveis
        </motion.button>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 flex flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-body">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="h-8 w-[1px] bg-gradient-gold"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
