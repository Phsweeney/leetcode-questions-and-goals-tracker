import { describe, expect, it } from "vitest";
import {
  describeLevel,
  levelFromXp,
  problemXp,
  rankTitle,
  repeatXp,
  totalXpForLevel,
} from "@/lib/progress/xp";

describe("xp totals", () => {
  it("weights a completion by difficulty", () => {
    expect(problemXp({ Easy: 1, Medium: 0, Hard: 0, Unset: 0 })).toBe(10);
    expect(problemXp({ Easy: 0, Medium: 1, Hard: 0, Unset: 0 })).toBe(25);
    expect(problemXp({ Easy: 0, Medium: 0, Hard: 1, Unset: 0 })).toBe(45);
    expect(problemXp({ Easy: 0, Medium: 0, Hard: 0, Unset: 1 })).toBe(15);
  });

  it("scores every repeat, with a small edge for a clean recall", () => {
    expect(repeatXp({ easy: 1, struggled: 0, failed: 0, unset: 0 })).toBe(12);
    expect(repeatXp({ easy: 0, struggled: 1, failed: 0, unset: 0 })).toBe(10);
    expect(repeatXp({ easy: 0, struggled: 0, failed: 1, unset: 0 })).toBe(8);
    expect(repeatXp({ easy: 0, struggled: 0, failed: 0, unset: 1 })).toBe(10);
  });

  it("adds up a mixed log", () => {
    expect(problemXp({ Easy: 4, Medium: 10, Hard: 2, Unset: 1 })).toBe(
      4 * 10 + 10 * 25 + 2 * 45 + 15,
    );
  });
});

describe("level curve", () => {
  it("matches the published thresholds", () => {
    const expected = [0, 100, 240, 420, 640, 900, 1200, 1540, 1920, 2340];
    expected.forEach((xp, index) => {
      expect(totalXpForLevel(index + 1)).toBe(xp);
    });
    expect(totalXpForLevel(15)).toBe(5040);
  });

  it("starts everyone at level one", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(-50)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
  });

  it("levels up exactly on the threshold, not before", () => {
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(239)).toBe(2);
    expect(levelFromXp(240)).toBe(3);
    expect(levelFromXp(2339)).toBe(9);
    expect(levelFromXp(2340)).toBe(10);
  });

  it("round-trips every level threshold", () => {
    for (let level = 1; level <= 30; level += 1) {
      expect(levelFromXp(totalXpForLevel(level))).toBe(level);
      expect(levelFromXp(totalXpForLevel(level + 1) - 1)).toBe(level);
    }
  });
});

describe("describeLevel", () => {
  it("reports position within the current level", () => {
    const info = describeLevel(170);

    expect(info.level).toBe(2);
    expect(info.xpIntoLevel).toBe(70);
    expect(info.xpForLevel).toBe(140);
    expect(info.xpToNextLevel).toBe(70);
    expect(info.percent).toBe(50);
  });

  it("sits at zero percent right after a level up", () => {
    const info = describeLevel(240);

    expect(info.level).toBe(3);
    expect(info.xpIntoLevel).toBe(0);
    expect(info.percent).toBe(0);
  });

  it("clamps a percent into 0-100 and never reports a negative total", () => {
    expect(describeLevel(0).percent).toBe(0);
    expect(describeLevel(-100).xpTotal).toBe(0);
    expect(describeLevel(-100).level).toBe(1);
  });

  it("names a rank for the level", () => {
    expect(rankTitle(1)).toBe("Novice");
    expect(rankTitle(5)).toBe("Practitioner");
    expect(rankTitle(10)).toBe("Algorithmist");
    expect(rankTitle(25)).toBe("Legend");
    expect(rankTitle(999)).toBe("Legend");
  });
});
