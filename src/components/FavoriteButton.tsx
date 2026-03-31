import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface FavoriteButtonProps {
  propertyId: string;
  className?: string;
  size?: "sm" | "md";
}

const FavoriteButton = ({ propertyId, className = "", size = "sm" }: FavoriteButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("property_id", propertyId)
      .maybeSingle()
      .then(({ data }) => setIsFavorite(!!data));
  }, [user, propertyId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Faça login", description: "Para salvar favoritos, faça login primeiro.", variant: "destructive" });
      return;
    }
    setLoading(true);
    if (isFavorite) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", propertyId);
      setIsFavorite(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, property_id: propertyId });
      setIsFavorite(true);
      toast({ title: "Salvo nos favoritos!" });
    }
    setLoading(false);
  };

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`transition-all duration-300 ${className}`}
      title={isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
    >
      <Heart
        className={`${iconSize} transition-all ${isFavorite ? "fill-red-500 text-red-500" : "text-foreground/70 hover:text-red-400"}`}
      />
    </button>
  );
};

export default FavoriteButton;
