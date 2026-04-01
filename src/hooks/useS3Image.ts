import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const S3_PREFIX = "https://s3.sa-east-1.amazonaws.com/gui-imoveis/";
const cache = new Map<string, string>();
const pendingBatch = new Set<string>();
let batchTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Map<string, Set<() => void>>();

function isS3Url(url: string): boolean {
  return url.startsWith(S3_PREFIX);
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
    const { data, error } = await supabase.functions.invoke("s3-read", {
      body: { keys },
    });

    if (error) {
      console.error("s3-read error:", error);
      // Fallback: use original URLs
      keys.forEach((k) => { cache.set(k, k); notifyListeners(k); });
      return;
    }

    const urls = data?.urls as Record<string, string> | undefined;
    keys.forEach((k) => {
      const resolved = urls?.[k] || k;
      cache.set(k, resolved);
      notifyListeners(k);
    });
  } catch (err) {
    console.error("s3-read fetch error:", err);
    keys.forEach((k) => { cache.set(k, k); notifyListeners(k); });
  }
}

function requestSignedUrl(key: string, cb: () => void) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(cb);

  if (!cache.has(key) && !pendingBatch.has(key)) {
    pendingBatch.add(key);
    if (batchTimer) clearTimeout(batchTimer);
    batchTimer = setTimeout(flushBatch, 50); // batch within 50ms
  }

  return () => {
    listeners.get(key)?.delete(cb);
  };
}

/**
 * Resolves an S3 URL to a signed URL. Non-S3 URLs are returned as-is.
 */
export function useS3Image(url: string | null | undefined): string {
  const [resolved, setResolved] = useState<string>(() => {
    if (!url) return "/placeholder.svg";
    if (!isS3Url(url)) return url;
    return cache.get(url) || "/placeholder.svg";
  });

  useEffect(() => {
    if (!url) { setResolved("/placeholder.svg"); return; }
    if (!isS3Url(url)) { setResolved(url); return; }

    // Already cached
    if (cache.has(url)) {
      setResolved(cache.get(url)!);
      return;
    }

    const unsub = requestSignedUrl(url, () => {
      setResolved(cache.get(url) || url);
    });

    return unsub;
  }, [url]);

  return resolved;
}

/**
 * Resolves multiple S3 URLs at once.
 */
export function useS3Images(urls: (string | null | undefined)[]): string[] {
  const [resolved, setResolved] = useState<string[]>(() =>
    urls.map((u) => {
      if (!u) return "/placeholder.svg";
      if (!isS3Url(u)) return u;
      return cache.get(u) || "/placeholder.svg";
    })
  );

  useEffect(() => {
    const s3Urls = urls.filter((u): u is string => !!u && isS3Url(u) && !cache.has(u));

    if (s3Urls.length === 0) {
      setResolved(urls.map((u) => {
        if (!u) return "/placeholder.svg";
        if (!isS3Url(u)) return u;
        return cache.get(u) || u;
      }));
      return;
    }

    const unsubs = s3Urls.map((url) =>
      requestSignedUrl(url, () => {
        setResolved(urls.map((u) => {
          if (!u) return "/placeholder.svg";
          if (!isS3Url(u)) return u;
          return cache.get(u) || u;
        }));
      })
    );

    return () => unsubs.forEach((fn) => fn());
  }, [JSON.stringify(urls)]);

  return resolved;
}
