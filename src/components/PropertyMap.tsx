import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatPrice } from "@/data/properties";

interface MapProperty {
  id: string;
  title: string;
  price: number;
  latitude: number;
  longitude: number;
  slug?: string;
  image_url?: string;
  city: string;
  state?: string;
  location?: string;
  type: string;
}

interface PropertyMapProps {
  properties: MapProperty[];
  searchQuery?: string;
}

const typeColors: Record<string, string> = {
  casa: "#c9a050",
  mansao: "#c9a050",
  apartamento: "#6b8cce",
  cobertura: "#6b8cce",
  terreno: "#5da06b",
  fazenda: "#5da06b",
};

const createSvgIcon = (type: string): L.DivIcon => {
  const color = typeColors[type] || "#c9a050";

  const svgByType: Record<string, string> = {
    casa: `<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    mansao: `<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="14" r="1.5" fill="white"/>`,
    apartamento: `<rect x="5" y="3" width="14" height="18" rx="1" stroke="white" stroke-width="2" fill="none"/><line x1="9" y1="7" x2="9" y2="7.01" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="15" y1="7" x2="15" y2="7.01" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="11" x2="9" y2="11.01" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="15" y1="11" x2="15" y2="11.01" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M10 17h4v4h-4z" stroke="white" stroke-width="2" fill="none"/>`,
    cobertura: `<rect x="5" y="6" width="14" height="15" rx="1" stroke="white" stroke-width="2" fill="none"/><path d="M5 6l7-3 7 3" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/><line x1="9" y1="10" x2="9" y2="10.01" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="15" y1="10" x2="15" y2="10.01" stroke="white" stroke-width="2" stroke-linecap="round"/>`,
    terreno: `<path d="M4 20 L8 12 L12 16 L16 8 L20 14 L20 20 Z" stroke="white" stroke-width="2" fill="none" stroke-linejoin="round"/><circle cx="17" cy="6" r="2" stroke="white" stroke-width="2" fill="none"/>`,
    fazenda: `<path d="M4 20 L8 12 L12 16 L16 8 L20 14 L20 20 Z" stroke="white" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M12 10 L12 4 M10 6 L12 4 L14 6" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  };

  const svg = svgByType[type] || svgByType.casa;

  const html = `
    <div style="position:relative;width:44px;height:52px;">
      <svg width="44" height="52" viewBox="0 0 44 52" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 50 C22 50 42 32 42 20 C42 9 33 2 22 2 C11 2 2 9 2 20 C2 32 22 50 22 50Z" 
              fill="${color}" stroke="white" stroke-width="2"/>
      </svg>
      <svg width="24" height="24" viewBox="0 0 24 24" 
           style="position:absolute;top:8px;left:10px;" 
           xmlns="http://www.w3.org/2000/svg">
        ${svg}
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-map-marker",
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -48],
  });
};

const typeLabels: Record<string, string> = {
  casa: "Casa",
  mansao: "Mansão",
  apartamento: "Apartamento",
  cobertura: "Cobertura",
  terreno: "Terreno",
  fazenda: "Fazenda",
};

const PropertyMap = ({ properties, searchQuery = "" }: PropertyMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const filteredProperties = properties.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      (p.state || "").toLowerCase().includes(q) ||
      (p.location || "").toLowerCase().includes(q) ||
      (typeLabels[p.type] || "").toLowerCase().includes(q)
    );
  });

  const validProperties = filteredProperties.filter((p) => p.latitude && p.longitude);

  const buildMarkers = useCallback(
    (map: L.Map) => {
      // Clear old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      validProperties.forEach((prop) => {
        const icon = createSvgIcon(prop.type);
        const marker = L.marker([prop.latitude, prop.longitude], { icon }).addTo(map);
        const link = prop.slug ? `/imovel/${prop.slug}` : `/imovel/${prop.id}`;

        marker.bindPopup(`
          <div style="min-width:200px;font-family:sans-serif;">
            ${prop.image_url ? `<img src="${prop.image_url}" style="width:100%;height:110px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />` : ""}
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="background:${typeColors[prop.type] || "#c9a050"};color:white;font-size:10px;padding:2px 6px;border-radius:3px;text-transform:uppercase;font-weight:600;">
                ${typeLabels[prop.type] || prop.type}
              </span>
            </div>
            <strong style="font-size:14px;color:#1a1a1a;line-height:1.3;display:block;">${prop.title}</strong>
            <p style="color:#666;font-size:12px;margin:4px 0;">${prop.location ? prop.location + ", " : ""}${prop.city}${prop.state ? " - " + prop.state : ""}</p>
            <p style="color:#b8860b;font-weight:bold;font-size:15px;margin:6px 0;">${formatPrice(Number(prop.price))}</p>
            <a href="${link}" style="color:#b8860b;font-size:12px;text-decoration:none;font-weight:600;">Ver detalhes →</a>
          </div>
        `);

        markersRef.current.push(marker);
      });

      if (validProperties.length > 1) {
        const bounds = L.latLngBounds(validProperties.map((p) => [p.latitude, p.longitude]));
        map.fitBounds(bounds, { padding: [50, 50] });
      } else if (validProperties.length === 1) {
        map.setView([validProperties[0].latitude, validProperties[0].longitude], 13);
      }
    },
    [validProperties]
  );

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      buildMarkers(mapInstanceRef.current);
      return;
    }

    const center: L.LatLngExpression =
      validProperties.length > 0
        ? [validProperties[0].latitude, validProperties[0].longitude]
        : [-23.5505, -46.6333];

    const map = L.map(mapRef.current, {
      center,
      zoom: 6,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    buildMarkers(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
    };
  }, [validProperties, buildMarkers]);

  return (
    <div className="relative overflow-hidden border border-border">
      <div ref={mapRef} className="h-[600px] w-full" />
      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] border border-border bg-card/90 px-4 py-3 backdrop-blur-sm">
        <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wider text-foreground">Legenda</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {Object.entries(typeLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: typeColors[key] }}
              />
              <span className="font-body text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .custom-map-marker { background: transparent !important; border: none !important; }
      `}</style>
    </div>
  );
};

export default PropertyMap;
