import type { AchievementSnapshot } from "./snapshot";

export type AchievementCategory =
  | "volume"
  | "difficulty"
  | "streak"
  | "depth"
  | "breadth"
  | "grit";

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  volume: "Volume",
  difficulty: "Difficulty",
  streak: "Consistency",
  depth: "Depth",
  breadth: "Breadth",
  grit: "Grit",
};

export const CATEGORY_ORDER: AchievementCategory[] = [
  "volume",
  "difficulty",
  "streak",
  "depth",
  "breadth",
  "grit",
];

export interface AchievementProgress {
  current: number;
  target: number;
}

export interface AchievementDef {
  // Stable forever: this string is a primary key in the achievement table.
  key: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: 1 | 2 | 3;
  progress: (snapshot: AchievementSnapshot) => AchievementProgress;
}

// Progress is the single source of truth and unlocking is derived from it, so a
// rule can never disagree with the bar rendered next to it.
function reaching(
  target: number,
  read: (snapshot: AchievementSnapshot) => number,
): AchievementDef["progress"] {
  return (snapshot) => ({ current: Math.min(read(snapshot), target), target });
}

function flag(read: (snapshot: AchievementSnapshot) => boolean): AchievementDef["progress"] {
  return (snapshot) => ({ current: read(snapshot) ? 1 : 0, target: 1 });
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: "volume-1",
    title: "First Blood",
    description: "Log your first completed problem.",
    category: "volume",
    tier: 1,
    progress: reaching(1, (s) => s.totalProblems),
  },
  {
    key: "volume-10",
    title: "Getting Started",
    description: "Complete 10 problems.",
    category: "volume",
    tier: 1,
    progress: reaching(10, (s) => s.totalProblems),
  },
  {
    key: "volume-25",
    title: "Warmed Up",
    description: "Complete 25 problems.",
    category: "volume",
    tier: 1,
    progress: reaching(25, (s) => s.totalProblems),
  },
  {
    key: "volume-50",
    title: "Half a Century",
    description: "Complete 50 problems.",
    category: "volume",
    tier: 2,
    progress: reaching(50, (s) => s.totalProblems),
  },
  {
    key: "volume-100",
    title: "Centurion",
    description: "Complete 100 problems.",
    category: "volume",
    tier: 2,
    progress: reaching(100, (s) => s.totalProblems),
  },
  {
    key: "volume-250",
    title: "Serious Business",
    description: "Complete 250 problems.",
    category: "volume",
    tier: 3,
    progress: reaching(250, (s) => s.totalProblems),
  },
  {
    key: "volume-500",
    title: "Five Hundred",
    description: "Complete 500 problems.",
    category: "volume",
    tier: 3,
    progress: reaching(500, (s) => s.totalProblems),
  },

  {
    key: "easy-10",
    title: "Foundations",
    description: "Complete 10 Easy problems.",
    category: "difficulty",
    tier: 1,
    progress: reaching(10, (s) => s.byDifficulty.Easy),
  },
  {
    key: "easy-50",
    title: "Fundamentals Locked",
    description: "Complete 50 Easy problems.",
    category: "difficulty",
    tier: 2,
    progress: reaching(50, (s) => s.byDifficulty.Easy),
  },
  {
    key: "medium-10",
    title: "Stepping Up",
    description: "Complete 10 Medium problems.",
    category: "difficulty",
    tier: 1,
    progress: reaching(10, (s) => s.byDifficulty.Medium),
  },
  {
    key: "medium-50",
    title: "Comfortable in the Middle",
    description: "Complete 50 Medium problems.",
    category: "difficulty",
    tier: 2,
    progress: reaching(50, (s) => s.byDifficulty.Medium),
  },
  {
    key: "hard-5",
    title: "Into the Deep End",
    description: "Complete 5 Hard problems.",
    category: "difficulty",
    tier: 2,
    progress: reaching(5, (s) => s.byDifficulty.Hard),
  },
  {
    key: "hard-25",
    title: "No Fear",
    description: "Complete 25 Hard problems.",
    category: "difficulty",
    tier: 3,
    progress: reaching(25, (s) => s.byDifficulty.Hard),
  },
  {
    key: "hard-50",
    title: "Hard Mode",
    description: "Complete 50 Hard problems.",
    category: "difficulty",
    tier: 3,
    progress: reaching(50, (s) => s.byDifficulty.Hard),
  },

  {
    key: "streak-3",
    title: "Three in a Row",
    description: "Stay active 3 days running.",
    category: "streak",
    tier: 1,
    progress: reaching(3, (s) => s.longestStreak),
  },
  {
    key: "streak-7",
    title: "Full Week",
    description: "Stay active 7 days running.",
    category: "streak",
    tier: 1,
    progress: reaching(7, (s) => s.longestStreak),
  },
  {
    key: "streak-14",
    title: "Fortnight",
    description: "Stay active 14 days running.",
    category: "streak",
    tier: 2,
    progress: reaching(14, (s) => s.longestStreak),
  },
  {
    key: "streak-30",
    title: "Thirty Days",
    description: "Stay active 30 days running.",
    category: "streak",
    tier: 3,
    progress: reaching(30, (s) => s.longestStreak),
  },
  {
    key: "streak-100",
    title: "Unbroken",
    description: "Stay active 100 days running.",
    category: "streak",
    tier: 3,
    progress: reaching(100, (s) => s.longestStreak),
  },

  {
    key: "repeats-10",
    title: "Second Pass",
    description: "Log 10 repeats.",
    category: "depth",
    tier: 1,
    progress: reaching(10, (s) => s.totalRepeats),
  },
  {
    key: "repeats-50",
    title: "Spaced Out",
    description: "Log 50 repeats.",
    category: "depth",
    tier: 2,
    progress: reaching(50, (s) => s.totalRepeats),
  },
  {
    key: "repeats-thrice-10",
    title: "Drilled In",
    description: "Revisit 10 different problems three times or more.",
    category: "depth",
    tier: 3,
    progress: reaching(10, (s) => s.problemsRepeatedAtLeast3),
  },
  {
    key: "recall-25",
    title: "It Stuck",
    description: "Solve 25 repeats easily.",
    category: "depth",
    tier: 2,
    progress: reaching(25, (s) => s.repeatsByResult.easy),
  },

  {
    key: "tags-5",
    title: "Branching Out",
    description: "Practise across 5 different topics.",
    category: "breadth",
    tier: 1,
    progress: reaching(5, (s) => s.distinctTags),
  },
  {
    key: "tags-10",
    title: "Well Rounded",
    description: "Practise across 10 different topics.",
    category: "breadth",
    tier: 2,
    progress: reaching(10, (s) => s.distinctTags),
  },
  {
    key: "tags-20",
    title: "Full Spectrum",
    description: "Practise across 20 different topics.",
    category: "breadth",
    tier: 3,
    progress: reaching(20, (s) => s.distinctTags),
  },
  {
    key: "tag-depth-10",
    title: "Specialist",
    description: "Solve 10 problems in a single topic.",
    category: "breadth",
    tier: 2,
    progress: reaching(10, (s) => s.maxProblemsInOneTag),
  },
  {
    key: "mastered-3",
    title: "Triple Threat",
    description: "Reach Mastered on 3 topics.",
    category: "breadth",
    tier: 3,
    progress: reaching(3, (s) => s.masteredTags),
  },

  {
    key: "day-3",
    title: "Productive Day",
    description: "Complete 3 problems in one day.",
    category: "grit",
    tier: 1,
    progress: reaching(3, (s) => s.bestDayCount),
  },
  {
    key: "day-5",
    title: "On a Tear",
    description: "Complete 5 problems in one day.",
    category: "grit",
    tier: 2,
    progress: reaching(5, (s) => s.bestDayCount),
  },
  {
    key: "day-10",
    title: "Marathon",
    description: "Complete 10 problems in one day.",
    category: "grit",
    tier: 3,
    progress: reaching(10, (s) => s.bestDayCount),
  },
  {
    key: "hard-week-5",
    title: "Brutal Week",
    description: "Complete 5 Hard problems within one week.",
    category: "grit",
    tier: 3,
    progress: reaching(5, (s) => s.hardestWeekCount),
  },
  {
    key: "weeks-4",
    title: "Habit Formed",
    description: "Stay active every week for 4 weeks running.",
    category: "grit",
    tier: 2,
    progress: reaching(4, (s) => s.weeksActiveInARow),
  },
  {
    key: "goal-1",
    title: "Goal Met",
    description: "Hit the target on one of your goals.",
    category: "grit",
    tier: 1,
    progress: reaching(1, (s) => s.goalsCompleted),
  },
  {
    key: "goal-5",
    title: "Reliable",
    description: "Hit the target on 5 goals.",
    category: "grit",
    tier: 3,
    progress: reaching(5, (s) => s.goalsCompleted),
  },
  {
    key: "comeback",
    title: "Back at It",
    description: "Return to practice after a week or more away.",
    category: "grit",
    tier: 1,
    progress: flag((s) => s.hadComeback),
  },
];

export const ACHIEVEMENTS_BY_KEY = new Map(ACHIEVEMENTS.map((def) => [def.key, def]));

export function isUnlocked(def: AchievementDef, snapshot: AchievementSnapshot): boolean {
  const { current, target } = def.progress(snapshot);
  return current >= target;
}

export function evaluateAchievements(snapshot: AchievementSnapshot): string[] {
  return ACHIEVEMENTS.filter((def) => isUnlocked(def, snapshot)).map((def) => def.key);
}
