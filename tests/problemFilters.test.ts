import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanupTempDataFolders, insertRepeat, useTempDataFolder } from "./helpers";
import { createProblem, listProblems } from "@/lib/repos/problems";
import { createTag } from "@/lib/repos/tags";
import { createPlatform, findPlatformByName } from "@/lib/repos/platforms";
import { DEFAULT_QUERY, type ProblemQuery } from "@/lib/problemQuery";
import { todayLocal, startOfMonth } from "@/lib/dates";

function query(overrides: Partial<ProblemQuery> = {}): ProblemQuery {
  return { ...DEFAULT_QUERY, ...overrides };
}

let leetcode = 0;
let codeforces = 0;
let arraysTag = 0;
let graphsTag = 0;
let binarySearchId = 0;
let twoSumId = 0;
let graphId = 0;

beforeEach(() => {
  useTempDataFolder();
  leetcode = findPlatformByName("LeetCode")!.id;
  codeforces = findPlatformByName("Codeforces")!.id;
  arraysTag = createTag("Arrays").id;
  graphsTag = createTag("Graphs").id;

  binarySearchId = createProblem({
    title: "Binary Search",
    url: "https://leetcode.com/problems/binary-search/",
    platformId: leetcode,
    difficulty: "Medium",
    completedDate: "2026-08-18",
    summary: "The array is sorted so move two pointers.",
    notes: "Off by one trouble.",
    tagIds: [arraysTag],
  });

  twoSumId = createProblem({
    title: "Two Sum",
    url: "",
    platformId: leetcode,
    difficulty: "Easy",
    completedDate: "2026-08-17",
    summary: "Hash map of complements.",
    notes: "",
    tagIds: [arraysTag],
  });

  graphId = createProblem({
    title: "Shortest Path",
    url: "",
    platformId: codeforces,
    difficulty: null,
    completedDate: "2026-07-15",
    summary: "Dijkstra with a priority queue.",
    notes: "Revisit the heap details.",
    tagIds: [graphsTag],
  });

  insertRepeat(binarySearchId, "2026-08-25", "Solved without the solution.", "struggled", 12);
});

afterEach(() => {
  cleanupTempDataFolders();
});

function titles(q: ProblemQuery): string[] {
  return listProblems(q).map((problem) => problem.title);
}

describe("search", () => {
  it("returns everything by default, newest first", () => {
    expect(titles(query())).toEqual(["Binary Search", "Two Sum", "Shortest Path"]);
  });

  it("matches on title regardless of case", () => {
    expect(titles(query({ q: "binary" }))).toEqual(["Binary Search"]);
    expect(titles(query({ q: "BINARY" }))).toEqual(["Binary Search"]);
  });

  it("matches on summary, notes, platform, and tag name", () => {
    expect(titles(query({ q: "dijkstra" }))).toEqual(["Shortest Path"]);
    expect(titles(query({ q: "off by one" }))).toEqual(["Binary Search"]);
    expect(titles(query({ q: "codeforces" }))).toEqual(["Shortest Path"]);
    expect(titles(query({ q: "graphs" }))).toEqual(["Shortest Path"]);
  });

  it("treats wildcard characters as literal text", () => {
    expect(titles(query({ q: "%" }))).toEqual([]);
    expect(titles(query({ q: "_" }))).toEqual([]);
  });
});

describe("filters", () => {
  it("filters by platform", () => {
    expect(titles(query({ platformId: codeforces }))).toEqual(["Shortest Path"]);
  });

  it("filters by difficulty including problems with none", () => {
    expect(titles(query({ difficulty: "Easy" }))).toEqual(["Two Sum"]);
    expect(titles(query({ difficulty: "none" }))).toEqual(["Shortest Path"]);
  });

  it("narrows to problems carrying every selected tag", () => {
    expect(titles(query({ tagIds: [arraysTag] }))).toEqual(["Binary Search", "Two Sum"]);
    expect(titles(query({ tagIds: [arraysTag, graphsTag] }))).toEqual([]);
  });

  it("filters by a custom date range", () => {
    expect(
      titles(query({ dateRange: "custom", from: "2026-08-01", to: "2026-08-31" })),
    ).toEqual(["Binary Search", "Two Sum"]);
  });

  it("filters by repetition state", () => {
    expect(titles(query({ repeats: "repeated" }))).toEqual(["Binary Search"]);
    expect(titles(query({ repeats: "never" }))).toEqual(["Two Sum", "Shortest Path"]);
  });

  it("combines filters", () => {
    expect(titles(query({ platformId: leetcode, difficulty: "Medium", q: "sorted" }))).toEqual([
      "Binary Search",
    ]);
  });
});

describe("sorting", () => {
  it("sorts by completion date in both directions", () => {
    expect(titles(query({ sort: "oldest" }))).toEqual([
      "Shortest Path",
      "Two Sum",
      "Binary Search",
    ]);
  });

  it("sorts by title in both directions", () => {
    expect(titles(query({ sort: "title-asc" }))).toEqual([
      "Binary Search",
      "Shortest Path",
      "Two Sum",
    ]);
    expect(titles(query({ sort: "title-desc" }))).toEqual([
      "Two Sum",
      "Shortest Path",
      "Binary Search",
    ]);
  });

  it("sorts easy before medium before hard, with none last", () => {
    expect(titles(query({ sort: "difficulty" }))).toEqual([
      "Two Sum",
      "Binary Search",
      "Shortest Path",
    ]);
  });

  it("sorts by repeat count", () => {
    expect(titles(query({ sort: "repeats" }))[0]).toBe("Binary Search");
  });

  it("sorts by platform name", () => {
    expect(titles(query({ sort: "platform" }))[0]).toBe("Shortest Path");
  });
});

describe("list items", () => {
  it("carries the repeat count and tags for each row", () => {
    const rows = listProblems(query());
    const binarySearch = rows.find((row) => row.id === binarySearchId)!;
    const twoSum = rows.find((row) => row.id === twoSumId)!;
    const graph = rows.find((row) => row.id === graphId)!;

    expect(binarySearch.repeatCount).toBe(1);
    expect(twoSum.repeatCount).toBe(0);
    expect(binarySearch.tags.map((tag) => tag.name)).toEqual(["Arrays"]);
    expect(graph.tags.map((tag) => tag.name)).toEqual(["Graphs"]);
  });

  it("resolves relative date ranges against today", () => {
    createProblem({
      title: "Today Problem",
      url: "",
      platformId: leetcode,
      difficulty: "Easy",
      completedDate: todayLocal(),
      summary: "",
      notes: "",
      tagIds: [],
    });

    const todayRows = listProblems(query({ dateRange: "today" }));
    expect(todayRows.map((row) => row.title)).toContain("Today Problem");
    expect(todayRows.every((row) => row.completedDate === todayLocal())).toBe(true);
    expect(titles(query({ dateRange: "month" }))).toContain("Today Problem");
    expect(startOfMonth(todayLocal()) <= todayLocal()).toBe(true);
  });

  it("adds a custom platform and filters by it", () => {
    const atcoder = createPlatform("AtCoder");
    createProblem({
      title: "ABC Problem",
      url: "",
      platformId: atcoder.id,
      difficulty: null,
      completedDate: "2026-08-10",
      summary: "",
      notes: "",
      tagIds: [],
    });

    expect(titles(query({ platformId: atcoder.id }))).toEqual(["ABC Problem"]);
  });
});
