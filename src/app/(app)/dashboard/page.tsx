import { PageHeader } from "@/components/PageHeader";
import { ActivityCalendar } from "@/components/ActivityCalendar";
import { AddProblemButton } from "@/components/AddProblemButton";
import { StatCard, DifficultyBreakdown } from "@/components/StatCard";
import { ProblemsTable } from "@/components/ProblemsTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { getDashboardStats, listActivity } from "@/lib/repos/stats";
import { listProblems } from "@/lib/repos/problems";
import { DEFAULT_QUERY } from "@/lib/problemQuery";
import {
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  todayLocal,
} from "@/lib/dates";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const today = todayLocal();
  const stats = getDashboardStats(today);
  const recent = listProblems(DEFAULT_QUERY).slice(0, 5);
  const activity = listActivity(
    startOfWeek(startOfMonth(today)),
    endOfWeek(endOfMonth(today)),
  );

  if (stats.totalProblems === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" actions={<AddProblemButton />} />
        <EmptyState
          title="Nothing tracked yet"
          description="Add a problem you have already completed and your statistics, calendar, and goals will start filling in."
          action={<AddProblemButton />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A quick look at how your practice is going."
        actions={<AddProblemButton />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard value={stats.totalProblems} label="Problems" hint="Total completed" />
        <StatCard value={stats.completedThisWeek} label="This week" hint="New completions" />
        <StatCard value={stats.completedThisMonth} label="This month" hint="New completions" />
        <StatCard
          value={stats.currentStreak}
          label={stats.currentStreak === 1 ? "Day streak" : "Day streak"}
          hint="Consecutive active days"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          value={stats.totalRepeats}
          label="Repetitions"
          hint={`Across ${stats.repeatedProblems} ${
            stats.repeatedProblems === 1 ? "problem" : "problems"
          }`}
        />
        <div className="lg:col-span-2">
          <DifficultyBreakdown
            breakdown={stats.difficultyBreakdown}
            total={stats.totalProblems}
          />
        </div>
      </div>

      <ActivityCalendar
        monthAnchor={today}
        activity={activity}
        basePath="/calendar"
        showNavigation={false}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-content">Recently completed</h2>
          <LinkButton href="/problems" size="sm" variant="ghost">
            View all
          </LinkButton>
        </div>
        <ProblemsTable problems={recent} />
      </section>
    </div>
  );
}
