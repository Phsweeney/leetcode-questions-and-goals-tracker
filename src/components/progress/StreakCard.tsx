import { addDays, formatShortDate } from "@/lib/dates";
import { intensityFill } from "@/lib/progress/intensity";
import { cn } from "@/lib/cn";
import type { DayActivity } from "@/lib/types";

const MILESTONES = [3, 7, 14, 30, 60, 100, 365];
const STRIP_DAYS = 30;

function nextMilestone(streak: number): number | null {
  return MILESTONES.find((milestone) => milestone > streak) ?? null;
}

export function StreakCard({
  currentStreak,
  longestStreak,
  activity,
  today,
}: {
  currentStreak: number;
  longestStreak: number;
  activity: DayActivity[];
  today: string;
}) {
  const byDate = new Map(activity.map((day) => [day.date, day]));
  const days = Array.from({ length: STRIP_DAYS }, (_, index) =>
    addDays(today, -(STRIP_DAYS - 1 - index)),
  );
  const target = nextMilestone(currentStreak);

  return (
    <div className="lt-anim-rise rounded-xl border border-border bg-surface-raised p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-content">Streak</h2>
        <p className="text-xs text-content-subtle">Last 30 days</p>
      </div>

      <div className="mt-4 flex items-baseline gap-6">
        <div>
          <p className="text-3xl font-semibold tabular-nums tracking-tight text-content">
            {currentStreak}
          </p>
          <p className="mt-0.5 text-sm text-content-muted">Current</p>
        </div>
        <div>
          <p className="text-3xl font-semibold tabular-nums tracking-tight text-content-muted">
            {longestStreak}
          </p>
          <p className="mt-0.5 text-sm text-content-muted">Longest</p>
        </div>
      </div>

      <div className="mt-4 flex gap-1" aria-hidden="true">
        {days.map((date) => {
          const day = byDate.get(date);
          const total = (day?.completions ?? 0) + (day?.repeats ?? 0);
          return (
            <span
              key={date}
              title={`${formatShortDate(date)}: ${total === 0 ? "nothing logged" : `${total} logged`}`}
              className={cn("h-6 flex-1 rounded-sm", intensityFill(total))}
            />
          );
        })}
      </div>

      <p className="mt-4 text-sm text-content-muted">
        {target === null ? (
          <>Every milestone cleared. Keep it running.</>
        ) : currentStreak === 0 ? (
          <>Log anything today to start a new streak.</>
        ) : (
          <>
            <span className="font-medium tabular-nums text-content">
              {target - currentStreak}
            </span>{" "}
            {target - currentStreak === 1 ? "day" : "days"} to a {target}-day streak.
          </>
        )}
      </p>
    </div>
  );
}
