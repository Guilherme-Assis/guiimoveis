const S3_BASE = "https://s3.sa-east-1.amazonaws.com/gui-imoveis/properties";

const heroImg = `${S3_BASE}/hero-mansion.jpg`;
const penthouseImg = `${S3_BASE}/property-penthouse.jpg`;
const beachVillaImg = `${S3_BASE}/property-beach-villa.jpg`;
const modernHouseImg = `${S3_BASE}/property-modern-house.jpg`;
const estateImg = `${S3_BASE}/property-estate.jpg`;
const landImg = `${S3_BASE}/property-land.jpg`;

export type PropertyType = "casa" | "apartamento" | "cobertura" | "terreno" | "fazenda" | "mansão" | "kitnet" | "flat" | "loft" | "casa_condominio" | "sitio_chacara";
export type PropertyStatus = "venda" | "aluguel" | "lançamento";

export interface Property {
  id: string;
  slug?: string;
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  location: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  area: number;
  landArea: number;
  description: string;
  features: string[];
  image: string;
  images: string[];
  isHighlight: boolean;
}

export const properties: Property[] = [
  {
    id: "1",
    title: "Mansão Contemporânea com Vista Panorâmica",
    type: "mansão",
    status: "venda",
    price: 18500000,
    location: "Jardim Europa",
    city: "São Paulo",
    state: "SP",
    bedrooms: 7,
    bathrooms: 9,
    parkingSpaces: 8,
    area: 1200,
    landArea: 2500,
    description: "Uma obra-prima da arquitetura contemporânea, esta mansão exclusiva oferece 1.200m² de área construída em um terreno de 2.500m². Projetada pelo renomado escritório de arquitetura Studio MK27, cada detalhe foi meticulosamente planejado para proporcionar o mais alto padrão de conforto e sofisticação. Amplos espaços integrados com pé-direito duplo, piscina de borda infinita com aquecimento solar, spa completo, adega climatizada para 2.000 garrafas, home theater com sistema Dolby Atmos, e jardim paisagístico assinado por Gilberto Elkis.",
    features: ["Piscina Infinita", "Spa Completo", "Adega Climatizada", "Home Theater", "Elevador", "Automação Total", "Segurança 24h", "Heliponto"],
    image: heroImg,
    images: [heroImg],
    isHighlight: true,
  },
  {
    id: "2",
    title: "Cobertura Duplex com Vista para o Skyline",
    type: "cobertura",
    status: "venda",
    price: 12800000,
    location: "Vila Nova Conceição",
    city: "São Paulo",
    state: "SP",
    bedrooms: 5,
    bathrooms: 7,
    parkingSpaces: 6,
    area: 680,
    landArea: 0,
    description: "Cobertura duplex espetacular no coração da Vila Nova Conceição, com vista privilegiada de 360° para o Parque Ibirapuera e o skyline paulistano.",
    features: ["Vista Panorâmica", "Piscina com Raia", "Terraço Gourmet", "Sauna", "Lareira", "Wine Bar", "4 Vagas Cobertas"],
    image: penthouseImg,
    images: [penthouseImg],
    isHighlight: true,
  },
  {
    id: "3",
    title: "Villa Mediterrânea à Beira-Mar",
    type: "casa",
    status: "venda",
    price: 25000000,
    location: "Jurerê Internacional",
    city: "Florianópolis",
    state: "SC",
    bedrooms: 6,
    bathrooms: 8,
    parkingSpaces: 5,
    area: 950,
    landArea: 1800,
    description: "Residência exclusiva pé-na-areia em Jurerê Internacional, o endereço mais cobiçado do sul do Brasil.",
    features: ["Pé na Areia", "Piscina Infinita", "Quadra de Tênis", "Cozinha Gourmet", "Pier Privativo", "Jardim Tropical", "Segurança 24h"],
    image: beachVillaImg,
    images: [beachVillaImg],
    isHighlight: true,
  },
  {
    id: "4",
    title: "Residência Moderna com Jardim Escultural",
    type: "casa",
    status: "venda",
    price: 8900000,
    location: "Alphaville",
    city: "Barueri",
    state: "SP",
    bedrooms: 5,
    bathrooms: 6,
    parkingSpaces: 4,
    area: 620,
    landArea: 1200,
    description: "Residência de alto padrão em condomínio fechado no Alphaville, com projeto arquitetônico arrojado.",
    features: ["Condomínio Fechado", "Piscina Aquecida", "Sauna", "Fitness", "Lareira Ecológica", "Jardim Paisagístico", "Energia Solar"],
    image: modernHouseImg,
    images: [modernHouseImg],
    isHighlight: false,
  },
  {
    id: "5",
    title: "Fazenda Premium com Vista para as Montanhas",
    type: "fazenda",
    status: "venda",
    price: 35000000,
    location: "Serra da Mantiqueira",
    city: "Campos do Jordão",
    state: "SP",
    bedrooms: 10,
    bathrooms: 12,
    parkingSpaces: 10,
    area: 2800,
    landArea: 500000,
    description: "Propriedade rural excepcional na Serra da Mantiqueira, com 50 hectares de paisagens deslumbrantes.",
    features: ["50 Hectares", "Centro Equestre", "Adega Subterrânea", "Lago Artificial", "Casa de Hóspedes", "Mata Nativa", "Nascentes", "Heliponto"],
    image: estateImg,
    images: [estateImg],
    isHighlight: true,
  },
  {
    id: "6",
    title: "Terreno Premium com Vista para o Oceano",
    type: "terreno",
    status: "venda",
    price: 4500000,
    location: "Praia do Rosa",
    city: "Imbituba",
    state: "SC",
    bedrooms: 0,
    bathrooms: 0,
    parkingSpaces: 0,
    area: 0,
    landArea: 5000,
    description: "Terreno exclusivo de 5.000m² em uma das praias mais bonitas do Brasil, com vista panorâmica de 270° para o Oceano Atlântico.",
    features: ["Vista para o Mar", "5.000m²", "Projeto Aprovado", "Infraestrutura Completa", "Acesso à Praia", "Vegetação Preservada"],
    image: landImg,
    images: [landImg],
    isHighlight: false,
  },
];

