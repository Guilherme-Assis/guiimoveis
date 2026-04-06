import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
  jsonLd?: Record<string, any>;
}

const SEOHead = ({ title, description, image, url, type = "website", jsonLd }: SEOHeadProps) => {
  useEffect(() => {
    // Update document title
    document.title = `${title} | KORRETORA`;

    // Helper to set/create meta tags
    const setMeta = (property: string, content: string, isName = false) => {
      const attr = isName ? "name" : "property";
      let el = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, property);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    // Standard meta
    setMeta("description", description, true);

    // Open Graph
    setMeta("og:title", title);
    setMeta("og:description", description);
    setMeta("og:type", type);
    if (url) setMeta("og:url", url);
    if (image) setMeta("og:image", image);

    // Twitter
    setMeta("twitter:card", "summary_large_image", true);
    setMeta("twitter:title", title, true);
    setMeta("twitter:description", description, true);
    if (image) setMeta("twitter:image", image, true);

    // JSON-LD
    let scriptEl = document.querySelector('script[data-seo="jsonld"]') as HTMLScriptElement;
    if (jsonLd) {
      if (!scriptEl) {
        scriptEl = document.createElement("script");
        scriptEl.type = "application/ld+json";
        scriptEl.setAttribute("data-seo", "jsonld");
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(jsonLd);
    }

    return () => {
      // Cleanup JSON-LD on unmount
      if (scriptEl) scriptEl.remove();
    };
  }, [title, description, image, url, type, jsonLd]);

  return null;
};

export default SEOHead;
