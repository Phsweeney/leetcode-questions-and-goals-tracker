import { BadgeTile, type BadgeView } from "./BadgeTile";
import { ACHIEVEMENTS } from "@/lib/progress/achievements";
import type { AchievementSnapshot } from "@/lib/progress/snapshot";

export function buildBadgeViews(
  snapshot: AchievementSnapshot,
  unlockedAt: Map<string, string>,
): BadgeView[] {
  return ACHIEVEMENTS.map((def) => ({
    def,
    ...def.progress(snapshot),
    unlockedAt: unlockedAt.get(def.key) ?? null,
  }));
}

function ratio(view: BadgeView): number {
  return view.current / view.target;
}

export function BadgeGrid({ views }: { views: BadgeView[] }) {
  const unlocked = views
    .filter((view) => view.unlockedAt !== null)
    .sort((a, b) => (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? ""));

  // Closest-first, so the first locked tile is always the one worth chasing.
  const locked = views
    .filter((view) => view.unlockedAt === null)
    .sort((a, b) => ratio(b) - ratio(a));

  const nextUp = locked.filter((view) => view.current > 0).slice(0, 3);

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-content">Badges</h2>
        <p className="text-xs tabular-nums text-content-subtle">
          {unlocked.length} of {views.length} unlocked
        </p>
      </div>

      {nextUp.length > 0 ? (
        <div className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm font-medium text-content">Closest to unlocking</p>
          <div className="mt-3 space-y-3">
            {nextUp.map((view) => {
              const remaining = view.target - view.current;
              const percent = Math.min(
                100,
                Math.round((view.current / view.target) * 100),
              );

              return (
                <div key={view.def.key}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-content">{view.def.title}</span>
                    <span className="shrink-0 text-xs tabular-nums text-content-muted">
                      {remaining} to go
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                    <div
                      className="lt-anim-grow h-full rounded-full bg-accent"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...unlocked, ...locked].map((view, index) => (
          <BadgeTile key={view.def.key} view={view} index={index} />
        ))}
      </div>
    </section>
  );
}
