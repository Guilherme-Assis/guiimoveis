// KORRETORA Service Worker — cache de chunks JS/CSS, fontes e imagens já baixadas
// Estratégia: cache-first para assets versionados (hash no nome), network-first para HTML.
// NÃO interfere em chamadas Supabase, S3 ou navegação SPA.

const VERSION = "v1";
const STATIC_CACHE = `korretora-static-${VERSION}`;
const IMAGE_CACHE = `korretora-images-${VERSION}`;
const FONT_CACHE = `korretora-fonts-${VERSION}`;

const MAX_IMAGE_ENTRIES = 80;
const MAX_FONT_ENTRIES = 20;

// Detecta se estamos em iframe/preview Lovable (não cachear nada)
const isPreviewHost = self.location.hostname.includes("lovable.app") ||
                      self.location.hostname.includes("lovableproject.com") ||
                      self.location.hostname.includes("id-preview--");

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.endsWith(VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > max) {
    await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (isPreviewHost) return; // nunca cachear em preview

  const url = new URL(req.url);

  // Nunca interceptar:
  // - APIs Supabase, edge functions, S3, OpenStreetMap, Nominatim, Overpass
  if (
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("supabase.com") ||
    url.hostname.includes("amazonaws.com") ||
    url.hostname.includes("openstreetmap.org") ||
    url.hostname.includes("nominatim") ||
    url.hostname.includes("overpass") ||
    url.hostname.includes("tile.") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // Same-origin apenas para HTML/JS/CSS; para imagens e fontes, also cross-origin (R2/CDN)
  const sameOrigin = url.origin === self.location.origin;

  // Imagens — cache-first com limite
  if (req.destination === "image") {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok && (res.type === "basic" || res.type === "cors")) {
            cache.put(req, res.clone());
            trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES);
          }
          return res;
        } catch {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // Fontes
  if (req.destination === "font" || /\.(woff2?|ttf|otf)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) {
            cache.put(req, res.clone());
            trimCache(FONT_CACHE, MAX_FONT_ENTRIES);
          }
          return res;
        } catch {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // JS/CSS com hash no nome (assets versionados do Vite) — cache-first
  if (sameOrigin && /\/assets\/.+\.(js|css|mjs)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // HTML — network-first (sempre buscar versão fresca, fallback ao cache)
  if (sameOrigin && req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/")))
    );
    return;
  }
});
