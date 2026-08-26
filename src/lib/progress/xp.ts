import type { Difficulty, RepeatResult } from "@/lib/types";

// XP is always derived from the rows that exist right now, never stored, so it
// can never drift away from the log. Nothing time-based (streaks, goals) earns
// XP, which keeps the total a pure function of work recorded.
export const PROBLEM_XP: Record<Difficulty | "Unset", number> = {
  Easy: 10,
  Medium: 25,
  Hard: 45,
  Unset: 15,
};

// Every repeat is worth doing; recalling cleanly is worth marginally more.
export const REPEAT_XP: Record<RepeatResult | "unset", number> = {
  easy: 12,
  struggled: 10,
  failed: 8,
  unset: 10,
};

export type DifficultyCounts = Record<Difficulty | "Unset", number>;
export type RepeatCounts = Record<RepeatResult | "unset", number>;

export function problemXp(counts: DifficultyCounts): number {
  return (
    counts.Easy * PROBLEM_XP.Easy +
    counts.Medium * PROBLEM_XP.Medium +
    counts.Hard * PROBLEM_XP.Hard +
    counts.Unset * PROBLEM_XP.Unset
  );
}

export function repeatXp(counts: RepeatCounts): number {
  return (
    counts.easy * REPEAT_XP.easy +
    counts.struggled * REPEAT_XP.struggled +
    counts.failed * REPEAT_XP.failed +
    counts.unset * REPEAT_XP.unset
  );
}

export function xpForProblem(difficulty: Difficulty | null): number {
  return PROBLEM_XP[difficulty ?? "Unset"];
}

export function xpForRepeat(result: RepeatResult | null): number {
  return REPEAT_XP[result ?? "unset"];
}

// Advancing *from* level n costs 100 + 40(n-1), which sums to a closed form.
// Fast early wins, a real climb later, no wall: L5 is roughly 26 problems,
// L10 roughly 94, L20 roughly 350.
export function totalXpForLevel(level: number): number {
  if (level <= 1) {
    return 0;
  }
  return 20 * (level - 1) * (level + 3);
}

export function levelFromXp(xp: number): number {
  if (!Number.isFinite(xp) || xp <= 0) {
    return 1;
  }
  // Inverse of 20(n-1)(n+3) = xp, solved for n.
  return Math.max(1, Math.floor(-1 + Math.sqrt(4 + xp / 20)));
}

const RANKS: Array<{ minLevel: number; title: string }> = [
  { minLevel: 25, title: "Legend" },
  { minLevel: 20, title: "Grandmaster" },
  { minLevel: 16, title: "Architect" },
  { minLevel: 13, title: "Strategist" },
  { minLevel: 10, title: "Algorithmist" },
  { minLevel: 7, title: "Problem Solver" },
  { minLevel: 5, title: "Practitioner" },
  { minLevel: 3, title: "Apprentice" },
  { minLevel: 1, title: "Novice" },
];

export function rankTitle(level: number): string {
  return RANKS.find((rank) => level >= rank.minLevel)?.title ?? "Novice";
}

export interface LevelInfo {
  level: number;
  rank: string;
  xpTotal: number;
  xpIntoLevel: number;
  xpForLevel: number;
  xpToNextLevel: number;
  percent: number;
}

export function describeLevel(xpTotal: number): LevelInfo {
  const safeTotal = Math.max(0, Math.floor(xpTotal));
  const level = levelFromXp(safeTotal);
  const base = totalXpForLevel(level);
  const next = totalXpForLevel(level + 1);
  const xpForLevel = next - base;
  const xpIntoLevel = safeTotal - base;

  return {
    level,
    rank: rankTitle(level),
    xpTotal: safeTotal,
    xpIntoLevel,
    xpForLevel,
    xpToNextLevel: xpForLevel - xpIntoLevel,
    percent: Math.min(100, Math.max(0, Math.round((xpIntoLevel / xpForLevel) * 100))),
  };
}
