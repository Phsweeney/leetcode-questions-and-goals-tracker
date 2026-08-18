import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanupTempDataFolders, useTempDataFolder } from "./helpers";
import {
  createProblem,
  deleteProblem,
  getProblem,
  getProblemDetail,
  updateProblem,
} from "@/lib/repos/problems";
import { createTag, listTagsWithCounts } from "@/lib/repos/tags";
import { createPlatform, findPlatformByName, listPlatforms } from "@/lib/repos/platforms";
import type { ProblemInput } from "@/lib/schemas";

function input(overrides: Partial<ProblemInput> = {}): ProblemInput {
  return {
    title: "Binary Search",
    url: "https://leetcode.com/problems/binary-search/",
    platformId: findPlatformByName("LeetCode")!.id,
    difficulty: "Medium",
    completedDate: "2026-08-18",
    summary: "Sorted array, move left and right pointers.",
    notes: "Watch the off by one.",
    tagIds: [],
    ...overrides,
  };
}

beforeEach(() => {
  useTempDataFolder();
});

afterEach(() => {
  cleanupTempDataFolders();
});

describe("problems repository", () => {
  it("creates a problem and reads it back", () => {
    const id = createProblem(input());
    const problem = getProblem(id);

    expect(problem).toMatchObject({
      title: "Binary Search",
      platformName: "LeetCode",
      difficulty: "Medium",
      completedDate: "2026-08-18",
    });
  });

  it("stores an omitted url as null rather than an empty string", () => {
    const id = createProblem(input({ url: "" }));

    expect(getProblem(id)?.url).toBeNull();
  });

  it("keeps a null difficulty for platforms that do not rate problems", () => {
    const codeforces = findPlatformByName("Codeforces")!;
    const id = createProblem(
      input({ platformId: codeforces.id, difficulty: null, title: "Custom Problem" }),
    );

    expect(getProblem(id)).toMatchObject({ difficulty: null, platformName: "Codeforces" });
  });

  it("links tags and reports them on the detail record", () => {
    const arrays = createTag("Arrays");
    const search = createTag("Binary Search");
    const id = createProblem(input({ tagIds: [arrays.id, search.id] }));

    const detail = getProblemDetail(id);

    expect(detail?.tags.map((tag) => tag.name)).toEqual(["Arrays", "Binary Search"]);
    expect(listTagsWithCounts().find((tag) => tag.name === "Arrays")?.problemCount).toBe(1);
  });

  it("replaces the tag set on update instead of appending", () => {
    const arrays = createTag("Arrays");
    const search = createTag("Binary Search");
    const hashing = createTag("Hash Map");
    const id = createProblem(input({ tagIds: [arrays.id, search.id] }));

    updateProblem(id, input({ title: "Two Sum", tagIds: [hashing.id] }));

    const detail = getProblemDetail(id);
    expect(detail?.title).toBe("Two Sum");
    expect(detail?.tags.map((tag) => tag.name)).toEqual(["Hash Map"]);
  });

  it("touches updated_at but preserves created_at on update", () => {
    const id = createProblem(input());
    const before = getProblem(id)!;

    updateProblem(id, input({ title: "Renamed" }));
    const after = getProblem(id)!;

    expect(after.createdAt).toBe(before.createdAt);
    expect(after.title).toBe("Renamed");
  });

  it("deletes a problem and its tag links", () => {
    const arrays = createTag("Arrays");
    const id = createProblem(input({ tagIds: [arrays.id] }));

    deleteProblem(id);

    expect(getProblem(id)).toBeNull();
    expect(listTagsWithCounts().find((tag) => tag.name === "Arrays")?.problemCount).toBe(0);
  });

  it("adds a custom platform and reuses it case insensitively", () => {
    const created = createPlatform("AtCoder");
    const again = createPlatform("atcoder");

    expect(again.id).toBe(created.id);
    expect(listPlatforms().filter((p) => p.name.toLowerCase() === "atcoder")).toHaveLength(1);
  });
});
