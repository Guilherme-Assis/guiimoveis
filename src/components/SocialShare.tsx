import { Share2, MessageCircle, Facebook, Link as LinkIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface SocialShareProps {
  title: string;
  price: string;
  url?: string;
  location?: string;
}

const SocialShare = ({ title, price, url, location }: SocialShareProps) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || window.location.href;
  const text = `🏠 ${title}\n💰 ${price}${location ? `\n📍 ${location}` : ""}\n\nConfira: ${shareUrl}`;

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank", "width=600,height=400");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: "Link copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-border/40 text-muted-foreground hover:text-foreground">
          <Share2 className="h-4 w-4" /> Compartilhar
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 border-border/50 bg-card" align="end">
        <div className="space-y-1">
          <button
            onClick={shareWhatsApp}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-green-500/10 hover:text-green-400"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </button>
          <button
            onClick={shareFacebook}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-blue-500/10 hover:text-blue-400"
          >
            <Facebook className="h-4 w-4" /> Facebook
          </button>
          <button
            onClick={copyLink}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-primary/10 hover:text-primary"
          >
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <LinkIcon className="h-4 w-4" />}
            {copied ? "Copiado!" : "Copiar Link"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SocialShare;
