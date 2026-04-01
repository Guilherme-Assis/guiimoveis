import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useS3Images } from "@/hooks/useS3Image";
import { cn } from "@/lib/utils";

interface PropertyImageGalleryProps {
  mainImage: string | null;
  images: string[] | null;
  title: string;
}

const PropertyImageGallery = ({ mainImage, images, title }: PropertyImageGalleryProps) => {
  const allRawUrls = [
    ...(mainImage ? [mainImage] : []),
    ...(images || []).filter((img) => img !== mainImage),
  ].filter(Boolean);

  const resolvedUrls = useS3Images(allRawUrls);
  const [current, setCurrent] = useState(0);

  // No images at all
  if (allRawUrls.length === 0) {
    return (
      <div className="relative h-[60vh] w-full overflow-hidden bg-secondary flex items-center justify-center">
        <img src="/placeholder.svg" alt={title} className="h-32 w-32 opacity-30" />
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c === 0 ? resolvedUrls.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === resolvedUrls.length - 1 ? 0 : c + 1));

  return (
    <div className="relative">
      <div className="relative h-[60vh] w-full overflow-hidden">
        <img
          src={resolvedUrls[current]}
          alt={`${title} - Foto ${current + 1}`}
          className="h-full w-full object-cover transition-opacity duration-300"
          loading="lazy"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        {resolvedUrls.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/60 backdrop-blur-sm text-foreground transition-colors hover:bg-background/80"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/60 backdrop-blur-sm text-foreground transition-colors hover:bg-background/80"
              aria-label="Próxima foto"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-20 right-6 rounded-full bg-background/60 px-3 py-1 backdrop-blur-sm">
              <span className="font-body text-xs text-foreground">
                {current + 1} / {resolvedUrls.length}
              </span>
            </div>
          </>
        )}
      </div>

      {resolvedUrls.length > 1 && (
        <div className="container mx-auto px-6">
          <div className="flex gap-2 overflow-x-auto py-4 scrollbar-thin">
            {resolvedUrls.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={cn(
                  "flex-shrink-0 h-16 w-24 overflow-hidden border-2 transition-all",
                  idx === current
                    ? "border-primary opacity-100"
                    : "border-transparent opacity-60 hover:opacity-90"
                )}
              >
                <img
                  src={url}
                  alt={`${title} - Miniatura ${idx + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyImageGallery;
