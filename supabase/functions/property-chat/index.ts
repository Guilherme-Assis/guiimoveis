import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages, filters } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Query matching properties from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from("db_properties")
      .select("id, title, type, status, price, bedrooms, bathrooms, parking_spaces, area, city, state, location, features, slug, description")
      .eq("availability", "available")
      .limit(20);

    if (filters) {
      if (filters.city) query = query.ilike("city", `%${filters.city}%`);
      if (filters.type) query = query.eq("type", filters.type);
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.minPrice) query = query.gte("price", filters.minPrice);
      if (filters.maxPrice) query = query.lte("price", filters.maxPrice);
      if (filters.bedrooms) query = query.gte("bedrooms", filters.bedrooms);
    }

    const { data: properties } = await query;

    const propertyContext = properties && properties.length > 0
      ? `\n\nImóveis disponíveis no banco de dados que correspondem aos critérios:\n${JSON.stringify(
          properties.map((p) => ({
            titulo: p.title,
            tipo: p.type,
            status: p.status,
            preco: `R$ ${Number(p.price).toLocaleString("pt-BR")}`,
            quartos: p.bedrooms,
            banheiros: p.bathrooms,
            vagas: p.parking_spaces,
            area: `${p.area}m²`,
            cidade: p.city,
            estado: p.state,
            bairro: p.location,
            comodidades: p.features,
            slug: p.slug,
            descricao: p.description?.substring(0, 150),
          })),
          null,
          2
        )}`
      : "\n\nNenhum imóvel encontrado com os critérios informados.";

    const systemPrompt = `Você é o assistente virtual de uma imobiliária brasileira chamada GUI Imóveis. Seu papel é ajudar os clientes a encontrar o imóvel ideal.

REGRAS:
- Responda SEMPRE em português do Brasil
- Seja simpático, profissional e objetivo
- Quando o usuário responder às perguntas guiadas, analise as respostas e busque os melhores imóveis
- Ao recomendar imóveis, mencione os detalhes relevantes (preço, quartos, localização, área)
- Se não encontrar imóveis compatíveis, sugira alternativas próximas ou ajuste de critérios
- Use formatação markdown para organizar as respostas
- Quando recomendar um imóvel, inclua o link no formato: [Ver imóvel](/imovel/{slug})
- Limite respostas a 300 palavras
- NÃO invente imóveis, use SOMENTE os dados fornecidos no contexto

${propertyContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas solicitações. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao processar sua solicitação." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("property-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
