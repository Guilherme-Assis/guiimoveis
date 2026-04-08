import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const S3_PREFIX = "https://s3.sa-east-1.amazonaws.com/gui-imoveis/";
const SIGN_URL = "https://connector-gateway.lovable.dev/api/v1/sign_storage_url?provider=aws_s3&mode=read";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status: number) {
  return jsonResponse({ error: message }, status);
}

// ── S3 Signed URL Resolution ──

function isS3Url(url: string): boolean {
  return typeof url === "string" && url.startsWith(S3_PREFIX);
}

/** Collect all S3 URLs from rows (image_url, images, cover_image_url, avatar_url) */
function collectS3Urls(rows: any[]): string[] {
  const urls = new Set<string>();
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    if (isS3Url(row.image_url)) urls.add(row.image_url);
    if (isS3Url(row.cover_image_url)) urls.add(row.cover_image_url);
    if (isS3Url(row.avatar_url)) urls.add(row.avatar_url);
    if (Array.isArray(row.images)) {
      for (const img of row.images) {
        if (isS3Url(img)) urls.add(img);
      }
    }
  }
  return Array.from(urls);
}

/** Sign a batch of S3 URLs and return a mapping original → signed */
async function signS3Urls(urls: string[]): Promise<Record<string, string>> {
  if (urls.length === 0) return {};

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const AWS_S3_API_KEY = Deno.env.get("AWS_S3_API_KEY");
  if (!LOVABLE_API_KEY || !AWS_S3_API_KEY) return {};

  const results: Record<string, string> = {};

  await Promise.all(
    urls.map(async (key) => {
      try {
        const objectPath = key.replace(S3_PREFIX, "");
        const resp = await fetch(SIGN_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": AWS_S3_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ object_path: objectPath }),
        });
        if (resp.ok) {
          const { url } = await resp.json();
          results[key] = url;
        }
      } catch {
        // keep original on failure
      }
    })
  );

  return results;
}

/** Replace S3 URLs in rows with signed versions */
function applySignedUrls(rows: any[], mapping: Record<string, string>): void {
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    if (mapping[row.image_url]) row.image_url = mapping[row.image_url];
    if (mapping[row.cover_image_url]) row.cover_image_url = mapping[row.cover_image_url];
    if (mapping[row.avatar_url]) row.avatar_url = mapping[row.avatar_url];
    if (Array.isArray(row.images)) {
      row.images = row.images.map((img: string) => mapping[img] || img);
    }
  }
}

/** Resolve S3 URLs in response data (single row or array) */
async function resolveS3Images(data: any): Promise<void> {
  if (!data) return;
  const rows = Array.isArray(data) ? data : [data];
  const s3Urls = collectS3Urls(rows);
  if (s3Urls.length === 0) return;
  const mapping = await signS3Urls(s3Urls);
  applySignedUrls(rows, mapping);
}

// ── URL Parsing ──

