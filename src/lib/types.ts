export const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const REPEAT_RESULTS = ["easy", "struggled", "failed"] as const;
export type RepeatResult = (typeof REPEAT_RESULTS)[number];

export const REPEAT_RESULT_LABELS: Record<RepeatResult, string> = {
  easy: "Solved easily",
  struggled: "Struggled",
  failed: "Could not solve",
};

export interface Platform {
  id: number;
  name: string;
  createdAt: string;
}

export interface Tag {
  id: number;
  name: string;
  createdAt: string;
}

export interface TagWithCount extends Tag {
  problemCount: number;
}

export interface Problem {
  id: number;
  title: string;
  url: string | null;
  platformId: number;
  platformName: string;
  difficulty: Difficulty | null;
  completedDate: string;
  summary: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemListItem extends Problem {
  tags: Tag[];
  repeatCount: number;
}

export interface ProblemDetail extends Problem {
  tags: Tag[];
  repeats: Repeat[];
}

export interface Repeat {
  id: number;
  problemId: number;
  date: string;
  notes: string;
  result: RepeatResult | null;
  durationMinutes: number | null;
  createdAt: string;
}

export interface Goal {
  id: number;
  name: string;
  targetCount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface GoalWithProgress extends Goal {
  completedCount: number;
  remainingCount: number;
  percentComplete: number;
  daysRemaining: number;
  isActive: boolean;
}

export interface DayActivity {
  date: string;
  completions: number;
  repeats: number;
}
