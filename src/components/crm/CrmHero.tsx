import { LucideIcon, Sparkles } from "lucide-react";
import { ReactNode } from "react";

interface CrmHeroProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  accent?: "gold" | "sky" | "emerald" | "violet" | "amber" | "destructive";
}

const accentMap: Record<NonNullable<CrmHeroProps["accent"]>, string> = {
  gold: "from-primary/30 via-primary/10 to-transparent",
  sky: "from-sky-500/30 via-sky-500/10 to-transparent",
  emerald: "from-emerald-500/30 via-emerald-500/10 to-transparent",
  violet: "from-violet-500/30 via-violet-500/10 to-transparent",
  amber: "from-amber-500/30 via-amber-500/10 to-transparent",
  destructive: "from-destructive/30 via-destructive/10 to-transparent",
};

const iconAccentMap: Record<NonNullable<CrmHeroProps["accent"]>, string> = {
  gold: "from-primary/30 to-primary/5 text-primary",
  sky: "from-sky-500/30 to-sky-500/5 text-sky-300",
  emerald: "from-emerald-500/30 to-emerald-500/5 text-emerald-300",
  violet: "from-violet-500/30 to-violet-500/5 text-violet-300",
  amber: "from-amber-500/30 to-amber-500/5 text-amber-300",
  destructive: "from-destructive/30 to-destructive/5 text-destructive",
};

const CrmHero = ({ icon: Icon, title, subtitle, actions, accent = "gold" }: CrmHeroProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-charcoal-deep">
      {/* decorative gradient orb */}
      <div className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br ${accentMap[accent]} blur-3xl`} />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-2xl" />
      {/* sparkle */}
      <Sparkles className="pointer-events-none absolute right-6 top-6 h-4 w-4 text-primary/40" />

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${iconAccentMap[accent]} border border-border/40 shadow-[var(--shadow-gold)]`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 font-body text-xs sm:text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
};

export default CrmHero;
