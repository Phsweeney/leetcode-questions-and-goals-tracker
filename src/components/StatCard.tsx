export function StatCard({
  value,
  label,
  hint,
}: {
  value: number | string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised px-5 py-4">
      <p className="text-3xl font-semibold tabular-nums tracking-tight text-content">
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-content-muted">{label}</p>
      {hint ? <p className="mt-0.5 text-xs text-content-subtle">{hint}</p> : null}
    </div>
  );
}

export function DifficultyBreakdown({
  breakdown,
  total,
}: {
  breakdown: Array<{ difficulty: string | null; count: number }>;
  total: number;
}) {
  const colors: Record<string, string> = {
    Easy: "bg-easy",
    Medium: "bg-medium",
    Hard: "bg-hard",
    None: "bg-border-strong",
  };

  return (
    <div className="rounded-xl border border-border bg-surface-raised px-5 py-4">
      <p className="text-sm font-medium text-content">Difficulty breakdown</p>
      <div className="mt-4 space-y-3">
        {breakdown.map((entry) => {
          const label = entry.difficulty ?? "None";
          const percent = total > 0 ? Math.round((entry.count / total) * 100) : 0;
          return (
            <div key={label}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-content-muted">{label}</span>
                <span className="tabular-nums text-content">{entry.count}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className={`h-full rounded-full ${colors[label]}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
