import { Link } from "react-router-dom";
import { X, GitCompareArrows } from "lucide-react";
import { useCompare } from "@/contexts/CompareContext";
import { Button } from "@/components/ui/button";
import { useS3Image } from "@/hooks/useS3Image";
import { AnimatePresence, motion } from "framer-motion";

const CompareThumb = ({ property, onRemove }: { property: any; onRemove: () => void }) => {
  const img = useS3Image(property.image);
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border"
    >
      <img src={img} alt={property.title} className="h-full w-full object-cover" />
      <button
        onClick={onRemove}
        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </motion.div>
  );
};

const CompareBar = () => {
  const { compareList, removeFromCompare, clearCompare } = useCompare();

  if (compareList.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md shadow-lg"
    >
      <div className="container mx-auto flex items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <GitCompareArrows className="h-5 w-5 text-primary" />
          <span className="hidden font-body text-sm text-muted-foreground sm:inline">
            {compareList.length}/3 selecionados
          </span>
          <AnimatePresence>
            {compareList.map((p) => (
              <CompareThumb key={p.id} property={p} onRemove={() => removeFromCompare(p.id)} />
            ))}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearCompare} className="text-xs text-muted-foreground">
            Limpar
          </Button>
          {compareList.length >= 2 && (
            <Link to="/comparar">
              <Button size="sm" className="gap-1.5 bg-gradient-to-r from-primary to-primary/80 text-xs font-semibold">
                <GitCompareArrows className="h-3.5 w-3.5" /> Comparar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CompareBar;
