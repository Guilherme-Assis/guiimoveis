import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status: number) {
  return jsonResponse({ error: message }, status);
}

// Parse URL path: /api/{resource}/{id?}
function parsePath(url: URL): { resource: string; id: string | null; action: string | null } {
  const parts = url.pathname.replace(/^\/api\//, "").split("/").filter(Boolean);
  const resource = parts[0] || "";
  // Check if second part is an action or an id
  const second = parts[1] || null;
  const actions = ["search", "stats", "by-slug", "counts", "login", "refresh", "me"];
  if (second && actions.includes(second)) {
    return { resource, id: null, action: second };
  }
  return { resource, id: second, action: parts[2] || null };
}

// Table mapping
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
};

// Public resources (no auth needed for GET)
const PUBLIC_READ = new Set(["properties", "blog-posts"]);

// Allowed query params for filtering
function applyFilters(query: any, params: URLSearchParams, resource: string) {
  // Generic filters
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

  // Defaults for properties
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
          user: {
            id: data.user.id,
            email: data.user.email,
          },
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

    return errorResponse("Unknown auth action. Available: POST /auth/login, POST /auth/refresh, GET /auth/me", 404);
  }

  // Validate resource
  const table = RESOURCE_TABLE[resource];
  if (!table) {
    // Return API docs summary at root
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

  // For authenticated requests, pass through the user's JWT for RLS
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });

  // For non-public resources, verify auth
  if (!isPublicRead) {
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse("Authorization header required. Use: Bearer <jwt_token>", 401);
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return errorResponse("Invalid or expired token", 401);
    }
  }

  try {
    // === SPECIAL ACTIONS ===
    if (resource === "properties" && action === "by-slug") {
      const slug = params.get("slug");
      if (!slug) return errorResponse("slug query param required", 400);
      const { data, error } = await supabase.rpc("get_property_by_slug", { _slug: slug });
      if (error) return errorResponse(error.message, 400);
      return jsonResponse({ data: data?.[0] || null });
    }

    if (resource === "properties" && action === "search") {
      const body = method === "POST" ? await req.json() : {};
      let query = supabase.from(table).select("*").eq("availability", "available");
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
        return jsonResponse({ data, count, limit, offset });
      }

      case "POST": {
        const body = await req.json();
        if (Array.isArray(body)) {
          const { data, error } = await supabase.from(table).insert(body).select();
          if (error) return errorResponse(error.message, 400);
          return jsonResponse({ data }, 201);
        }
        const { data, error } = await supabase.from(table).insert(body).select().single();
        if (error) return errorResponse(error.message, 400);
        return jsonResponse({ data }, 201);
      }

      case "PATCH":
      case "PUT": {
        if (!id) return errorResponse("ID required for update", 400);
        const body = await req.json();
        const { data, error } = await supabase.from(table).update(body).eq("id", id).select().single();
        if (error) return errorResponse(error.message, 400);
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
    return errorResponse(e instanceof Error ? e.message : "Internal server error", 500);
  }
});
