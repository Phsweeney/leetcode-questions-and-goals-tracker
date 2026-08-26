import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanupTempDataFolders, useTempDataFolder } from "./helpers";
import { createProblem, deleteProblem } from "@/lib/repos/problems";
import { findPlatformByName } from "@/lib/repos/platforms";
import { listUnlocked, listUnseen, markAllSeen } from "@/lib/repos/achievements";
import {
  clearPendingCelebration,
  getPendingCelebration,
} from "@/lib/repos/celebration";
import { recordCelebration, syncAchievements } from "@/lib/progress/sync";
import { buildSnapshot } from "@/lib/repos/progress";
import type { Difficulty } from "@/lib/types";

const TODAY = "2026-08-18";

function seedProblem(title: string, difficulty: Difficulty | null = "Medium"): number {
  return createProblem({
    title,
    url: "",
    platformId: findPlatformByName("LeetCode")!.id,
    difficulty,
    completedDate: TODAY,
    summary: "",
    notes: "",
    tagIds: [],
  });
}

beforeEach(() => {
  useTempDataFolder();
});

afterEach(() => {
  cleanupTempDataFolders();
});

describe("syncing achievements", () => {
  it("unlocks nothing against an empty log", () => {
    const result = syncAchievements(TODAY);

    expect(result.newlyUnlocked).toEqual([]);
    expect(result.backfilled).toBe(false);
    expect(listUnlocked()).toEqual([]);
  });

  it("celebrates the very first problem rather than backfilling it", () => {
    seedProblem("Two Sum");

    const result = syncAchievements(TODAY);

    expect(result.backfilled).toBe(false);
    expect(result.newlyUnlocked).toContain("volume-1");
  });

  it("backfills a log that already had history, without announcing it", () => {
    for (let index = 0; index < 12; index += 1) {
      seedProblem(`Problem ${index}`);
    }

    const result = syncAchievements(TODAY);

    expect(result.backfilled).toBe(true);
    // Nothing is announced, but the badges are recorded and left unseen so the
    // progress screen can reveal them once.
    expect(result.newlyUnlocked).toEqual([]);

    const keys = listUnlocked().map((entry) => entry.key);
    expect(keys).toContain("volume-1");
    expect(keys).toContain("volume-10");
    expect(listUnseen()).toHaveLength(keys.length);
  });

  it("announces normally once the backfill has happened", () => {
    for (let index = 0; index < 12; index += 1) {
      seedProblem(`Problem ${index}`);
    }
    syncAchievements(TODAY);
    markAllSeen("2026-08-18T00:00:00.000Z");

    for (let index = 0; index < 13; index += 1) {
      seedProblem(`Later ${index}`);
    }
    const result = syncAchievements(TODAY);

    expect(result.backfilled).toBe(false);
    expect(result.newlyUnlocked).toEqual(["volume-25"]);
  });

  it("is idempotent", () => {
    seedProblem("Only One");
    syncAchievements(TODAY);

    const again = syncAchievements(TODAY);

    expect(again.newlyUnlocked).toEqual([]);
    expect(listUnlocked()).toHaveLength(1);
  });

  it("never revokes a badge when the work behind it is deleted", () => {
    const id = seedProblem("Two Sum");
    syncAchievements(TODAY);
    expect(listUnlocked().map((entry) => entry.key)).toContain("volume-1");

    deleteProblem(id);
    syncAchievements(TODAY);

    expect(listUnlocked().map((entry) => entry.key)).toContain("volume-1");
    expect(buildSnapshot(TODAY).totalProblems).toBe(0);
  });
});

describe("recording a celebration", () => {
  it("derives the level before the action from the xp just gained", () => {
    // 4 Mediums is 100 xp, which is exactly the level 2 threshold.
    for (let index = 0; index < 4; index += 1) {
      seedProblem(`Problem ${index}`);
    }

    recordCelebration({
      kind: "problem",
      title: "Problem 3",
      xpGained: 25,
      snapshot: buildSnapshot(TODAY),
      unlockedKeys: ["volume-1"],
    });

    const pending = getPendingCelebration()!;

    expect(pending.xpTotal).toBe(100);
    expect(pending.xpGained).toBe(25);
    expect(pending.levelBefore).toBe(1);
    expect(pending.levelAfter).toBe(2);
    expect(pending.unlockedKeys).toEqual(["volume-1"]);
    expect(pending.title).toBe("Problem 3");
  });

  it("keeps only the most recent celebration", () => {
    seedProblem("First");
    const snapshot = buildSnapshot(TODAY);

    recordCelebration({
      kind: "problem",
      title: "First",
      xpGained: 25,
      snapshot,
      unlockedKeys: [],
    });
    recordCelebration({
      kind: "repeat",
      title: "Second",
      xpGained: 10,
      snapshot,
      unlockedKeys: [],
    });

    expect(getPendingCelebration()!.title).toBe("Second");
    expect(getPendingCelebration()!.kind).toBe("repeat");
  });

  it("reports nothing pending once cleared", () => {
    seedProblem("First");
    recordCelebration({
      kind: "problem",
      title: "First",
      xpGained: 25,
      snapshot: buildSnapshot(TODAY),
      unlockedKeys: [],
    });

    clearPendingCelebration();

    expect(getPendingCelebration()).toBeNull();
  });
});
