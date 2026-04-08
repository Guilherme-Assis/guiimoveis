import { usePropertyPartners, PartnerAvatar } from "@/hooks/usePropertyPartners";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users } from "lucide-react";

const MAX_VISIBLE = 3;

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const AvatarCircle = ({ partner, index }: { partner: PartnerAvatar; index: number }) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-primary/20 text-[10px] font-semibold text-primary ring-1 ring-primary/30 transition-transform hover:scale-110 hover:z-10"
          style={{ marginLeft: index > 0 ? "-8px" : "0", zIndex: MAX_VISIBLE - index }}
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

  if (!partners?.length) return null;

  const visible = partners.slice(0, MAX_VISIBLE);
  const overflow = partners.length - MAX_VISIBLE;

  return (
    <div className="flex items-center gap-1.5">
      <Users className="h-3.5 w-3.5 text-primary/60" />
      <div className="flex items-center">
        {visible.map((p, i) => (
          <AvatarCircle key={i} partner={p} index={i} />
        ))}
        {overflow > 0 && (
          <div
            className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground"
            style={{ marginLeft: "-8px", zIndex: 0 }}
          >
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerAvatars;
