import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanupTempDataFolders, useTempDataFolder } from "./helpers";
import { createProblem, getProblem, getProblemDetail } from "@/lib/repos/problems";
import {
  addRepeat,
  countRepeatedProblems,
  countRepeats,
  deleteRepeat,
  listRepeatsForProblem,
} from "@/lib/repos/repeats";
import { findPlatformByName } from "@/lib/repos/platforms";

let problemId = 0;
let otherId = 0;

beforeEach(() => {
  useTempDataFolder();
  const leetcode = findPlatformByName("LeetCode")!.id;

  problemId = createProblem({
    title: "Binary Search",
    url: "",
    platformId: leetcode,
    difficulty: "Medium",
    completedDate: "2026-08-18",
    summary: "",
    notes: "",
    tagIds: [],
  });

  otherId = createProblem({
    title: "Two Sum",
    url: "",
    platformId: leetcode,
    difficulty: "Easy",
    completedDate: "2026-08-17",
    summary: "",
    notes: "",
    tagIds: [],
  });
});

afterEach(() => {
  cleanupTempDataFolders();
});

describe("repeats", () => {
  it("records a repeat against the original problem", () => {
    addRepeat({
      problemId,
      date: "2026-08-25",
      notes: "Solved without the solution.",
      result: "struggled",
      durationMinutes: 18,
    });

    const repeats = listRepeatsForProblem(problemId);
    expect(repeats).toHaveLength(1);
    expect(repeats[0]).toMatchObject({
      date: "2026-08-25",
      result: "struggled",
      durationMinutes: 18,
      notes: "Solved without the solution.",
    });
  });

  it("never changes the original completion date", () => {
    addRepeat({
      problemId,
      date: "2026-09-05",
      notes: "",
      result: "easy",
      durationMinutes: null,
    });

    expect(getProblem(problemId)?.completedDate).toBe("2026-08-18");
  });

  it("does not create a new problem for each repeat", () => {
    addRepeat({ problemId, date: "2026-08-25", notes: "", result: null, durationMinutes: null });
    addRepeat({ problemId, date: "2026-09-05", notes: "", result: null, durationMinutes: null });

    const detail = getProblemDetail(problemId);
    expect(detail?.repeats).toHaveLength(2);
    expect(countRepeats()).toBe(2);
    expect(countRepeatedProblems()).toBe(1);
  });

  it("returns repeats in date order regardless of insertion order", () => {
    addRepeat({ problemId, date: "2026-09-20", notes: "", result: null, durationMinutes: null });
    addRepeat({ problemId, date: "2026-08-25", notes: "", result: null, durationMinutes: null });
    addRepeat({ problemId, date: "2026-09-05", notes: "", result: null, durationMinutes: null });

    expect(listRepeatsForProblem(problemId).map((repeat) => repeat.date)).toEqual([
      "2026-08-25",
      "2026-09-05",
      "2026-09-20",
    ]);
  });

  it("allows optional result and duration to be omitted", () => {
    addRepeat({ problemId, date: "2026-08-25", notes: "", result: null, durationMinutes: null });

    expect(listRepeatsForProblem(problemId)[0]).toMatchObject({
      result: null,
      durationMinutes: null,
    });
  });

  it("keeps repeats scoped to their own problem", () => {
    addRepeat({ problemId, date: "2026-08-25", notes: "", result: null, durationMinutes: null });

    expect(listRepeatsForProblem(otherId)).toHaveLength(0);
    expect(countRepeatedProblems()).toBe(1);
  });

  it("removes a single repeat without touching the problem", () => {
    const first = addRepeat({
      problemId,
      date: "2026-08-25",
      notes: "",
      result: null,
      durationMinutes: null,
    });
    addRepeat({ problemId, date: "2026-09-05", notes: "", result: null, durationMinutes: null });

    deleteRepeat(first);

    expect(listRepeatsForProblem(problemId).map((repeat) => repeat.date)).toEqual([
      "2026-09-05",
    ]);
    expect(getProblem(problemId)).not.toBeNull();
  });
});
