import { useState, useEffect } from "react";
import { Star, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  display_name?: string;
}

interface BrokerReviewsProps {
  brokerId: string;
}

const StarRating = ({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`h-4 w-4 transition-colors ${
          i <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"
        } ${interactive ? "cursor-pointer hover:text-primary" : ""}`}
        onClick={() => interactive && onRate?.(i)}
      />
    ))}
  </div>
);

const BrokerReviews = ({ brokerId }: BrokerReviewsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async () => {
    const { data } = await supabase
      .from("broker_reviews")
      .select("id, broker_id, user_id, rating, comment, created_at")
      .eq("broker_id", brokerId)
      .order("created_at", { ascending: false });
    
    if (data) {
      // Fetch display names for reviewers
      const enriched = await Promise.all(
        data.map(async (r) => {
          const { data: profileData } = await supabase.rpc("get_public_profile", { _user_id: r.user_id });
          return { ...r, display_name: profileData?.[0]?.display_name || "Usuário" };
        })
      );
      setReviews(enriched);
    }
    setLoading(false);
  };

  useEffect(() => { loadReviews(); }, [brokerId]);

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Faça login para avaliar", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("broker_reviews").insert({
      broker_id: brokerId,
      user_id: user.id,
      rating: newRating,
      comment: newComment.trim() || null,
    });
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Você já avaliou este corretor", variant: "destructive" });
      } else {
        toast({ title: "Erro ao enviar avaliação", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Avaliação enviada!" });
      setNewComment("");
      setNewRating(5);
      loadReviews();
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="border border-border bg-card p-6">
      <h3 className="mb-4 font-display text-xl font-semibold text-foreground">
        Avaliações {reviews.length > 0 && <span className="text-sm text-muted-foreground">({reviews.length})</span>}
      </h3>

      {reviews.length > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <span className="font-display text-3xl font-bold text-primary">{avgRating.toFixed(1)}</span>
          <StarRating rating={Math.round(avgRating)} />
        </div>
      )}

      {/* Review form */}
      {user && (
        <div className="mb-6 space-y-3 border-b border-border pb-6">
          <p className="font-body text-sm font-medium text-foreground">Deixe sua avaliação</p>
          <StarRating rating={newRating} onRate={setNewRating} interactive />
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Comentário (opcional)"
            rows={3}
            className="border-border bg-secondary text-sm"
            maxLength={500}
          />
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gradient-gold font-body text-xs font-semibold uppercase tracking-wider text-primary-foreground"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Enviar Avaliação
          </Button>
        </div>
      )}

      {loading ? (
        <p className="font-body text-sm text-muted-foreground">Carregando avaliações...</p>
      ) : reviews.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground">Ainda não há avaliações.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-border/50 pb-4 last:border-0">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-body text-sm font-medium text-foreground">{r.display_name}</span>
                <span className="font-body text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <StarRating rating={r.rating} />
              {r.comment && <p className="mt-2 font-body text-sm text-muted-foreground">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrokerReviews;
