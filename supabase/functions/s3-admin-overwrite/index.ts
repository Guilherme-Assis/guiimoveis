// Temporary admin endpoint: returns a signed PUT URL for an EXACT object_path
// Used internally to overwrite existing seed images with optimized versions.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-admin-token",
};

const SIGN_URL = "https://connector-gateway.lovable.dev/api/v1/sign_storage_url?provider=aws_s3";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ADMIN_TOKEN = Deno.env.get("S3_ADMIN_OVERWRITE_TOKEN") || "korretora-temp-2026";
  const provided = req.headers.get("x-admin-token");
  if (provided !== ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  const AWS_S3_API_KEY = Deno.env.get("AWS_S3_API_KEY")!;

  try {
    const { object_path } = await req.json();
    if (!object_path || typeof object_path !== "string") {
      return new Response(JSON.stringify({ error: "object_path required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const r = await fetch(`${SIGN_URL}&mode=write`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": AWS_S3_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ object_path }),
    });

    if (!r.ok) {
      const txt = await r.text();
      return new Response(JSON.stringify({ error: txt }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
