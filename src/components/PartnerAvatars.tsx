import { useRef, useState, useEffect } from "react";
import { usePropertyPartners, PartnerAvatar } from "@/hooks/usePropertyPartners";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users } from "lucide-react";

const AVATAR_SIZE = 28; // h-7 = 28px
const OVERLAP = 8;
const ICON_WIDTH = 22; // Users icon + gap
const OVERFLOW_WIDTH = AVATAR_SIZE; // +N bubble

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const AvatarCircle = ({ partner, index, total }: { partner: PartnerAvatar; index: number; total: number }) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-card bg-primary/20 text-[10px] font-semibold text-primary ring-1 ring-primary/30 transition-transform hover:scale-110 hover:z-10"
          style={{ marginLeft: index > 0 ? `-${OVERLAP}px` : "0", zIndex: total - index }}
        >
          {partner.avatarUrl ? (
            <img
              src={partner.avatarUrl}
              alt={partner.displayName}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            getInitials(partner.displayName)
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {partner.displayName}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface PartnerAvatarsProps {
  propertyId: string;
  openForPartnership: boolean;
}

const PartnerAvatars = ({ propertyId, openForPartnership }: PartnerAvatarsProps) => {
  const { data: partners } = usePropertyPartners(propertyId, openForPartnership);
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxVisible, setMaxVisible] = useState(10);

  useEffect(() => {
    if (!containerRef.current || !partners?.length) return;

    let rafId = 0;
    const measure = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const containerWidth = containerRef.current?.offsetWidth ?? 0;
        const availableForAvatars = containerWidth - ICON_WIDTH;

        if (partners.length <= 1) {
          setMaxVisible(partners.length);
          return;
        }

        const calcFit = (reserveOverflow: boolean) => {
          const reserved = reserveOverflow ? OVERFLOW_WIDTH - OVERLAP : 0;
          const usable = availableForAvatars - AVATAR_SIZE - reserved;
          return 1 + Math.max(0, Math.floor(usable / (AVATAR_SIZE - OVERLAP)));
        };

        const fitAll = calcFit(false);
        if (fitAll >= partners.length) {
          setMaxVisible(partners.length);
        } else {
          setMaxVisible(Math.max(1, calcFit(true)));
        }
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [partners]);

  if (!partners?.length) return null;

  const visible = partners.slice(0, maxVisible);
  const overflow = partners.length - maxVisible;

  return (
    <div ref={containerRef} className="flex w-full items-center gap-1.5 overflow-hidden">
      <Users className="h-3.5 w-3.5 shrink-0 text-primary/60" />
      <div className="flex items-center">
        {visible.map((p, i) => (
          <AvatarCircle key={i} partner={p} index={i} total={visible.length} />
        ))}
        {overflow > 0 && (
          <div
            className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground"
            style={{ marginLeft: `-${OVERLAP}px`, zIndex: 0 }}
          >
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerAvatars;
