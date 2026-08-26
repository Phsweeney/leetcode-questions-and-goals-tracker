import { Badge } from "@/components/ui/Badge";
import { formatShortDate } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { CATEGORY_LABELS, type AchievementDef } from "@/lib/progress/achievements";

const TIER_LABELS: Record<1 | 2 | 3, string> = {
  1: "Bronze",
  2: "Silver",
  3: "Gold",
};

export interface BadgeView {
  def: AchievementDef;
  current: number;
  target: number;
  unlockedAt: string | null;
}

export function BadgeTile({
  view,
  index = 0,
  showProgress = true,
}: {
  view: BadgeView;
  index?: number;
  showProgress?: boolean;
}) {
  const { def, current, target, unlockedAt } = view;
  const unlocked = unlockedAt !== null;
  const percent = Math.min(100, Math.round((current / target) * 100));

  return (
    <div
      style={{ animationDelay: `${Math.min(index * 24, 400)}ms` }}
      className={cn(
        "lt-anim-pop rounded-xl border p-4",
        unlocked
          ? "border-accent/30 bg-accent-soft"
          : "border-border bg-surface-raised opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "min-w-0 text-sm font-medium",
            unlocked ? "text-content" : "text-content-muted",
          )}
        >
          {def.title}
        </p>
        <Badge tone={unlocked ? "accent" : "neutral"}>
          {unlocked ? TIER_LABELS[def.tier] : CATEGORY_LABELS[def.category]}
        </Badge>
      </div>

      <p className="mt-1 text-xs text-content-muted">{def.description}</p>

      {unlocked ? (
        <p className="mt-3 text-xs text-content-subtle">
          Unlocked {formatShortDate(unlockedAt.slice(0, 10))}
        </p>
      ) : showProgress ? (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-content-subtle"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs tabular-nums text-content-subtle">
            {current} / {target}
          </p>
        </div>
      ) : null}
    </div>
  );
}
