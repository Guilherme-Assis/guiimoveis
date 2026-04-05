import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "npm:@supabase/supabase-js/cors";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const categoryConfig: Record<string, { label: string; description: string; thresholds: number[] }> = {
  schools: { label: "Escolas", description: "Instituições de ensino próximas", thresholds: [1, 3, 5, 8] },
  shopping: { label: "Comércio", description: "Mercados, farmácias e lojas", thresholds: [2, 5, 10, 20] },
  transport: { label: "Transporte", description: "Acesso a metrô e ônibus", thresholds: [2, 5, 10, 20] },
  safety: { label: "Segurança", description: "Delegacias e postos policiais", thresholds: [1, 2, 3, 5] },
  nature: { label: "Áreas Verdes", description: "Parques e praças próximos", thresholds: [1, 2, 4, 7] },
  restaurants: { label: "Gastronomia", description: "Restaurantes e cafés", thresholds: [2, 5, 10, 20] },
};

function countToRating(count: number, thresholds: number[]): number {
  if (count === 0) return 1;
  if (count < thresholds[0]) return 1;
  if (count < thresholds[1]) return 2;
  if (count < thresholds[2]) return 3;
  if (count < thresholds[3]) return 4;
  return 5;
}

function classifyTag(tags: Record<string, string> | undefined): string | null {
  if (!tags) return null;
  if (tags.amenity === "school") return "schools";
  if (tags.shop || tags.amenity === "pharmacy" || tags.amenity === "marketplace") return "shopping";
  if (tags.highway === "bus_stop" || tags.station === "subway" || tags.railway === "station" || tags.amenity === "bus_station") return "transport";
  if (tags.amenity === "police") return "safety";
  if (tags.leisure === "park" || tags.leisure === "garden") return "nature";
  if (tags.amenity === "restaurant" || tags.amenity === "cafe") return "restaurants";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { property_id, latitude, longitude, radius = 1500 } = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "latitude and longitude are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Single combined Overpass query
    const query = `[out:json][timeout:25];
(
  node["amenity"="school"](around:${radius},${latitude},${longitude});
  way["amenity"="school"](around:${radius},${latitude},${longitude});
  node["shop"](around:${radius},${latitude},${longitude});
  node["amenity"="pharmacy"](around:${radius},${latitude},${longitude});
  node["highway"="bus_stop"](around:${radius},${latitude},${longitude});
  node["station"="subway"](around:${radius},${latitude},${longitude});
  node["railway"="station"](around:${radius},${latitude},${longitude});
  node["amenity"="police"](around:${radius},${latitude},${longitude});
  way["amenity"="police"](around:${radius},${latitude},${longitude});
  node["leisure"="park"](around:${radius},${latitude},${longitude});
  way["leisure"="park"](around:${radius},${latitude},${longitude});
  node["leisure"="garden"](around:${radius},${latitude},${longitude});
  node["amenity"="restaurant"](around:${radius},${latitude},${longitude});
  node["amenity"="cafe"](around:${radius},${latitude},${longitude});
);out tags;`;

    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Overpass API error ${res.status}: ${text.substring(0, 200)}`);
    }

    const data = await res.json();

    // Count per category
    const counts: Record<string, number> = { schools: 0, shopping: 0, transport: 0, safety: 0, nature: 0, restaurants: 0 };
    for (const el of (data.elements || [])) {
      const cat = classifyTag(el.tags);
      if (cat) counts[cat]++;
    }

    // Build results
    const results: Record<string, { rating: number; count: number; label: string; description: string }> = {};
    for (const [key, cfg] of Object.entries(categoryConfig)) {
      results[key] = {
        rating: countToRating(counts[key], cfg.thresholds),
        count: counts[key],
        label: cfg.label,
        description: cfg.description,
      };
    }

    // Save to database if property_id provided
    if (property_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from("db_properties").update({ neighborhood_data: results }).eq("id", property_id);
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("neighborhood-data error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
