import { addDays, formatLongDate, fromIsoDate } from "@/lib/dates";
import { intensityFill } from "@/lib/progress/intensity";
import { cn } from "@/lib/cn";
import type { DayActivity } from "@/lib/types";

const WEEKS = 53;
const CELL = 12;
const GAP = 3;
// Mon/Wed/Fri only: labelling all seven rows crowds a 12px cell.
const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

function monthLabel(date: string): string {
  return fromIsoDate(date).toLocaleDateString("en-US", { month: "short" });
}

export function YearHeatmap({
  activity,
  start,
  today,
}: {
  activity: DayActivity[];
  start: string;
  today: string;
}) {
  const byDate = new Map(activity.map((day) => [day.date, day]));

  // Column-major order: `grid-flow-col` with 7 rows fills each week downward
  // before moving right, so a plain day-by-day sequence lands correctly.
  const days = Array.from({ length: WEEKS * 7 }, (_, index) => addDays(start, index));

  const columns = Array.from({ length: WEEKS }, (_, week) => days[week * 7]);
  const monthMarks = columns.map((first, index) => {
    if (index === 0) {
      return "";
    }
    return monthLabel(first) === monthLabel(columns[index - 1]) ? "" : monthLabel(first);
  });

  const totalLogged = activity.reduce(
    (sum, day) => sum + day.completions + day.repeats,
    0,
  );
  const activeDays = activity.length;
  const trackStyle = {
    gridTemplateColumns: `repeat(${WEEKS}, ${CELL}px)`,
    gap: `${GAP}px`,
  };

  return (
    <section className="lt-anim-rise rounded-xl border border-border bg-surface-raised p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-content">The last year</h2>
        <p className="text-xs text-content-subtle">
          <span className="tabular-nums text-content-muted">{totalLogged}</span> logged
          across <span className="tabular-nums text-content-muted">{activeDays}</span>{" "}
          active {activeDays === 1 ? "day" : "days"}
        </p>
      </div>

      {/* The app shell hides horizontal overflow, so this container has to own
          the scroll or a narrow window would clip the grid instead. */}
      <div className="mt-4 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-1.5">
          <div
            className="grid shrink-0 grid-rows-7 pt-[15px] text-[10px] leading-3 text-content-subtle"
            style={{ gap: `${GAP}px` }}
            aria-hidden="true"
          >
            {WEEKDAY_LABELS.map((label, index) => (
              <span key={index} style={{ height: CELL }}>
                {label}
              </span>
            ))}
          </div>

          <div>
            <div
              className="grid text-[10px] leading-3 text-content-subtle"
              style={trackStyle}
              aria-hidden="true"
            >
              {monthMarks.map((label, index) => (
                <span key={index} className="whitespace-nowrap">
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-1 grid grid-flow-col grid-rows-7" style={{ gap: `${GAP}px` }}>
              {days.map((date) => {
                if (date > today) {
                  // Keeps the final column aligned without drawing a future day.
                  return <span key={date} style={{ width: CELL, height: CELL }} />;
                }

                const day = byDate.get(date);
                const completions = day?.completions ?? 0;
                const repeats = day?.repeats ?? 0;
                const total = completions + repeats;

                return (
                  <span
                    key={date}
                    style={{ width: CELL, height: CELL }}
                    title={`${formatLongDate(date)} — ${
                      total === 0
                        ? "nothing logged"
                        : `${completions} completed, ${repeats} repeated`
                    }`}
                    className={cn(
                      "rounded-[3px]",
                      intensityFill(total),
                      date === today && "ring-1 ring-border-strong ring-inset",
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 text-xs text-content-subtle">
        <span>Less</span>
        <span className="h-3 w-3 rounded-[3px] bg-surface-sunken" />
        <span className="h-3 w-3 rounded-[3px] bg-accent/25" />
        <span className="h-3 w-3 rounded-[3px] bg-accent/50" />
        <span className="h-3 w-3 rounded-[3px] bg-accent" />
        <span>More</span>
      </div>
    </section>
  );
}
