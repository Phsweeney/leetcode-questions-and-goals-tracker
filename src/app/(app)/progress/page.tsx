import { PageHeader } from "@/components/PageHeader";
import { AddProblemButton } from "@/components/AddProblemButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { LevelHero } from "@/components/progress/LevelHero";
import { StreakCard } from "@/components/progress/StreakCard";
import { YearHeatmap } from "@/components/progress/YearHeatmap";
import { MomentumChart } from "@/components/progress/MomentumChart";
import { MasteryMap } from "@/components/progress/MasteryMap";
import { BadgeGrid, buildBadgeViews } from "@/components/progress/BadgeGrid";
import { RecordsCard } from "@/components/progress/RecordsCard";
import { FirstRunReveal } from "@/components/progress/FirstRunReveal";
import { getProgressOverview } from "@/lib/repos/progress";
import { listUnlocked, listUnseen } from "@/lib/repos/achievements";
import { syncAchievements } from "@/lib/progress/sync";
import { todayLocal } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default function ProgressPage() {
  const today = todayLocal();

  // Opening the screen is also the catch-up point: a log that predates the badge
  // system has never been evaluated, and this is idempotent.
  syncAchievements(today);

  const overview = getProgressOverview(today);
  const unlockedAt = new Map(
    listUnlocked().map((entry) => [entry.key, entry.unlockedAt]),
  );
  const unseen = listUnseen().map((entry) => entry.key);

  if (overview.snapshot.totalProblems === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Progress" />
        <EmptyState
          title="Nothing to show yet"
          description="Log a problem you have completed and your level, streak, topic mastery, and badges will start filling in."
          action={<AddProblemButton />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress"
        description="Everything you have built up so far."
      />

      {unseen.length > 0 ? <FirstRunReveal keys={unseen} /> : null}

      <LevelHero
        level={overview.level}
        totalProblems={overview.snapshot.totalProblems}
        currentStreak={overview.snapshot.currentStreak}
      />

      <StreakCard
        currentStreak={overview.snapshot.currentStreak}
        longestStreak={overview.snapshot.longestStreak}
        activity={overview.year}
        today={today}
      />

      <YearHeatmap activity={overview.year} start={overview.heatmapStart} today={today} />

      <MomentumChart weeks={overview.weeks} />

      <MasteryMap tags={overview.tags} />

      <BadgeGrid views={buildBadgeViews(overview.snapshot, unlockedAt)} />

      <RecordsCard records={overview.records} />
    </div>
  );
}
