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

// Query each category separately with count output for speed
async function queryCategory(key: string, lat: number, lng: number, radius: number): Promise<number> {
  const queries: Record<string, string> = {
    schools: `node["amenity"="school"](around:${radius},${lat},${lng});`,
    shopping: `node["shop"](around:${radius},${lat},${lng});node["amenity"="pharmacy"](around:${radius},${lat},${lng});`,
    transport: `node["highway"="bus_stop"](around:${radius},${lat},${lng});`,
    safety: `node["amenity"="police"](around:${radius},${lat},${lng});`,
    nature: `node["leisure"="park"](around:${radius},${lat},${lng});`,
    restaurants: `node["amenity"="restaurant"](around:${radius},${lat},${lng});node["amenity"="cafe"](around:${radius},${lat},${lng});`,
  };

  const q = `[out:json][timeout:5];(${queries[key]});out count;`;
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(q)}`,
  });

  if (!res.ok) {
    await res.text();
    return 0;
  }

  const data = await res.json();
  const total = data.elements?.[0]?.tags?.total;
  return total ? parseInt(total) : 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { property_id, latitude, longitude, radius = 1000 } = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "latitude and longitude are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Run all category queries in parallel
    const keys = Object.keys(categoryConfig);
    const counts = await Promise.all(keys.map(k => queryCategory(k, latitude, longitude, radius)));

    const results: Record<string, { rating: number; count: number; label: string; description: string }> = {};
    keys.forEach((key, i) => {
      const cfg = categoryConfig[key];
      results[key] = {
        rating: countToRating(counts[i], cfg.thresholds),
        count: counts[i],
        label: cfg.label,
        description: cfg.description,
      };
    });

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
