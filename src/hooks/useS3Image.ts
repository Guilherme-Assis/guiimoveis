import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const S3_PREFIX = "https://s3.sa-east-1.amazonaws.com/gui-imoveis/";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const cache = new Map<string, { url: string; expiry: number }>();
const pendingBatch = new Set<string>();
let batchTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Map<string, Set<() => void>>();

function isS3Url(url: string): boolean {
  return url.startsWith(S3_PREFIX);
}

function getCached(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiry < Date.now()) { cache.delete(key); return null; }
  return entry.url;
}

function notifyListeners(key: string) {
  listeners.get(key)?.forEach((cb) => cb());
}

async function flushBatch() {
  batchTimer = null;
  const keys = Array.from(pendingBatch);
  pendingBatch.clear();
  if (keys.length === 0) return;

  try {
    const { data, error } = await supabase.functions.invoke("s3-read", { body: { keys } });
    if (error) {
      keys.forEach((k) => { cache.set(k, { url: k, expiry: Date.now() + CACHE_TTL }); notifyListeners(k); });
      return;
    }
    const urls = data?.urls as Record<string, string> | undefined;
    keys.forEach((k) => {
      const resolved = urls?.[k] || k;
      cache.set(k, { url: resolved, expiry: Date.now() + CACHE_TTL });
      notifyListeners(k);
    });
  } catch {
    keys.forEach((k) => { cache.set(k, { url: k, expiry: Date.now() + CACHE_TTL }); notifyListeners(k); });
  }
}

function requestSignedUrl(key: string, cb: () => void) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(cb);

  if (!getCached(key) && !pendingBatch.has(key)) {
    pendingBatch.add(key);
    if (batchTimer) clearTimeout(batchTimer);
    batchTimer = setTimeout(flushBatch, 50);
  }

  return () => { listeners.get(key)?.delete(cb); };
}

export function useS3Image(url: string | null | undefined): string {
  const [resolved, setResolved] = useState<string>(() => {
    if (!url) return "/placeholder.svg";
    if (!isS3Url(url)) return url;
    return getCached(url) || "/placeholder.svg";
  });

  useEffect(() => {
    if (!url) { setResolved("/placeholder.svg"); return; }
    if (!isS3Url(url)) { setResolved(url); return; }
    const cached = getCached(url);
    if (cached) { setResolved(cached); return; }
    const unsub = requestSignedUrl(url, () => { setResolved(getCached(url) || url); });
    return unsub;
  }, [url]);

  return resolved;
}

export function useS3Images(urls: (string | null | undefined)[]): string[] {
  const resolve = () => urls.map((u) => {
    if (!u) return "/placeholder.svg";
    if (!isS3Url(u)) return u;
    return getCached(u) || "/placeholder.svg";
  });

  const [resolved, setResolved] = useState<string[]>(resolve);

  useEffect(() => {
    const s3Urls = urls.filter((u): u is string => !!u && isS3Url(u) && !getCached(u));
    if (s3Urls.length === 0) { setResolved(resolve()); return; }
    const unsubs = s3Urls.map((url) => requestSignedUrl(url, () => { setResolved(resolve()); }));
    return () => unsubs.forEach((fn) => fn());
  }, [JSON.stringify(urls)]);

  return resolved;
}
