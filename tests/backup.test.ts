import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { unzipSync, zipSync } from "fflate";
import { cleanupTempDataFolders, useTempDataFolder } from "./helpers";
import { backupFileName, createBackup, restoreBackup } from "@/lib/fs/backup";
import { createProblem } from "@/lib/repos/problems";
import { createTag } from "@/lib/repos/tags";
import { addRepeat } from "@/lib/repos/repeats";
import { createGoal } from "@/lib/repos/goals";
import { findPlatformByName } from "@/lib/repos/platforms";
import { closeDatabase, openDatabase } from "@/lib/db/connection";
import { exportsPath } from "@/lib/fs/dataFolder";

let dataDir = "";
const scratchDirs: string[] = [];

function scratch(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "leettrack-backup-"));
  scratchDirs.push(dir);
  return dir;
}

beforeEach(() => {
  dataDir = useTempDataFolder();
  const tag = createTag("Arrays");
  const problem = createProblem({
    title: "Binary Search",
    url: "https://example.com",
    platformId: findPlatformByName("LeetCode")!.id,
    difficulty: "Medium",
    completedDate: "2026-08-18",
    summary: "Sorted array.",
    notes: "Off by one.",
    tagIds: [tag.id],
  });
  addRepeat({
    problemId: problem,
    date: "2026-08-25",
    notes: "Better.",
    result: "easy",
    durationMinutes: 8,
  });
  createGoal({
    name: "Complete 100 problems",
    targetCount: 100,
    startDate: "2026-08-01",
    endDate: "2026-12-31",
  });
});

afterEach(() => {
  cleanupTempDataFolders();
  while (scratchDirs.length > 0) {
    const dir = scratchDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("backup export", () => {
  it("names the archive by date", () => {
    expect(backupFileName("2026-08-18")).toBe("LeetTrack-Backup-2026-08-18.zip");
  });

  it("includes the database and metadata", () => {
    const entries = unzipSync(createBackup(dataDir));

    expect(Object.keys(entries).sort()).toContain("database.db");
    expect(Object.keys(entries).sort()).toContain("metadata.json");
  });

  it("includes attachments but leaves earlier exports out", () => {
    fs.writeFileSync(path.join(dataDir, "attachments", "diagram.txt"), "a sketch");
    fs.mkdirSync(exportsPath(dataDir), { recursive: true });
    fs.writeFileSync(path.join(exportsPath(dataDir), "old-backup.zip"), "stale");

    const entries = unzipSync(createBackup(dataDir));

    expect(entries["attachments/diagram.txt"]).toBeDefined();
    expect(Object.keys(entries).some((name) => name.startsWith("exports/"))).toBe(false);
  });

  it("refuses to back up a folder that is not a data folder", () => {
    expect(() => createBackup(scratch())).toThrow();
  });
});

describe("backup restore", () => {
  it("round trips every record into a new folder", () => {
    const archive = createBackup(dataDir);
    closeDatabase();

    const target = path.join(scratch(), "Restored");
    expect(restoreBackup(archive, target)).toEqual({ ok: true });

    const restored = openDatabase(path.join(target, "database.db"));
    const counts = restored
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM problem) AS problems,
           (SELECT COUNT(*) FROM repeat) AS repeats,
           (SELECT COUNT(*) FROM tag) AS tags,
           (SELECT COUNT(*) FROM goal) AS goals,
           (SELECT COUNT(*) FROM problem_tag) AS links`,
      )
      .get();

    expect(counts).toEqual({ problems: 1, repeats: 1, tags: 1, goals: 1, links: 1 });
  });

  it("recreates the folder contract on restore", () => {
    const archive = createBackup(dataDir);
    const target = path.join(scratch(), "Restored");

    restoreBackup(archive, target);

    expect(fs.readdirSync(target).sort()).toEqual([
      "attachments",
      "database.db",
      "exports",
      "metadata.json",
    ]);
  });

  it("refuses to restore over an existing data folder", () => {
    const archive = createBackup(dataDir);

    const outcome = restoreBackup(archive, dataDir);

    expect(outcome.ok).toBe(false);
    expect(outcome.error).toMatch(/empty folder/i);
  });

  it("refuses to restore into a folder holding unrelated files", () => {
    const target = scratch();
    fs.writeFileSync(path.join(target, "notes.txt"), "mine");

    const outcome = restoreBackup(createBackup(dataDir), target);

    expect(outcome.ok).toBe(false);
  });

  it("rejects a file that is not a zip archive", () => {
    const outcome = restoreBackup(
      new TextEncoder().encode("this is not a zip"),
      path.join(scratch(), "Restored"),
    );

    expect(outcome.ok).toBe(false);
    expect(outcome.error).toMatch(/zip/i);
  });

  it("rejects a zip that is not a LeetTrack backup", () => {
    const archive = zipSync({ "readme.txt": new TextEncoder().encode("hello") });

    const outcome = restoreBackup(archive, path.join(scratch(), "Restored"));

    expect(outcome.ok).toBe(false);
    expect(outcome.error).toMatch(/LeetTrack backup/i);
  });

  it("rejects an archive whose entries escape the target folder", () => {
    const valid = unzipSync(createBackup(dataDir));
    const tampered = zipSync({
      "metadata.json": valid["metadata.json"],
      "database.db": valid["database.db"],
      "../escaped.txt": new TextEncoder().encode("should not be written"),
    });

    const parent = scratch();
    const target = path.join(parent, "Restored");
    const outcome = restoreBackup(tampered, target);

    expect(outcome.ok).toBe(false);
    expect(fs.existsSync(path.join(parent, "escaped.txt"))).toBe(false);
  });
});
