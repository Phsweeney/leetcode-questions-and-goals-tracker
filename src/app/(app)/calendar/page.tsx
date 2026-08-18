import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ActivityCalendar } from "@/components/ActivityCalendar";
import { AddProblemButton } from "@/components/AddProblemButton";
import { Badge } from "@/components/ui/Badge";
import { getDayDetail, listActivity } from "@/lib/repos/stats";
import {
  endOfMonth,
  formatLongDate,
  isIsoDate,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  todayLocal,
} from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const { month, day } = await searchParams;
  const today = todayLocal();
  const anchor = month && isIsoDate(month) ? month : today;
  const selectedDate = day && isIsoDate(day) ? day : null;

  // The grid can show days either side of the month, so widen the activity window.
  const activity = listActivity(
    startOfWeek(startOfMonth(anchor)),
    endOfWeek(endOfMonth(anchor)),
  );
  const detail = selectedDate ? getDayDetail(selectedDate) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Every day you completed something new or came back for another attempt."
        actions={<AddProblemButton />}
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ActivityCalendar
            monthAnchor={anchor}
            activity={activity}
            basePath="/calendar"
            selectedDate={selectedDate ?? undefined}
          />
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-surface-raised p-5">
            {!detail ? (
              <p className="text-sm text-content-muted">
                Pick a day to see what you worked on.
              </p>
            ) : (
              <div className="space-y-5">
                <h2 className="text-sm font-medium text-content">
                  {formatLongDate(detail.date)}
                </h2>

                {detail.completions.length === 0 && detail.repeats.length === 0 ? (
                  <p className="text-sm text-content-subtle">Nothing logged on this day.</p>
                ) : null}

                {detail.completions.length > 0 ? (
                  <section>
                    <p className="text-xs font-medium uppercase tracking-wide text-content-subtle">
                      Completed problems
                    </p>
                    <ul className="mt-2 space-y-2">
                      {detail.completions.map((entry) => (
                        <li key={entry.id} className="flex items-center justify-between gap-3">
                          <Link
                            href={`/problems/${entry.id}`}
                            className="truncate text-sm text-content hover:text-accent"
                          >
                            {entry.title}
                          </Link>
                          <Badge>{entry.platformName}</Badge>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {detail.repeats.length > 0 ? (
                  <section>
                    <p className="text-xs font-medium uppercase tracking-wide text-content-subtle">
                      Repeated problems
                    </p>
                    <ul className="mt-2 space-y-2">
                      {detail.repeats.map((entry) => (
                        <li key={entry.id}>
                          <Link
                            href={`/problems/${entry.problemId}`}
                            className="text-sm text-content hover:text-accent"
                          >
                            {entry.title}
                          </Link>
                          {entry.notes.trim().length > 0 ? (
                            <p className="mt-0.5 line-clamp-2 text-xs text-content-muted">
                              {entry.notes}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
