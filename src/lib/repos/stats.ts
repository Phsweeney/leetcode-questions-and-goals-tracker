import { db } from "@/lib/db";
import {
  calculateStreak,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "@/lib/dates";
import { DIFFICULTIES, type DayActivity, type Difficulty } from "@/lib/types";

export interface DifficultyCount {
  difficulty: Difficulty | null;
  count: number;
}

export interface DashboardStats {
  totalProblems: number;
  completedThisWeek: number;
  completedThisMonth: number;
  totalRepeats: number;
  repeatedProblems: number;
  currentStreak: number;
  difficultyBreakdown: DifficultyCount[];
}

function countProblemsBetween(from: string, to: string): number {
  const row = db()
    .prepare(
      "SELECT COUNT(*) AS count FROM problem WHERE completed_date >= ? AND completed_date <= ?",
    )
    .get(from, to) as { count: number };
  return row.count;
}

// A day counts as active when an original completion or any repeat lands on it.
export function listActivityDates(): string[] {
  const rows = db()
    .prepare(
      `SELECT completed_date AS date FROM problem
       UNION
       SELECT date FROM repeat`,
    )
    .all() as Array<{ date: string }>;
  return rows.map((row) => row.date);
}

export function listActivity(from: string, to: string): DayActivity[] {
  const rows = db()
    .prepare(
      `SELECT date, SUM(completions) AS completions, SUM(repeats) AS repeats
       FROM (
         SELECT completed_date AS date, 1 AS completions, 0 AS repeats
         FROM problem WHERE completed_date >= :from AND completed_date <= :to
         UNION ALL
         SELECT date AS date, 0 AS completions, 1 AS repeats
         FROM repeat WHERE date >= :from AND date <= :to
       )
       GROUP BY date
       ORDER BY date`,
    )
    .all({ from, to }) as Array<{ date: string; completions: number; repeats: number }>;

  return rows.map((row) => ({
    date: row.date,
    completions: row.completions,
    repeats: row.repeats,
  }));
}

export interface DayDetail {
  date: string;
  completions: Array<{ id: number; title: string; platformName: string }>;
  repeats: Array<{ id: number; problemId: number; title: string; notes: string }>;
}

export function getDayDetail(date: string): DayDetail {
  const completions = db()
    .prepare(
      `SELECT p.id, p.title, pl.name AS platform_name
       FROM problem p JOIN platform pl ON pl.id = p.platform_id
       WHERE p.completed_date = ?
       ORDER BY p.title COLLATE NOCASE`,
    )
    .all(date) as Array<{ id: number; title: string; platform_name: string }>;

  const repeats = db()
    .prepare(
      `SELECT r.id, r.problem_id, p.title, r.notes
       FROM repeat r JOIN problem p ON p.id = r.problem_id
       WHERE r.date = ?
       ORDER BY p.title COLLATE NOCASE`,
    )
    .all(date) as Array<{ id: number; problem_id: number; title: string; notes: string }>;

  return {
    date,
    completions: completions.map((row) => ({
      id: row.id,
      title: row.title,
      platformName: row.platform_name,
    })),
    repeats: repeats.map((row) => ({
      id: row.id,
      problemId: row.problem_id,
      title: row.title,
      notes: row.notes,
    })),
  };
}

export function getDifficultyBreakdown(): DifficultyCount[] {
  const rows = db()
    .prepare(
      "SELECT difficulty, COUNT(*) AS count FROM problem GROUP BY difficulty",
    )
    .all() as Array<{ difficulty: Difficulty | null; count: number }>;

  const counts = new Map<Difficulty | null, number>(
    rows.map((row) => [row.difficulty, row.count]),
  );

  const breakdown: DifficultyCount[] = DIFFICULTIES.map((difficulty) => ({
    difficulty,
    count: counts.get(difficulty) ?? 0,
  }));

  const none = counts.get(null) ?? 0;
  if (none > 0) {
    breakdown.push({ difficulty: null, count: none });
  }

  return breakdown;
}

export function getDashboardStats(today: string): DashboardStats {
  const totals = db()
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM problem) AS total_problems,
         (SELECT COUNT(*) FROM repeat) AS total_repeats,
         (SELECT COUNT(DISTINCT problem_id) FROM repeat) AS repeated_problems`,
    )
    .get() as {
    total_problems: number;
    total_repeats: number;
    repeated_problems: number;
  };

  return {
    totalProblems: totals.total_problems,
    totalRepeats: totals.total_repeats,
    repeatedProblems: totals.repeated_problems,
    completedThisWeek: countProblemsBetween(startOfWeek(today), endOfWeek(today)),
    completedThisMonth: countProblemsBetween(startOfMonth(today), endOfMonth(today)),
    currentStreak: calculateStreak(listActivityDates(), today),
    difficultyBreakdown: getDifficultyBreakdown(),
  };
}
