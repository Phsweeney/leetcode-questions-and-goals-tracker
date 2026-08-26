import { formatLongDate, formatShortDate } from "@/lib/dates";
import type { PersonalRecords } from "@/lib/repos/progress";

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function RecordsCard({ records }: { records: PersonalRecords }) {
  const entries: Array<{ label: string; value: string; hint?: string }> = [
    {
      label: "Best day",
      value: records.bestDay ? `${records.bestDay.count}` : "—",
      hint: records.bestDay ? formatLongDate(records.bestDay.date) : "No completions yet",
    },
    {
      label: "Best week",
      value: records.bestWeek ? `${records.bestWeek.count}` : "—",
      hint: records.bestWeek
        ? `Week of ${formatShortDate(records.bestWeek.weekStart)}`
        : "No completions yet",
    },
    {
      label: "Longest streak",
      value: `${records.longestStreak}`,
      hint: records.longestStreak === 1 ? "day" : "days",
    },
    {
      label: "Top topic",
      value: records.topTag ? records.topTag.name : "—",
      hint: records.topTag
        ? `${records.topTag.solved} solved`
        : "Tag a problem to start",
    },
    {
      label: "Time logged",
      value: records.totalMinutes > 0 ? formatDuration(records.totalMinutes) : "—",
      hint: "Across timed repeats",
    },
    {
      label: "Clean recall",
      value:
        records.cleanRecallPercent === null ? "—" : `${records.cleanRecallPercent}%`,
      hint: "Repeats solved easily",
    },
  ];

  return (
    <div className="lt-anim-rise rounded-xl border border-border bg-surface-raised p-5">
      <h2 className="text-sm font-medium text-content">Personal records</h2>

      <dl className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <div key={entry.label}>
            <dd className="truncate text-xl font-semibold tabular-nums tracking-tight text-content">
              {entry.value}
            </dd>
            <dt className="mt-0.5 text-sm text-content-muted">{entry.label}</dt>
            {entry.hint ? (
              <p className="mt-0.5 truncate text-xs text-content-subtle">{entry.hint}</p>
            ) : null}
          </div>
        ))}
      </dl>
    </div>
  );
}
