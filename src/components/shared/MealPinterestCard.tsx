import { Clock, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MealPinterestCardProps {
  imageUrl?: string | null;
  title: string;
  subtitle?: string;
  badgeText?: string;
  itemCount?: number;
  time?: string | null;
  hasFeedback?: boolean;
  onClick: () => void;
}

const MEAL_GRADIENTS: Record<string, string> = {
  "café": "from-amber-400/80 to-orange-500/80",
  "lanche da manhã": "from-orange-300/80 to-yellow-400/80",
  "almoço": "from-emerald-400/80 to-teal-500/80",
  "lanche da tarde": "from-sky-400/80 to-blue-500/80",
  "lanche": "from-sky-400/80 to-blue-500/80",
  "jantar": "from-indigo-400/80 to-violet-500/80",
  "ceia": "from-purple-400/80 to-fuchsia-500/80",
};

function getMealGradient(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(MEAL_GRADIENTS)) {
    if (lower.includes(key)) return val;
  }
  return "from-slate-400/80 to-slate-500/80";
}

export default function MealPinterestCard({
  imageUrl,
  title,
  subtitle,
  badgeText,
  itemCount,
  time,
  hasFeedback,
  onClick,
}: MealPinterestCardProps) {
  const gradient = getMealGradient(title);

  return (
    <button
      onClick={onClick}
      className="group relative w-full rounded-2xl border border-border/60 bg-card text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-surface-hover-border hover:bg-surface-hover"
      style={{ isolation: "isolate" }}
    >
      {/* Image / Gradient placeholder */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${gradient}`} />
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Top badges row */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          {/* Feedback indicator */}
          {hasFeedback ? (
            <Badge className="bg-primary/90 text-primary-foreground border-none backdrop-blur-sm text-[10px] gap-1">
              <MessageSquare className="h-2.5 w-2.5" />
              Feedback
            </Badge>
          ) : <span />}
          {/* Time badge */}
          {time && (
            <Badge className="bg-black/40 text-white border-none backdrop-blur-sm text-[10px] gap-1">
              <Clock className="h-2.5 w-2.5" />
              {time}
            </Badge>
          )}
        </div>

        {/* Title overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-bold leading-tight text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 line-clamp-1 text-[11px] text-white/80">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between px-3 py-2.5">
        {badgeText && (
          <Badge variant="secondary" className="text-[10px] font-medium">
            {badgeText}
          </Badge>
        )}
        {itemCount !== undefined && (
          <span className="text-[11px] text-muted-foreground">
            {itemCount} {itemCount === 1 ? "item" : "itens"}
          </span>
        )}
      </div>
    </button>
  );
}
