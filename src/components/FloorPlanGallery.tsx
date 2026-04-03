import { useState } from "react";
import { Layers, ZoomIn, X } from "lucide-react";
import { useS3Images } from "@/hooks/useS3Image";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface FloorPlanGalleryProps {
  floorPlans: string[];
  title: string;
}

const FloorPlanGallery = ({ floorPlans, title }: FloorPlanGalleryProps) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const resolvedImages = useS3Images(floorPlans);

  if (!floorPlans || floorPlans.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-semibold text-foreground">
        <Layers className="h-5 w-5 text-primary" /> Plantas do Imóvel
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {resolvedImages.map((src, i) => (
          <button
            key={i}
            onClick={() => setSelectedIdx(i)}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border/30 transition-all hover:border-primary/40 hover:shadow-md"
          >
            <img src={src} alt={`Planta ${i + 1} - ${title}`} className="h-full w-full object-contain bg-secondary/30 p-2" />
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn className="h-6 w-6 text-primary" />
            </div>
            <span className="absolute bottom-2 right-2 rounded bg-background/80 px-2 py-0.5 font-body text-[10px] text-muted-foreground">
              Planta {i + 1}
            </span>
          </button>
        ))}
      </div>

      <Dialog open={selectedIdx !== null} onOpenChange={() => setSelectedIdx(null)}>
        <DialogContent className="max-w-4xl border-border/50 bg-card p-2">
          {selectedIdx !== null && (
            <img
              src={resolvedImages[selectedIdx]}
              alt={`Planta ${selectedIdx + 1} - ${title}`}
              className="h-auto max-h-[80vh] w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FloorPlanGallery;
