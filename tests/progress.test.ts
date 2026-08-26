import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanupTempDataFolders, insertRepeat, useTempDataFolder } from "./helpers";
import { createProblem } from "@/lib/repos/problems";
import { createTag } from "@/lib/repos/tags";
import { findPlatformByName } from "@/lib/repos/platforms";
import { buildSnapshot, getProgressOverview } from "@/lib/repos/progress";
import type { Difficulty } from "@/lib/types";

const TODAY = "2026-08-18";

function seedProblem(
  title: string,
  completedDate: string,
  difficulty: Difficulty | null = "Medium",
  tagIds: number[] = [],
): number {
  return createProblem({
    title,
    url: "",
    platformId: findPlatformByName("LeetCode")!.id,
    difficulty,
    completedDate,
    summary: "",
    notes: "",
    tagIds,
  });
}

beforeEach(() => {
  useTempDataFolder();
});

afterEach(() => {
  cleanupTempDataFolders();
});

describe("an empty log", () => {
  it("builds a zeroed snapshot without throwing", () => {
    const snapshot = buildSnapshot(TODAY);

    expect(snapshot.totalProblems).toBe(0);
    expect(snapshot.xpTotal).toBe(0);
    expect(snapshot.currentStreak).toBe(0);
    expect(snapshot.longestStreak).toBe(0);
    expect(snapshot.hadComeback).toBe(false);
  });

  it("builds an overview that renders at level one", () => {
    const overview = getProgressOverview(TODAY);

    expect(overview.level.level).toBe(1);
    expect(overview.level.percent).toBe(0);
    expect(overview.year).toEqual([]);
    expect(overview.tags).toEqual([]);
    expect(overview.records.bestDay).toBeNull();
    expect(overview.records.topTag).toBeNull();
    expect(overview.records.cleanRecallPercent).toBeNull();
    expect(overview.weeks).toHaveLength(26);
  });
});

describe("snapshot counters", () => {
  it("buckets a problem with no difficulty set as Unset", () => {
    seedProblem("Mystery", TODAY, null);

    const snapshot = buildSnapshot(TODAY);

    expect(snapshot.byDifficulty).toEqual({ Easy: 0, Medium: 0, Hard: 0, Unset: 1 });
    expect(snapshot.xpTotal).toBe(15);
  });

  it("sums xp across completions and repeats", () => {
    const id = seedProblem("Two Sum", TODAY, "Easy");
    insertRepeat(id, TODAY, "", "easy");

    expect(buildSnapshot(TODAY).xpTotal).toBe(10 + 12);
  });

  it("tracks the best single day and the best week", () => {
    seedProblem("A", "2026-08-17");
    seedProblem("B", "2026-08-17");
    seedProblem("C", "2026-08-18");

    const snapshot = buildSnapshot(TODAY);

    expect(snapshot.bestDayCount).toBe(2);
    expect(snapshot.bestWeekCount).toBe(3);

    const records = getProgressOverview(TODAY).records;
    expect(records.bestDay).toEqual({ date: "2026-08-17", count: 2 });
    expect(records.bestWeek).toEqual({ weekStart: "2026-08-17", count: 3 });
  });

  it("counts a problem revisited three times toward the drilled-in badge", () => {
    const id = seedProblem("Repeat Me", "2026-08-10");
    insertRepeat(id, "2026-08-12");
    insertRepeat(id, "2026-08-14");

    expect(buildSnapshot(TODAY).problemsRepeatedAtLeast3).toBe(0);

    insertRepeat(id, "2026-08-16");

    expect(buildSnapshot(TODAY).problemsRepeatedAtLeast3).toBe(1);
  });

  it("counts a week away as a comeback", () => {
    seedProblem("Before", "2026-08-01");
    seedProblem("After", "2026-08-18");

    expect(buildSnapshot(TODAY).hadComeback).toBe(true);
  });

  it("does not call a short break a comeback", () => {
    seedProblem("Before", "2026-08-15");
    seedProblem("After", "2026-08-18");

    expect(buildSnapshot(TODAY).hadComeback).toBe(false);
  });

  it("counts repeats as activity for streaks", () => {
    const id = seedProblem("Anchor", "2026-08-16");
    insertRepeat(id, "2026-08-17");
    insertRepeat(id, "2026-08-18");

    expect(buildSnapshot(TODAY).currentStreak).toBe(3);
  });
});

