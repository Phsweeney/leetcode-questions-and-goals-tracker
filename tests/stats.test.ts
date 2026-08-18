import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanupTempDataFolders, useTempDataFolder } from "./helpers";
import { createProblem } from "@/lib/repos/problems";
import { addRepeat } from "@/lib/repos/repeats";
import { findPlatformByName } from "@/lib/repos/platforms";
import {
  getDashboardStats,
  getDayDetail,
  getDifficultyBreakdown,
  listActivity,
  listActivityDates,
} from "@/lib/repos/stats";
import type { Difficulty } from "@/lib/types";

const TODAY = "2026-08-18";

function seedProblem(
  title: string,
  completedDate: string,
  difficulty: Difficulty | null = "Medium",
): number {
  return createProblem({
    title,
    url: "",
    platformId: findPlatformByName("LeetCode")!.id,
    difficulty,
    completedDate,
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

describe("dashboard statistics", () => {
  it("reports zeroes for an empty data folder", () => {
    const stats = getDashboardStats(TODAY);

    expect(stats.totalProblems).toBe(0);
    expect(stats.completedThisWeek).toBe(0);
    expect(stats.completedThisMonth).toBe(0);
    expect(stats.totalRepeats).toBe(0);
    expect(stats.currentStreak).toBe(0);
  });

  it("counts completions for the containing week and month", () => {
    seedProblem("Today", "2026-08-18");
    seedProblem("Monday", "2026-08-17");
    seedProblem("Last week", "2026-08-14");
    seedProblem("Earlier this month", "2026-08-02");
    seedProblem("Last month", "2026-07-30");

    const stats = getDashboardStats(TODAY);

    expect(stats.totalProblems).toBe(5);
    expect(stats.completedThisWeek).toBe(2);
    expect(stats.completedThisMonth).toBe(4);
  });

  it("counts total repeats separately from repeated problems", () => {
    const first = seedProblem("Binary Search", "2026-08-10");
    const second = seedProblem("Two Sum", "2026-08-11");
    seedProblem("Never repeated", "2026-08-12");

    addRepeat({ problemId: first, date: "2026-08-15", notes: "", result: null, durationMinutes: null });
    addRepeat({ problemId: first, date: "2026-08-16", notes: "", result: null, durationMinutes: null });
    addRepeat({ problemId: second, date: "2026-08-17", notes: "", result: null, durationMinutes: null });

    const stats = getDashboardStats(TODAY);

    expect(stats.totalProblems).toBe(3);
    expect(stats.totalRepeats).toBe(3);
    expect(stats.repeatedProblems).toBe(2);
  });

  it("treats repeats as streak activity alongside completions", () => {
    const problem = seedProblem("Binary Search", "2026-08-16");
    addRepeat({ problemId: problem, date: "2026-08-17", notes: "", result: null, durationMinutes: null });
    addRepeat({ problemId: problem, date: "2026-08-18", notes: "", result: null, durationMinutes: null });

    expect(getDashboardStats(TODAY).currentStreak).toBe(3);
  });

  it("keeps the streak alive on a day with nothing logged yet", () => {
    seedProblem("Yesterday", "2026-08-17");
    seedProblem("Day before", "2026-08-16");

    expect(getDashboardStats(TODAY).currentStreak).toBe(2);
  });

  it("breaks the streak after a full missed day", () => {
    seedProblem("Two days ago", "2026-08-16");

    expect(getDashboardStats(TODAY).currentStreak).toBe(0);
  });

  it("always reports the three difficulties, adding none only when used", () => {
    seedProblem("Easy one", "2026-08-18", "Easy");
    seedProblem("Hard one", "2026-08-18", "Hard");

    expect(getDifficultyBreakdown()).toEqual([
      { difficulty: "Easy", count: 1 },
      { difficulty: "Medium", count: 0 },
      { difficulty: "Hard", count: 1 },
    ]);

    seedProblem("Unrated", "2026-08-18", null);

    expect(getDifficultyBreakdown()).toContainEqual({ difficulty: null, count: 1 });
  });
});

describe("activity", () => {
  it("lists every day that has a completion or a repeat", () => {
    const problem = seedProblem("Binary Search", "2026-08-10");
    addRepeat({ problemId: problem, date: "2026-08-15", notes: "", result: null, durationMinutes: null });

    expect(listActivityDates().sort()).toEqual(["2026-08-10", "2026-08-15"]);
  });

  it("separates completions from repeats per day", () => {
    const first = seedProblem("Binary Search", "2026-08-18");
    seedProblem("Two Sum", "2026-08-18");
    addRepeat({ problemId: first, date: "2026-08-18", notes: "", result: null, durationMinutes: null });

    expect(listActivity("2026-08-01", "2026-08-31")).toEqual([
      { date: "2026-08-18", completions: 2, repeats: 1 },
    ]);
  });

  it("respects the requested date window", () => {
    seedProblem("Inside", "2026-08-18");
    seedProblem("Outside", "2026-07-18");

    const activity = listActivity("2026-08-01", "2026-08-31");
    expect(activity.map((day) => day.date)).toEqual(["2026-08-18"]);
  });

  it("returns the problems and repeats recorded on a single day", () => {
    const first = seedProblem("Binary Search", "2026-08-18");
    seedProblem("Two Sum", "2026-08-18");
    addRepeat({
      problemId: first,
      date: "2026-08-18",
      notes: "Much faster this time.",
      result: "easy",
      durationMinutes: 6,
    });

    const detail = getDayDetail("2026-08-18");

    expect(detail.completions.map((entry) => entry.title)).toEqual([
      "Binary Search",
      "Two Sum",
    ]);
    expect(detail.repeats).toHaveLength(1);
    expect(detail.repeats[0]).toMatchObject({
      title: "Binary Search",
      notes: "Much faster this time.",
    });
  });

  it("returns an empty day detail when nothing happened", () => {
    const detail = getDayDetail("2026-08-18");

    expect(detail.completions).toHaveLength(0);
    expect(detail.repeats).toHaveLength(0);
  });
});
