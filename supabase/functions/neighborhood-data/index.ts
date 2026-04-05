import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "npm:@supabase/supabase-js/cors";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

interface OverpassElement {
  type: string;
  id: number;
  tags?: Record<string, string>;
}

interface CategoryQuery {
  key: string;
  label: string;
  description: string;
  query: string;
}

const categories: CategoryQuery[] = [
  {
    key: "schools",
    label: "Escolas",
    description: "Instituições de ensino próximas",
    query: `node["amenity"="school"](around:{radius},{lat},{lng});way["amenity"="school"](around:{radius},{lat},{lng});`,
  },
  {
    key: "shopping",
    label: "Comércio",
    description: "Mercados, farmácias e lojas",
    query: `node["shop"](around:{radius},{lat},{lng});node["amenity"="pharmacy"](around:{radius},{lat},{lng});`,
  },
  {
    key: "transport",
    label: "Transporte",
    description: "Acesso a metrô e ônibus",
    query: `node["highway"="bus_stop"](around:{radius},{lat},{lng});node["station"="subway"](around:{radius},{lat},{lng});node["railway"="station"](around:{radius},{lat},{lng});`,
  },
  {
    key: "safety",
    label: "Segurança",
    description: "Delegacias e postos policiais",
    query: `node["amenity"="police"](around:{radius},{lat},{lng});way["amenity"="police"](around:{radius},{lat},{lng});`,
  },
  {
    key: "nature",
    label: "Áreas Verdes",
    description: "Parques e praças próximos",
    query: `node["leisure"="park"](around:{radius},{lat},{lng});way["leisure"="park"](around:{radius},{lat},{lng});node["leisure"="garden"](around:{radius},{lat},{lng});`,
  },
  {
    key: "restaurants",
    label: "Gastronomia",
    description: "Restaurantes e cafés",
    query: `node["amenity"="restaurant"](around:{radius},{lat},{lng});node["amenity"="cafe"](around:{radius},{lat},{lng});`,
  },
];

function countToRating(count: number, key: string): number {
  // Different thresholds per category
  const thresholds: Record<string, number[]> = {
    schools: [1, 3, 5, 8],
    shopping: [2, 5, 10, 20],
    transport: [2, 5, 10, 20],
    safety: [1, 2, 3, 5],
    nature: [1, 2, 4, 7],
    restaurants: [2, 5, 10, 20],
  };
  const t = thresholds[key] || [1, 3, 5, 10];
  if (count === 0) return 1;
  if (count < t[0]) return 1;
  if (count < t[1]) return 2;
  if (count < t[2]) return 3;
  if (count < t[3]) return 4;
  return 5;
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

    // Build a single combined Overpass query for efficiency
    let combinedQuery = "[out:json][timeout:30];(";
    for (const cat of categories) {
      combinedQuery += cat.query
        .replace(/{radius}/g, String(radius))
        .replace(/{lat}/g, String(latitude))
        .replace(/{lng}/g, String(longitude));
    }
    combinedQuery += ");out count;";

    // Unfortunately count doesn't give per-category breakdown, so we query each
    const results: Record<string, { rating: number; count: number; label: string; description: string }> = {};

    for (const cat of categories) {
      const query = `[out:json][timeout:15];(${cat.query
        .replace(/{radius}/g, String(radius))
        .replace(/{lat}/g, String(latitude))
        .replace(/{lng}/g, String(longitude))});out count;`;

      try {
        const res = await fetch(OVERPASS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(query)}`,
        });
        const data = await res.json();
        const count = data.elements?.[0]?.tags?.total
          ? parseInt(data.elements[0].tags.total)
          : (data.elements?.length || 0);

        results[cat.key] = {
          rating: countToRating(count, cat.key),
          count,
          label: cat.label,
          description: cat.description,
        };
      } catch {
        results[cat.key] = {
          rating: 0,
          count: 0,
          label: cat.label,
          description: cat.description,
        };
      }
    }

    // If property_id provided, save to database
    if (property_id) {
      const authHeader = req.headers.get("Authorization");
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from("db_properties")
        .update({ neighborhood_data: results })
        .eq("id", property_id);
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