export const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "cobertura", label: "Cobertura" },
  { value: "terreno", label: "Terreno" },
  { value: "fazenda", label: "Fazenda" },
  { value: "mansão", label: "Mansão" },
  { value: "kitnet", label: "Kitnet / Studio" },
  { value: "flat", label: "Flat" },
  { value: "loft", label: "Loft" },
  { value: "casa_condominio", label: "Casa em Condomínio" },
  { value: "sitio_chacara", label: "Sítio / Chácara" },
];

export const propertyStatuses: { value: PropertyStatus; label: string }[] = [
  { value: "venda", label: "Venda" },
  { value: "aluguel", label: "Aluguel" },
  { value: "lançamento", label: "Lançamento" },
];

export const amenityOptions = [
  "Piscina", "Mobiliado", "Varanda", "Quintal", "Churrasqueira",
  "Sauna", "Academia", "Elevador", "Segurança 24h", "Condomínio Fechado",
  "Vista para o Mar", "Jardim", "Energia Solar", "Ar Condicionado",
  "Lareira", "Home Theater", "Playground", "Salão de Festas", "Automação", "Pet Friendly",
];

export const cities = [...new Set(properties.map((p) => p.city))];
export const states = [...new Set(properties.map((p) => p.state))];

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(price);

export const typeLabelsMap: Record<string, string> = {
  casa: "Casa", apartamento: "Apartamento", cobertura: "Cobertura",
  terreno: "Terreno", fazenda: "Fazenda", mansao: "Mansão", "mansão": "Mansão",
  kitnet: "Kitnet / Studio", flat: "Flat", loft: "Loft",
  casa_condominio: "Casa em Condomínio", sitio_chacara: "Sítio / Chácara",
};

export const slugifyCity = (city: string, state: string) => {
  const text = `${state}-${city}`.toLowerCase();
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};
