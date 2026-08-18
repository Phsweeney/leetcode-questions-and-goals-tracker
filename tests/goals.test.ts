import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanupTempDataFolders, useTempDataFolder } from "./helpers";
import { createProblem } from "@/lib/repos/problems";
import { addRepeat } from "@/lib/repos/repeats";
import { findPlatformByName } from "@/lib/repos/platforms";
import {
  createGoal,
  deleteGoal,
  listActiveGoals,
  listGoals,
  updateGoal,
} from "@/lib/repos/goals";

const TODAY = "2026-08-18";

function seedProblem(title: string, completedDate: string): number {
  return createProblem({
    title,
    url: "",
    platformId: findPlatformByName("LeetCode")!.id,
    difficulty: "Medium",
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

describe("goals", () => {
  it("starts at zero progress with no problems", () => {
    createGoal({
      name: "Complete 100 problems",
      targetCount: 100,
      startDate: "2026-08-01",
      endDate: "2026-12-31",
    });

    expect(listGoals(TODAY)[0]).toMatchObject({
      completedCount: 0,
      remainingCount: 100,
      percentComplete: 0,
    });
  });

  it("counts only problems completed inside the goal window", () => {
    seedProblem("Before", "2026-07-31");
    seedProblem("On the start date", "2026-08-01");
    seedProblem("Inside", "2026-08-10");
    seedProblem("On the end date", "2026-08-31");
    seedProblem("After", "2026-09-01");

    createGoal({
      name: "August push",
      targetCount: 10,
      startDate: "2026-08-01",
      endDate: "2026-08-31",
    });

    expect(listGoals(TODAY)[0]).toMatchObject({
      completedCount: 3,
      remainingCount: 7,
      percentComplete: 30,
    });
  });

  it("does not let repeats move a goal forward", () => {
    const problem = seedProblem("Binary Search", "2026-08-10");
    addRepeat({ problemId: problem, date: "2026-08-12", notes: "", result: null, durationMinutes: null });
    addRepeat({ problemId: problem, date: "2026-08-14", notes: "", result: null, durationMinutes: null });

    createGoal({
      name: "August push",
      targetCount: 10,
      startDate: "2026-08-01",
      endDate: "2026-08-31",
    });

    expect(listGoals(TODAY)[0].completedCount).toBe(1);
  });

  it("caps progress at 100 percent when the target is passed", () => {
    for (let index = 0; index < 12; index += 1) {
      seedProblem(`Problem ${index}`, "2026-08-10");
    }

    createGoal({
      name: "Small target",
      targetCount: 10,
      startDate: "2026-08-01",
      endDate: "2026-08-31",
    });

    expect(listGoals(TODAY)[0]).toMatchObject({
      completedCount: 12,
      remainingCount: 0,
      percentComplete: 100,
    });
  });

  it("reports days remaining and active state against today", () => {
    createGoal({
      name: "Ends today",
      targetCount: 5,
      startDate: "2026-08-01",
      endDate: TODAY,
    });
    createGoal({
      name: "Already ended",
      targetCount: 5,
      startDate: "2026-07-01",
      endDate: "2026-07-31",
    });
    createGoal({
      name: "Ends later",
      targetCount: 5,
      startDate: "2026-08-01",
      endDate: "2026-08-28",
    });

    const goals = listGoals(TODAY);
    const endsToday = goals.find((goal) => goal.name === "Ends today")!;
    const ended = goals.find((goal) => goal.name === "Already ended")!;
    const later = goals.find((goal) => goal.name === "Ends later")!;

    expect(endsToday).toMatchObject({ daysRemaining: 0, isActive: true });
    expect(ended).toMatchObject({ daysRemaining: -18, isActive: false });
    expect(later).toMatchObject({ daysRemaining: 10, isActive: true });
    expect(listActiveGoals(TODAY).map((goal) => goal.name)).toEqual([
      "Ends today",
      "Ends later",
    ]);
  });

  it("orders goals by their deadline", () => {
    createGoal({ name: "Later", targetCount: 5, startDate: "2026-08-01", endDate: "2026-12-31" });
    createGoal({ name: "Sooner", targetCount: 5, startDate: "2026-08-01", endDate: "2026-09-30" });

    expect(listGoals(TODAY).map((goal) => goal.name)).toEqual(["Sooner", "Later"]);
  });

  it("recalculates progress after an edit", () => {
    seedProblem("July problem", "2026-07-10");
    seedProblem("August problem", "2026-08-10");

    const id = createGoal({
      name: "August push",
      targetCount: 4,
      startDate: "2026-08-01",
      endDate: "2026-08-31",
    });
    expect(listGoals(TODAY)[0].completedCount).toBe(1);

    updateGoal(id, {
      name: "Summer push",
      targetCount: 4,
      startDate: "2026-07-01",
      endDate: "2026-08-31",
    });

    expect(listGoals(TODAY)[0]).toMatchObject({
      name: "Summer push",
      completedCount: 2,
      percentComplete: 50,
    });
  });

  it("removes a goal without touching problems", () => {
    seedProblem("Kept", "2026-08-10");
    const id = createGoal({
      name: "Temporary",
      targetCount: 5,
      startDate: "2026-08-01",
      endDate: "2026-08-31",
    });

    deleteGoal(id);

    expect(listGoals(TODAY)).toHaveLength(0);
  });
});
