import { Camera } from "lucide-react";

interface VirtualTourViewerProps {
  url: string;
  title?: string;
}

const VirtualTourViewer = ({ url, title }: VirtualTourViewerProps) => {
  return (
    <div className="border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Camera className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold text-foreground">
          Tour Virtual 360°
        </h3>
      </div>
      <div className="relative aspect-video w-full">
        <iframe
          src={url}
          title={title || "Tour Virtual 360°"}
          className="h-full w-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
        />
      </div>
    </div>
  );
};

export default VirtualTourViewer;
