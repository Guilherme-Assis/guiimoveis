import { useEffect, useRef } from "react";
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
  type: string;
}

interface PropertyMapProps {
  properties: MapProperty[];
}

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const PropertyMap = ({ properties }: PropertyMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const validProperties = properties.filter((p) => p.latitude && p.longitude);

    const center: L.LatLngExpression =
      validProperties.length > 0
        ? [validProperties[0].latitude, validProperties[0].longitude]
        : [-23.5505, -46.6333]; // São Paulo default

    const map = L.map(mapRef.current, {
      center,
      zoom: 6,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    validProperties.forEach((prop) => {
      const marker = L.marker([prop.latitude, prop.longitude], { icon: defaultIcon }).addTo(map);
      const link = prop.slug ? `/imovel/${prop.slug}` : `/imovel/${prop.id}`;
      marker.bindPopup(`
        <div style="min-width:180px;font-family:sans-serif;">
          ${prop.image_url ? `<img src="${prop.image_url}" style="width:100%;height:100px;object-fit:cover;border-radius:4px;margin-bottom:8px;" />` : ""}
          <strong style="font-size:14px;">${prop.title}</strong>
          <p style="color:#666;font-size:12px;margin:4px 0;">${prop.city}</p>
          <p style="color:#b8860b;font-weight:bold;font-size:14px;">${formatPrice(Number(prop.price))}</p>
          <a href="${link}" style="color:#b8860b;font-size:12px;text-decoration:underline;">Ver detalhes →</a>
        </div>
      `);
    });

    if (validProperties.length > 1) {
      const bounds = L.latLngBounds(validProperties.map((p) => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [properties]);

  return (
    <div className="relative overflow-hidden border border-border">
      <div ref={mapRef} className="h-[500px] w-full" />
    </div>
  );
};

export default PropertyMap;
