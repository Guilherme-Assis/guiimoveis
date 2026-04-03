import { Link } from "react-router-dom";
import { ArrowLeft, Bed, Bath, Car, Maximize, MapPin, Check, X, PawPrint, Sofa } from "lucide-react";
import { useCompare } from "@/contexts/CompareContext";
import { formatPrice } from "@/data/properties";
import { useS3Image } from "@/hooks/useS3Image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const PropertyImage = ({ src, alt }: { src: string; alt: string }) => {
  const img = useS3Image(src);
  return <img src={img} alt={alt} className="h-48 w-full object-cover" />;
};

const Compare = () => {
  const { compareList, removeFromCompare } = useCompare();

  if (compareList.length < 2) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex flex-col items-center gap-4 px-6 py-20">
          <p className="font-display text-2xl text-foreground">Selecione pelo menos 2 imóveis para comparar</p>
          <Link to="/" className="font-body text-primary hover:underline">Voltar aos imóveis</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const rows: { label: string; icon?: any; render: (p: any) => React.ReactNode }[] = [
    { label: "Preço", icon: null, render: (p) => {
      const isRental = p.status === "aluguel";
      const price = isRental && p.rentalPrice > 0 ? p.rentalPrice : p.price;
      return <span className="font-display text-xl font-bold text-gradient-gold">{formatPrice(price)}{isRental ? "/mês" : ""}</span>;
    }},
    { label: "Status", render: (p) => <span className="font-body text-sm capitalize">{p.status}</span> },
    { label: "Tipo", render: (p) => <span className="font-body text-sm capitalize">{p.type}</span> },
    { label: "Localização", icon: MapPin, render: (p) => <span className="font-body text-sm">{p.location}, {p.city} - {p.state}</span> },
    { label: "Quartos", icon: Bed, render: (p) => <span className="font-display text-lg font-semibold">{p.bedrooms}</span> },
    { label: "Banheiros", icon: Bath, render: (p) => <span className="font-display text-lg font-semibold">{p.bathrooms}</span> },
    { label: "Vagas", icon: Car, render: (p) => <span className="font-display text-lg font-semibold">{p.parkingSpaces}</span> },
    { label: "Área", icon: Maximize, render: (p) => <span className="font-display text-lg font-semibold">{p.area}m²</span> },
    { label: "Terreno", render: (p) => <span className="font-body text-sm">{p.landArea > 0 ? `${p.landArea.toLocaleString("pt-BR")}m²` : "—"}</span> },
    { label: "Aceita Pets", icon: PawPrint, render: (p) => p.acceptsPets ? <Check className="h-5 w-5 text-green-400" /> : <X className="h-5 w-5 text-muted-foreground/40" /> },
    { label: "Mobiliado", icon: Sofa, render: (p) => p.furnished ? <Check className="h-5 w-5 text-green-400" /> : <X className="h-5 w-5 text-muted-foreground/40" /> },
    { label: "Características", render: (p) => (
      <div className="flex flex-wrap gap-1">
        {(p.features || []).slice(0, 5).map((f: string) => (
          <span key={f} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{f}</span>
        ))}
      </div>
    )},
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Voltar aos imóveis
        </Link>
        <h1 className="mb-8 font-display text-3xl font-bold text-foreground">Comparar Imóveis</h1>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr>
                <th className="w-40 p-2" />
                {compareList.map((p) => (
                  <th key={p.id} className="border border-border bg-card p-0 align-top">
                    <div className="relative">
                      <PropertyImage src={p.image} alt={p.title} />
                      <button
                        onClick={() => removeFromCompare(p.id)}
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="p-3">
                      <Link to={p.slug ? `/imovel/${p.slug}` : `/imovel/${p.id}`} className="font-display text-sm font-semibold text-foreground hover:text-primary line-clamp-2">
                        {p.title}
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <td className="p-3 font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {row.icon && <row.icon className="h-3.5 w-3.5 text-primary" />}
                      {row.label}
                    </div>
                  </td>
                  {compareList.map((p) => (
                    <td key={p.id} className="border-l border-border p-3 text-center">
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Compare;