function parsePath(url: URL): { resource: string; id: string | null; action: string | null } {
  const parts = url.pathname.replace(/^\/api\//, "").split("/").filter(Boolean);
  const resource = parts[0] || "";
  const second = parts[1] || null;
    const actions = ["search", "stats", "by-slug", "counts", "login", "refresh", "me", "signup", "active"];
  if (second && actions.includes(second)) {
    return { resource, id: null, action: second };
  }
  return { resource, id: second, action: parts[2] || null };
}

// ── Table & Resource Config ──

const RESOURCE_TABLE: Record<string, string> = {
  properties: "db_properties",
  brokers: "brokers",
  leads: "broker_leads",
  proposals: "broker_proposals",
  visits: "lead_property_visits",
  tasks: "broker_tasks",
  interactions: "broker_lead_interactions",
  templates: "message_templates",
  favorites: "favorites",
  reviews: "broker_reviews",
  profiles: "profiles",
  "blog-posts": "blog_posts",
  "property-views": "property_views",
  roles: "user_roles",
  partnerships: "partnerships",
  "partnership-transactions": "partnership_transactions",
  subscriptions: "subscriptions",
};

const PUBLIC_READ = new Set(["properties", "blog-posts"]);

/** Resources that may contain S3 image URLs */
const IMAGE_RESOURCES = new Set(["properties", "blog-posts", "profiles", "brokers"]);

function applyFilters(query: any, params: URLSearchParams, resource: string) {
  for (const [key, value] of params.entries()) {
    if (["limit", "offset", "order", "select", "action"].includes(key)) continue;
    if (key.startsWith("eq.")) query = query.eq(key.slice(3), value);
    else if (key.startsWith("gt.")) query = query.gt(key.slice(3), value);
    else if (key.startsWith("gte.")) query = query.gte(key.slice(3), value);
    else if (key.startsWith("lt.")) query = query.lt(key.slice(3), value);
    else if (key.startsWith("lte.")) query = query.lte(key.slice(3), value);
    else if (key.startsWith("like.")) query = query.ilike(key.slice(5), `%${value}%`);
    else if (key.startsWith("in.")) query = query.in(key.slice(3), value.split(","));
  }

  if (resource === "properties" && !params.has("eq.availability")) {
    query = query.eq("availability", "available");
  }

  return query;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const { resource, id, action } = parsePath(url);
  const params = url.searchParams;
  const method = req.method;

  // === AUTH ENDPOINTS ===
  if (resource === "auth") {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);

    if (action === "login" && method === "POST") {
      try {
        const body = await req.json();
        const email = typeof body.email === "string" ? body.email.trim() : "";
        const password = typeof body.password === "string" ? body.password : "";
        if (!email || !password) {
          return errorResponse("email and password are required", 400);
        }
        if (email.length > 255 || password.length > 128) {
          return errorResponse("Invalid input length", 400);
        }
        const { data, error } = await authClient.auth.signInWithPassword({ email, password });
        if (error) return errorResponse("Invalid login credentials", 401);
        return jsonResponse({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          token_type: "bearer",
          user: { id: data.user.id, email: data.user.email },
        });
      } catch {
        return errorResponse("Invalid request body", 400);
      }
    }

    if (action === "refresh" && method === "POST") {
      try {
        const body = await req.json();
        const refreshToken = typeof body.refresh_token === "string" ? body.refresh_token : "";
        if (!refreshToken) return errorResponse("refresh_token is required", 400);
        const { data, error } = await authClient.auth.refreshSession({ refresh_token: refreshToken });
        if (error || !data.session) return errorResponse("Invalid or expired refresh token", 401);
        return jsonResponse({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          token_type: "bearer",
        });
      } catch {
        return errorResponse("Invalid request body", 400);
      }
    }

    if (action === "me" && method === "GET") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) return errorResponse("Authorization required", 401);
      const meClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data, error } = await meClient.auth.getUser();
      if (error || !data.user) return errorResponse("Invalid token", 401);
      const { data: roleData } = await meClient.from("user_roles").select("role").eq("user_id", data.user.id);
      const { data: profileData } = await meClient.from("profiles").select("display_name, avatar_url, phone").eq("user_id", data.user.id).maybeSingle();
      return jsonResponse({
        user: {
          id: data.user.id,
          email: data.user.email,
          roles: roleData?.map((r: any) => r.role) || [],
          profile: profileData || null,
        },
      });
    }

    if (action === "signup" && method === "POST") {
      try {
        const body = await req.json();
        const email = typeof body.email === "string" ? body.email.trim() : "";
        const password = typeof body.password === "string" ? body.password : "";
        const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
        if (!email || !password) return errorResponse("email and password are required", 400);
        if (email.length > 255 || password.length > 128) return errorResponse("Invalid input length", 400);
        if (password.length < 6) return errorResponse("Password must be at least 6 characters", 400);
        const { data, error } = await authClient.auth.signUp({
          email,
          password,
          options: fullName ? { data: { full_name: fullName } } : undefined,
        });
        if (error) return errorResponse(error.message, 400);
        return jsonResponse({
          message: "Signup successful. Please check your email to confirm your account.",
          user: data.user ? { id: data.user.id, email: data.user.email } : null,
        }, 201);
      } catch {
        return errorResponse("Invalid request body", 400);
      }
    }

    return errorResponse("Unknown auth action. Available: POST /auth/login, POST /auth/signup, POST /auth/refresh, GET /auth/me", 404);
  }

  // === UPLOAD ENDPOINTS ===
  if (resource === "upload") {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse("Authorization required", 401);
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const uploadClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authErr } = await uploadClient.auth.getUser();
    if (authErr || !userData.user) return errorResponse("Invalid or expired token", 401);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const AWS_S3_API_KEY = Deno.env.get("AWS_S3_API_KEY");
    if (!LOVABLE_API_KEY || !AWS_S3_API_KEY) {
      return errorResponse("S3 integration not configured", 500);
    }

    const SIGN_WRITE_URL = "https://connector-gateway.lovable.dev/api/v1/sign_storage_url?provider=aws_s3&mode=write";
    const SIGN_READ_URL = "https://connector-gateway.lovable.dev/api/v1/sign_storage_url?provider=aws_s3&mode=read";
    const GATEWAY_URL = "https://connector-gateway.lovable.dev/aws_s3";

    const uploadAction = action || params.get("action");

    if (uploadAction === "get_upload_url" && method === "POST") {
      try {
        const body = await req.json();
        const filename = typeof body.filename === "string" ? body.filename.trim() : "";
        if (!filename) return errorResponse("filename is required", 400);
        if (filename.length > 255) return errorResponse("filename too long", 400);

        const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
        const allowedExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"];
        if (!allowedExts.includes(ext)) return errorResponse(`File type .${ext} not allowed`, 400);

        const objectKey = `properties/${crypto.randomUUID()}.${ext}`;

        const signResp = await fetch(SIGN_WRITE_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": AWS_S3_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ object_path: objectKey }),
        });

        if (!signResp.ok) {
          console.error("Sign upload error:", await signResp.text());
          return errorResponse("Failed to generate upload URL", 500);
        }

        const { url: uploadUrl, expires_in } = await signResp.json();

        // Also get a read URL for the public path
        const readResp = await fetch(SIGN_READ_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": AWS_S3_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ object_path: objectKey }),
        });

        let publicUrl = "";
        if (readResp.ok) {
          const readData = await readResp.json();
          const parsedUrl = new URL(readData.url);
          publicUrl = `${parsedUrl.origin}${parsedUrl.pathname}`;
        }

        return jsonResponse({ upload_url: uploadUrl, object_key: objectKey, public_url: publicUrl, expires_in });
      } catch {
        return errorResponse("Invalid request body", 400);
      }
    }

    if (uploadAction === "get_read_url" && method === "POST") {
      try {
        const body = await req.json();
        const objectKey = typeof body.object_key === "string" ? body.object_key.trim() : "";
        if (!objectKey) return errorResponse("object_key is required", 400);

        const signResp = await fetch(SIGN_READ_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": AWS_S3_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ object_path: objectKey }),
        });

        if (!signResp.ok) {
          console.error("Sign read error:", await signResp.text());
          return errorResponse("Failed to generate read URL", 500);
        }

        const { url: readUrl, expires_in } = await signResp.json();
        return jsonResponse({ read_url: readUrl, expires_in });
      } catch {
        return errorResponse("Invalid request body", 400);
      }
    }

    if (uploadAction === "list" && method === "GET") {
      const prefix = params.get("prefix") || "properties/";
      const listParams = new URLSearchParams({
        "list-type": "2",
        prefix,
        "max-keys": "100",
      });

      const listResp = await fetch(`${GATEWAY_URL}/?${listParams}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": AWS_S3_API_KEY,
        },
      });

      const xml = await listResp.text();
      return jsonResponse({ data: xml });
    }

    return errorResponse("Unknown upload action. Use: POST /upload/get_upload_url, POST /upload/get_read_url, GET /upload/list", 400);
  }

  // Validate resource
  const table = RESOURCE_TABLE[resource];
  if (!table) {
    if (!resource || resource === "" || resource === "docs") {
      return jsonResponse({
        name: "GUI Imóveis API",
        version: "1.0.0",
        base_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/api`,
        auth: {
          description: "Authentication endpoints - no Bearer token needed for login/refresh",
          endpoints: [
            { method: "POST", path: "/auth/login", body: '{ "email": "...", "password": "..." }', returns: "access_token, refresh_token, user" },
            { method: "POST", path: "/auth/refresh", body: '{ "refresh_token": "..." }', returns: "new access_token, refresh_token" },
            { method: "GET", path: "/auth/me", headers: "Authorization: Bearer <token>", returns: "user info, roles, profile" },
          ],
        },
        upload: {
          description: "S3 image upload endpoints - requires Bearer token from /auth/login",
          endpoints: [
            { method: "POST", path: "/upload/get_upload_url", body: '{ "filename": "photo.jpg" }', returns: "upload_url (PUT to S3), object_key, public_url" },
            { method: "POST", path: "/upload/get_read_url", body: '{ "object_key": "properties/uuid.jpg" }', returns: "read_url (signed temporary URL)" },
            { method: "GET", path: "/upload/list?prefix=properties/", returns: "XML listing of S3 objects" },
          ],
          usage: "1. POST /upload/get_upload_url with filename → get upload_url. 2. PUT file binary to upload_url. 3. Use public_url as image reference in properties.",
        },
        endpoints: Object.keys(RESOURCE_TABLE).map((r) => ({
          resource: r,
          table: RESOURCE_TABLE[r],
          methods: PUBLIC_READ.has(r)
            ? ["GET (public)", "POST (auth)", "PATCH (auth)", "DELETE (auth)"]
            : ["GET (auth)", "POST (auth)", "PATCH (auth)", "DELETE (auth)"],
          paths: [
            `/${r}`,
            `/${r}/{id}`,
            ...(r === "properties" ? [`/${r}/by-slug?slug={slug}`, `/${r}/search`] : []),
            ...(r === "property-views" ? [`/${r}/counts?days=30`] : []),
          ],
        })),
        notes: [
          "All image fields (image_url, images, cover_image_url, avatar_url) with S3 URLs are automatically resolved to signed download URLs.",
        ],
        authentication: "Use POST /auth/login to get a Bearer token. Include it in Authorization header for protected endpoints.",
        filtering: {
          description: "Use query params with prefixes: eq., gt., gte., lt., lte., like., in.",
          examples: [
            "?eq.city=São Paulo",
            "?gte.price=500000&lte.price=1000000",
            "?like.title=casa",
            "?in.status=venda,aluguel",
          ],
        },
        pagination: {
          limit: "?limit=20 (default: 50, max: 100)",
          offset: "?offset=0",
          order: "?order=created_at.desc",
        },
        select: "?select=id,title,price,city (comma-separated columns)",
      });
    }
    return errorResponse(`Unknown resource: ${resource}. GET /api for available endpoints.`, 404);
  }

  // Auth check
  const authHeader = req.headers.get("Authorization");
  const isPublicRead = PUBLIC_READ.has(resource) && method === "GET";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });

  if (!isPublicRead) {
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse("Authorization header required. Use: Bearer <jwt_token>", 401);
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return errorResponse("Invalid or expired token", 401);
    }
  }

  const shouldResolveImages = IMAGE_RESOURCES.has(resource);

  try {
    // === SPECIAL ACTIONS ===
    if (resource === "properties" && action === "by-slug") {
      const slug = params.get("slug");
      if (!slug) return errorResponse("slug query param required", 400);
      const { data, error } = await supabase.rpc("get_property_by_slug", { _slug: slug });
      if (error) return errorResponse(error.message, 400);
      const row = data?.[0] || null;
      if (row) await resolveS3Images(row);
      return jsonResponse({ data: row });
    }

    if (resource === "properties" && action === "search") {
      const body = method === "POST" ? await req.json() : {};
      let query = supabase.from(table).select("id,slug,title,type,status,availability,price,location,city,state,bedrooms,bathrooms,parking_spaces,area,land_area,description,features,image_url,images,is_highlight,latitude,longitude,rental_price,condominium_fee,iptu,accepts_pets,furnished,open_for_partnership").eq("availability", "available");
      if (body.city) query = query.ilike("city", `%${body.city}%`);
      if (body.type) query = query.eq("type", body.type);
      if (body.status) query = query.eq("status", body.status);
      if (body.minPrice) query = query.gte("price", body.minPrice);
      if (body.maxPrice) query = query.lte("price", body.maxPrice);
      if (body.minBedrooms) query = query.gte("bedrooms", body.minBedrooms);
      if (body.minArea) query = query.gte("area", body.minArea);
      query = query.limit(body.limit || 50);
      const { data, error } = await query;
      if (error) return errorResponse(error.message, 400);
      if (data) await resolveS3Images(data);
      return jsonResponse({ data, count: data?.length || 0 });
    }

    if (resource === "property-views" && action === "counts") {
      const days = parseInt(params.get("days") || "30");
      const { data, error } = await supabase.rpc("get_property_view_counts", { days_back: days });
      if (error) return errorResponse(error.message, 400);
      return jsonResponse({ data });
    }

    // === CRUD OPERATIONS ===
    const selectCols = params.get("select") || "*";
    const limit = Math.min(parseInt(params.get("limit") || "50"), 100);
    const offset = parseInt(params.get("offset") || "0");
    const order = params.get("order");

    switch (method) {
      case "GET": {
        if (id) {
          const { data, error } = await supabase.from(table).select(selectCols).eq("id", id).maybeSingle();
          if (error) return errorResponse(error.message, 400);
          if (!data) return errorResponse("Not found", 404);
          if (shouldResolveImages) await resolveS3Images(data);
          return jsonResponse({ data });
        }
        let query = supabase.from(table).select(selectCols, { count: "exact" });
        query = applyFilters(query, params, resource);
        if (order) {
          const [col, dir] = order.split(".");
          query = query.order(col, { ascending: dir !== "desc" });
        } else {
          query = query.order("created_at", { ascending: false });
        }
        query = query.range(offset, offset + limit - 1);
        const { data, error, count } = await query;
        if (error) return errorResponse(error.message, 400);
        if (shouldResolveImages && data) await resolveS3Images(data);
        return jsonResponse({ data, count, limit, offset });
      }

      case "POST": {
        const body = await req.json();
        if (Array.isArray(body)) {
          const { data, error } = await supabase.from(table).insert(body).select();
          if (error) return errorResponse(error.message, 400);
          if (shouldResolveImages && data) await resolveS3Images(data);
          return jsonResponse({ data }, 201);
        }
        const { data, error } = await supabase.from(table).insert(body).select().single();
        if (error) return errorResponse(error.message, 400);
        if (shouldResolveImages) await resolveS3Images(data);
        return jsonResponse({ data }, 201);
      }

      case "PATCH":
      case "PUT": {
        if (!id) return errorResponse("ID required for update", 400);
        const body = await req.json();
        const { data, error } = await supabase.from(table).update(body).eq("id", id).select().single();
        if (error) return errorResponse(error.message, 400);
        if (shouldResolveImages) await resolveS3Images(data);
        return jsonResponse({ data });
      }

      case "DELETE": {
        if (!id) return errorResponse("ID required for delete", 400);
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) return errorResponse(error.message, 400);
        return jsonResponse({ success: true });
      }

      default:
        return errorResponse(`Method ${method} not allowed`, 405);
    }
  } catch (e) {
    console.error("API error:", e);
    return errorResponse("Internal server error", 500);
  }
});
