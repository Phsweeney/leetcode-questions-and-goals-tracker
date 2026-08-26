import { formatShortDate, fromIsoDate } from "@/lib/dates";
import { cn } from "@/lib/cn";
import type { WeekBucket } from "@/lib/repos/progress";

const TRACK_HEIGHT = 140;

function monthLabel(date: string): string {
  return fromIsoDate(date).toLocaleDateString("en-US", { month: "short" });
}

// Fixed order, bottom to top. Position is deliberately doing work here: the
// light-mode Medium and Hard tokens sit close enough in normal vision that hue
// alone is not a safe encoding, so the stack order never varies, every segment
// is separated by a surface gap, and the legend is always on.
const SERIES = [
  { key: "easy", label: "Easy", fill: "bg-easy" },
  { key: "medium", label: "Medium", fill: "bg-medium" },
  { key: "hard", label: "Hard", fill: "bg-hard" },
  { key: "unset", label: "Unset", fill: "bg-border-strong" },
] as const;

export function MomentumChart({ weeks }: { weeks: WeekBucket[] }) {
  const max = Math.max(1, ...weeks.map((week) => week.total));
  const total = weeks.reduce((sum, week) => sum + week.total, 0);

  return (
    <section className="lt-anim-rise rounded-xl border border-border bg-surface-raised p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-content">Momentum</h2>
        <p className="text-xs text-content-subtle">
          <span className="tabular-nums text-content-muted">{total}</span> completed over
          26 weeks
        </p>
      </div>

      <div className="mt-5">
        <div className="relative" style={{ height: TRACK_HEIGHT }}>
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-border" />
          <span className="absolute -top-2 right-0 bg-surface-raised pl-1 text-[10px] tabular-nums text-content-subtle">
            {max}
          </span>

          <div
            className="flex h-full items-end gap-1"
            role="img"
            aria-label={`Problems completed each week for the last 26 weeks, peaking at ${max} in a week.`}
          >
            {weeks.map((week) => {
              const segments = SERIES.map((series) => ({
                ...series,
                count: week[series.key],
              })).filter((segment) => segment.count > 0);

              return (
                <div
                  key={week.weekStart}
                  className="flex h-full flex-1 flex-col justify-end"
                  title={
                    week.total === 0
                      ? `Week of ${formatShortDate(week.weekStart)} — nothing completed`
                      : `Week of ${formatShortDate(week.weekStart)} — ${week.total} completed (${segments
                          .map((segment) => `${segment.count} ${segment.label}`)
                          .join(", ")})`
                  }
                >
                  {[...segments].reverse().map((segment, index) => (
                    <div
                      key={segment.key}
                      className={cn(
                        "lt-anim-fade w-full",
                        segment.fill,
                        index === 0 && "rounded-t-[3px]",
                        index === segments.length - 1 && "rounded-b-[2px]",
                        // A surface gap so two adjacent fills never touch.
                        index < segments.length - 1 && "mb-[2px]",
                      )}
                      style={{
                        height: `${(segment.count / max) * 100}%`,
                        minHeight: 3,
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-2 flex gap-1 text-[10px] text-content-subtle">
          {weeks.map((week, index) => (
            <span key={week.weekStart} className="flex-1 text-center whitespace-nowrap">
              {index > 0 && monthLabel(week.weekStart) !== monthLabel(weeks[index - 1].weekStart)
                ? monthLabel(week.weekStart)
                : ""}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-content-muted">
        {SERIES.map((series) => (
          <span key={series.key} className="inline-flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-[2px]", series.fill)} />
            {series.label}
          </span>
        ))}
      </div>
    </section>
  );
}
