import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

interface PropertyLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  address: string;
  city: string;
  state: string;
  title: string;
}

const PropertyLocationMap = ({ latitude, longitude, address, city, state, title }: PropertyLocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState(false);

  // Geocode from address if no coordinates
  useEffect(() => {
    if (coords) return;
    const geocode = async () => {
      setGeocoding(true);
      try {
        const query = `${address}, ${city}, ${state}, Brasil`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
        );
        const data = await res.json();
        if (data && data.length > 0) {
          setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setGeocoding(false);
      }
    };
    geocode();
  }, [latitude, longitude, address, city, state, coords]);

  // Render map
  useEffect(() => {
    if (!mapRef.current || !coords) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 15,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      html: `
        <div style="position:relative;width:44px;height:52px;">
          <svg width="44" height="52" viewBox="0 0 44 52" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 50 C22 50 42 32 42 20 C42 9 33 2 22 2 C11 2 2 9 2 20 C2 32 22 50 22 50Z" 
                  fill="hsl(39, 50%, 55%)" stroke="white" stroke-width="2"/>
          </svg>
          <svg width="24" height="24" viewBox="0 0 24 24" style="position:absolute;top:8px;left:10px;" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="white" stroke-width="2" fill="none"/>
            <circle cx="12" cy="10" r="3" stroke="white" stroke-width="2" fill="none"/>
          </svg>
        </div>
      `,
      className: "custom-map-marker",
      iconSize: [44, 52],
      iconAnchor: [22, 52],
      popupAnchor: [0, -48],
    });

    L.marker([coords.lat, coords.lng], { icon })
      .addTo(map)
      .bindPopup(`<strong style="font-size:14px;">${title}</strong><br/><span style="color:#666;font-size:12px;">${address}, ${city} - ${state}</span>`)
      .openPopup();

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [coords, title, address, city, state]);

  if (error) return null;

  if (geocoding) {
    return (
      <div className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-semibold text-foreground">
          <MapPin className="h-5 w-5 text-primary" /> Localização
        </h2>
        <div className="flex h-[300px] items-center justify-center border border-border bg-muted">
          <p className="font-body text-sm text-muted-foreground">Carregando localização...</p>
        </div>
      </div>
    );
  }

  if (!coords) return null;

  return (
    <div className="mb-10">
      <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-semibold text-foreground">
        <MapPin className="h-5 w-5 text-primary" /> Localização
      </h2>
      <div className="overflow-hidden border border-border">
        <div ref={mapRef} className="h-[350px] w-full" />
      </div>
      <p className="mt-2 font-body text-xs text-muted-foreground">
        {address}, {city} - {state}
      </p>
      <style>{`.custom-map-marker { background: transparent !important; border: none !important; }`}</style>
    </div>
  );
};

export default PropertyLocationMap;
