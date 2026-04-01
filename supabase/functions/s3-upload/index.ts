import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/aws_s3";
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

  // Verify user is authenticated
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "get_upload_url") {
      // Generate a signed upload URL
      const { filename, content_type } = await req.json();
      if (!filename || typeof filename !== "string") {
        return new Response(JSON.stringify({ error: "filename is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
      const objectKey = `properties/${crypto.randomUUID()}.${ext}`;

      const signResponse = await fetch(`${SIGN_URL}&mode=write`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": AWS_S3_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ object_path: objectKey }),
      });

      if (!signResponse.ok) {
        const errText = await signResponse.text();
        console.error("Sign upload error:", errText);
        return new Response(JSON.stringify({ error: "Failed to generate upload URL" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { url: uploadUrl, expires_in } = await signResponse.json();

      // Also get a read URL for the uploaded file
      const readSignResponse = await fetch(`${SIGN_URL}&mode=read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": AWS_S3_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ object_path: objectKey }),
      });

      let publicUrl = "";
      if (readSignResponse.ok) {
        const readData = await readSignResponse.json();
        // Extract the base URL without query params (the object URL)
        const parsedUrl = new URL(readData.url);
        publicUrl = `${parsedUrl.origin}${parsedUrl.pathname}`;
      }

      return new Response(JSON.stringify({ 
        upload_url: uploadUrl, 
        object_key: objectKey,
        public_url: publicUrl,
        expires_in 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_read_url") {
      const { object_key } = await req.json();
      if (!object_key || typeof object_key !== "string") {
        return new Response(JSON.stringify({ error: "object_key is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const signResponse = await fetch(`${SIGN_URL}&mode=read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": AWS_S3_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ object_path: object_key }),
      });

      if (!signResponse.ok) {
        const errText = await signResponse.text();
        console.error("Sign read error:", errText);
        return new Response(JSON.stringify({ error: "Failed to generate read URL" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { url: readUrl, expires_in } = await signResponse.json();

      return new Response(JSON.stringify({ read_url: readUrl, expires_in }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      const prefix = url.searchParams.get("prefix") || "properties/";
      const params = new URLSearchParams({
        "list-type": "2",
        prefix,
        "max-keys": "100",
      });

      const listResponse = await fetch(`${GATEWAY_URL}/?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": AWS_S3_API_KEY,
        },
      });

      const xml = await listResponse.text();
      return new Response(JSON.stringify({ data: xml }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use: get_upload_url, get_read_url, list" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("S3 upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