describe("topic mastery", () => {
  it("keeps a tag with no problems visible as Untouched", () => {
    createTag("Segment Tree");

    const tags = getProgressOverview(TODAY).tags;

    expect(tags).toHaveLength(1);
    expect(tags[0].name).toBe("Segment Tree");
    expect(tags[0].solved).toBe(0);
    expect(tags[0].tier).toBe("Untouched");
    expect(buildSnapshot(TODAY).distinctTags).toBe(0);
  });

  it("scores a tag from the difficulty of its problems", () => {
    const graphs = createTag("Graphs").id;
    seedProblem("DFS", "2026-08-10", "Hard", [graphs]);
    seedProblem("BFS", "2026-08-11", "Medium", [graphs]);

    const tag = getProgressOverview(TODAY).tags[0];

    expect(tag.solved).toBe(2);
    expect(tag.hard).toBe(1);
    expect(tag.medium).toBe(1);
    expect(tag.points).toBe(3.5);
    expect(tag.tier).toBe("Seen");

    const snapshot = buildSnapshot(TODAY);
    expect(snapshot.distinctTags).toBe(1);
    expect(snapshot.maxProblemsInOneTag).toBe(2);
  });

  it("counts repeats on a tagged problem toward that topic", () => {
    const dp = createTag("DP").id;
    const id = seedProblem("Knapsack", "2026-08-10", "Hard", [dp]);
    insertRepeat(id, "2026-08-12");
    insertRepeat(id, "2026-08-14");

    const tag = getProgressOverview(TODAY).tags[0];

    expect(tag.repeats).toBe(2);
    expect(tag.points).toBe(2 + 1);
  });
});

describe("momentum weeks", () => {
  it("returns 26 contiguous weeks ending with the current one", () => {
    const weeks = getProgressOverview(TODAY).weeks;

    expect(weeks).toHaveLength(26);
    expect(weeks[weeks.length - 1].weekStart).toBe("2026-08-17");
    expect(weeks[0].weekStart).toBe("2026-02-23");
  });

  it("splits a week by difficulty", () => {
    seedProblem("E", "2026-08-17", "Easy");
    seedProblem("M", "2026-08-18", "Medium");
    seedProblem("H", "2026-08-18", "Hard");

    const current = getProgressOverview(TODAY).weeks.at(-1)!;

    expect(current).toMatchObject({ easy: 1, medium: 1, hard: 1, unset: 0, total: 3 });
  });

  it("leaves problems older than the window out of the buckets", () => {
    seedProblem("Ancient", "2024-01-01");

    const weeks = getProgressOverview(TODAY).weeks;

    expect(weeks.every((week) => week.total === 0)).toBe(true);
    expect(buildSnapshot(TODAY).totalProblems).toBe(1);
  });
});

describe("the year heatmap", () => {
  it("merges completions and repeats onto one day", () => {
    const id = seedProblem("Same Day", TODAY);
    insertRepeat(id, TODAY);

    const day = getProgressOverview(TODAY).year.find((entry) => entry.date === TODAY);

    expect(day).toEqual({ date: TODAY, completions: 1, repeats: 1 });
  });

  it("starts on a week boundary and excludes days before it", () => {
    const overview = getProgressOverview(TODAY);

    expect(overview.heatmapStart).toBe("2025-08-18");
  });
});

describe("personal records", () => {
  it("reports the clean recall rate over graded repeats only", () => {
    const id = seedProblem("Recall", "2026-08-10");
    insertRepeat(id, "2026-08-11", "", "easy");
    insertRepeat(id, "2026-08-12", "", "struggled");
    insertRepeat(id, "2026-08-13", "", null);

    expect(getProgressOverview(TODAY).records.cleanRecallPercent).toBe(50);
  });

  it("totals the minutes logged against repeats", () => {
    const id = seedProblem("Timed", "2026-08-10");
    insertRepeat(id, "2026-08-11", "", "easy", 25);
    insertRepeat(id, "2026-08-12", "", "easy", 15);
    insertRepeat(id, "2026-08-13", "", "easy", null);

    expect(getProgressOverview(TODAY).records.totalMinutes).toBe(40);
  });
});
