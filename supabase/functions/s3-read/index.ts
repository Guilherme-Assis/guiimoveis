import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SIGN_URL = "https://connector-gateway.lovable.dev/api/v1/sign_storage_url?provider=aws_s3";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const AWS_S3_API_KEY = Deno.env.get("AWS_S3_API_KEY");
  if (!AWS_S3_API_KEY) {
    return new Response(JSON.stringify({ error: "AWS_S3_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { keys } = await req.json();
    
    if (!Array.isArray(keys) || keys.length === 0 || keys.length > 50) {
      return new Response(JSON.stringify({ error: "keys must be an array of 1-50 strings" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate all keys are strings
    for (const key of keys) {
      if (typeof key !== "string" || key.length === 0) {
        return new Response(JSON.stringify({ error: "Each key must be a non-empty string" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Extract object paths from full S3 URLs or use as-is
    const S3_PREFIX = "https://s3.sa-east-1.amazonaws.com/gui-imoveis/";
    
    const results: Record<string, string> = {};

    await Promise.all(
      keys.map(async (key: string) => {
        let objectPath = key;
        if (key.startsWith(S3_PREFIX)) {
          objectPath = key.replace(S3_PREFIX, "");
        }

        const signResponse = await fetch(`${SIGN_URL}&mode=read`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": AWS_S3_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ object_path: objectPath }),
        });

        if (signResponse.ok) {
          const { url } = await signResponse.json();
          results[key] = url;
        } else {
          const errText = await signResponse.text();
          console.error(`Failed to sign ${objectPath}:`, errText);
          results[key] = key; // fallback to original
        }
      })
    );

    return new Response(JSON.stringify({ urls: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("S3 read error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate read URLs" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
