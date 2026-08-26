import type { DifficultyCounts, RepeatCounts } from "./xp";

// Every achievement rule reads from one of these. It is computed once per
// evaluation so that ~33 badges never mean ~33 queries.
export interface AchievementSnapshot {
  today: string;
  totalProblems: number;
  byDifficulty: DifficultyCounts;
  totalRepeats: number;
  repeatsByResult: RepeatCounts;
  problemsRepeatedAtLeast3: number;
  distinctTags: number;
  maxProblemsInOneTag: number;
  masteredTags: number;
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
  bestDayCount: number;
  bestWeekCount: number;
  hardestWeekCount: number;
  weeksActiveInARow: number;
  goalsCompleted: number;
  totalMinutes: number;
  hadComeback: boolean;
  xpTotal: number;
}

export function emptySnapshot(today: string): AchievementSnapshot {
  return {
    today,
    totalProblems: 0,
    byDifficulty: { Easy: 0, Medium: 0, Hard: 0, Unset: 0 },
    totalRepeats: 0,
    repeatsByResult: { easy: 0, struggled: 0, failed: 0, unset: 0 },
    problemsRepeatedAtLeast3: 0,
    distinctTags: 0,
    maxProblemsInOneTag: 0,
    masteredTags: 0,
    currentStreak: 0,
    longestStreak: 0,
    activeDays: 0,
    bestDayCount: 0,
    bestWeekCount: 0,
    hardestWeekCount: 0,
    weeksActiveInARow: 0,
    goalsCompleted: 0,
    totalMinutes: 0,
    hadComeback: false,
    xpTotal: 0,
  };
}
