import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatLongDate } from "@/lib/dates";
import type { GoalWithProgress } from "@/lib/types";

function statusLine(goal: GoalWithProgress): string {
  if (goal.completedCount >= goal.targetCount) {
    return "Target reached";
  }
  if (!goal.isActive) {
    return `Ended with ${goal.remainingCount} to go`;
  }
  if (goal.daysRemaining === 0) {
    return "Due today";
  }
  if (goal.daysRemaining === 1) {
    return "1 day left";
  }
  return `${goal.daysRemaining} days left`;
}

export function GoalCard({
  goal,
  actions,
}: {
  goal: GoalWithProgress;
  actions?: React.ReactNode;
}) {
  const reached = goal.completedCount >= goal.targetCount;

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-content">{goal.name}</p>
          <p className="mt-0.5 text-xs text-content-muted">
            Target date {formatLongDate(goal.endDate)}
          </p>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <p className="text-2xl font-semibold tabular-nums tracking-tight">
          {goal.completedCount}
          <span className="text-base font-normal text-content-muted">
            {" / "}
            {goal.targetCount}
          </span>
        </p>
        <p className="text-sm tabular-nums text-content-muted">{goal.percentComplete}%</p>
      </div>

      <div className="mt-2">
        <ProgressBar percent={goal.percentComplete} tone={reached ? "easy" : "accent"} />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-content-muted">
        <span>
          {goal.remainingCount} remaining
        </span>
        <span className={reached ? "text-easy" : undefined}>{statusLine(goal)}</span>
      </div>
    </div>
  );
}
