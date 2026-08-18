import Link from "next/link";
import { addMonths, formatMonthTitle, fromIsoDate, monthGrid, todayLocal } from "@/lib/dates";
import type { DayActivity } from "@/lib/types";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function intensityClass(total: number): string {
  if (total === 0) {
    return "bg-surface-sunken text-content-subtle";
  }
  if (total === 1) {
    return "bg-accent/25 text-content";
  }
  if (total <= 3) {
    return "bg-accent/50 text-content";
  }
  return "bg-accent text-white";
}

export function ActivityCalendar({
  monthAnchor,
  activity,
  basePath,
  selectedDate,
  showNavigation = true,
}: {
  monthAnchor: string;
  activity: DayActivity[];
  basePath: string;
  selectedDate?: string;
  showNavigation?: boolean;
}) {
  const byDate = new Map(activity.map((day) => [day.date, day]));
  const cells = monthGrid(monthAnchor);
  const today = todayLocal();

  function href(params: Record<string, string>): string {
    const search = new URLSearchParams(params);
    return `${basePath}?${search.toString()}`;
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-content">
          {formatMonthTitle(monthAnchor)}
        </h2>
        {showNavigation ? (
          <div className="flex items-center gap-1">
            <Link
              href={href({ month: addMonths(monthAnchor, -1) })}
              className="rounded-lg px-2.5 py-1 text-xs text-content-muted transition-colors hover:bg-surface-sunken hover:text-content"
            >
              Previous
            </Link>
            <Link
              href={href({ month: todayLocal() })}
              className="rounded-lg px-2.5 py-1 text-xs text-content-muted transition-colors hover:bg-surface-sunken hover:text-content"
            >
              Today
            </Link>
            <Link
              href={href({ month: addMonths(monthAnchor, 1) })}
              className="rounded-lg px-2.5 py-1 text-xs text-content-muted transition-colors hover:bg-surface-sunken hover:text-content"
            >
              Next
            </Link>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="pb-1 text-center text-xs font-medium text-content-subtle"
          >
            {weekday}
          </div>
        ))}

        {cells.map((cell) => {
          const day = byDate.get(cell.date);
          const total = (day?.completions ?? 0) + (day?.repeats ?? 0);
          const isSelected = selectedDate === cell.date;

          return (
            <Link
              key={cell.date}
              href={href({ month: monthAnchor, day: cell.date })}
              aria-current={isSelected ? "date" : undefined}
              title={
                total === 0
                  ? "Nothing logged"
                  : `${day?.completions ?? 0} completed, ${day?.repeats ?? 0} repeated`
              }
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs transition-all",
                intensityClass(total),
                !cell.inMonth && "opacity-35",
                cell.date === today && "ring-1 ring-inset ring-border-strong",
                isSelected && "outline-2 outline-offset-1 outline-accent",
              )}
            >
              <span className="font-medium tabular-nums">
                {fromIsoDate(cell.date).getDate()}
              </span>
              {total > 0 ? (
                <span className="text-[10px] leading-none opacity-80">{total}</span>
              ) : null}
            </Link>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-content-subtle">
        <span>Less</span>
        <span className="h-3 w-3 rounded bg-surface-sunken" />
        <span className="h-3 w-3 rounded bg-accent/25" />
        <span className="h-3 w-3 rounded bg-accent/50" />
        <span className="h-3 w-3 rounded bg-accent" />
        <span>More</span>
      </div>
    </div>
  );
}
