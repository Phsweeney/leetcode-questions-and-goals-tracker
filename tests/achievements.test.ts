import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  evaluateAchievements,
  isUnlocked,
} from "@/lib/progress/achievements";
import { emptySnapshot, type AchievementSnapshot } from "@/lib/progress/snapshot";
import { describeMastery, masteryPoints, tierIndexFor } from "@/lib/progress/mastery";

const TODAY = "2026-08-18";

function snapshot(overrides: Partial<AchievementSnapshot> = {}): AchievementSnapshot {
  return { ...emptySnapshot(TODAY), ...overrides };
}

describe("achievement catalogue", () => {
  it("uses a unique key for every badge", () => {
    const keys = ACHIEVEMENTS.map((def) => def.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("never reports progress beyond the target", () => {
    const maxed = snapshot({
      totalProblems: 100_000,
      byDifficulty: { Easy: 9999, Medium: 9999, Hard: 9999, Unset: 9999 },
      totalRepeats: 9999,
      repeatsByResult: { easy: 9999, struggled: 9999, failed: 9999, unset: 9999 },
      problemsRepeatedAtLeast3: 9999,
      distinctTags: 9999,
      maxProblemsInOneTag: 9999,
      masteredTags: 9999,
      longestStreak: 9999,
      bestDayCount: 9999,
      hardestWeekCount: 9999,
      weeksActiveInARow: 9999,
      goalsCompleted: 9999,
      hadComeback: true,
    });

    for (const def of ACHIEVEMENTS) {
      const { current, target } = def.progress(maxed);
      expect(current).toBe(target);
      expect(target).toBeGreaterThan(0);
    }
  });

  it("unlocks nothing on an empty log", () => {
    expect(evaluateAchievements(snapshot())).toEqual([]);
  });

  it("unlocks everything once every counter is saturated", () => {
    const maxed = snapshot({
      totalProblems: 100_000,
      byDifficulty: { Easy: 9999, Medium: 9999, Hard: 9999, Unset: 0 },
      totalRepeats: 9999,
      repeatsByResult: { easy: 9999, struggled: 0, failed: 0, unset: 0 },
      problemsRepeatedAtLeast3: 9999,
      distinctTags: 9999,
      maxProblemsInOneTag: 9999,
      masteredTags: 9999,
      longestStreak: 9999,
      bestDayCount: 9999,
      hardestWeekCount: 9999,
      weeksActiveInARow: 9999,
      goalsCompleted: 9999,
      hadComeback: true,
    });

    expect(evaluateAchievements(maxed)).toHaveLength(ACHIEVEMENTS.length);
  });

  it("unlocks on the threshold rather than one past it", () => {
    const at = ACHIEVEMENTS.find((def) => def.key === "volume-10")!;

    expect(isUnlocked(at, snapshot({ totalProblems: 9 }))).toBe(false);
    expect(isUnlocked(at, snapshot({ totalProblems: 10 }))).toBe(true);
  });

  it("awards the first solve immediately", () => {
    expect(evaluateAchievements(snapshot({ totalProblems: 1 }))).toContain("volume-1");
  });

  it("keeps a streak badge once the longest streak has reached it", () => {
    const earned = snapshot({ currentStreak: 0, longestStreak: 7 });

    expect(evaluateAchievements(earned)).toContain("streak-7");
    expect(evaluateAchievements(earned)).not.toContain("streak-14");
  });

  it("treats the comeback badge as a one-off flag", () => {
    const def = ACHIEVEMENTS.find((a) => a.key === "comeback")!;

    expect(def.progress(snapshot({ hadComeback: false }))).toEqual({
      current: 0,
      target: 1,
    });
    expect(def.progress(snapshot({ hadComeback: true }))).toEqual({
      current: 1,
      target: 1,
    });
  });
});

describe("topic mastery", () => {
  it("weights hard problems and revisits above raw volume", () => {
    expect(masteryPoints({ easy: 2, medium: 0, hard: 0, unset: 0, repeats: 0 })).toBe(2);
    expect(masteryPoints({ easy: 0, medium: 2, hard: 0, unset: 0, repeats: 0 })).toBe(3);
    expect(masteryPoints({ easy: 0, medium: 0, hard: 2, unset: 0, repeats: 0 })).toBe(4);
    expect(masteryPoints({ easy: 0, medium: 0, hard: 0, unset: 0, repeats: 2 })).toBe(1);
  });

  it("climbs tiers at the published points", () => {
    expect(tierIndexFor(0)).toBe(0);
    expect(tierIndexFor(1)).toBe(1);
    expect(tierIndexFor(7.5)).toBe(1);
    expect(tierIndexFor(8)).toBe(2);
    expect(tierIndexFor(20)).toBe(3);
    expect(tierIndexFor(40)).toBe(4);
    expect(tierIndexFor(500)).toBe(4);
  });

  it("describes an untouched topic without dividing by zero", () => {
    const tag = describeMastery({
      id: 1,
      name: "Tries",
      solved: 0,
      lastSolved: null,
      easy: 0,
      medium: 0,
      hard: 0,
      unset: 0,
      repeats: 0,
    });

    expect(tag.tier).toBe("Untouched");
    expect(tag.percent).toBe(0);
    expect(tag.nextTier).toBe("Seen");
  });

  it("reports a mastered topic as complete with no next rung", () => {
    const tag = describeMastery({
      id: 2,
      name: "Graphs",
      solved: 20,
      lastSolved: "2026-08-01",
      easy: 0,
      medium: 0,
      hard: 20,
      unset: 0,
      repeats: 0,
    });

    expect(tag.tier).toBe("Mastered");
    expect(tag.nextTier).toBeNull();
    expect(tag.percent).toBe(100);
  });
});
