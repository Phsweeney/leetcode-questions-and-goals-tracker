import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import BetterSqlite3 from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { closeDatabase, openDatabase } from "@/lib/db/connection";
import { getSchemaVersion } from "@/lib/db/migrate";
import { MIGRATIONS } from "@/lib/db/migrations";

const created: string[] = [];

afterEach(() => {
  closeDatabase();
  while (created.length > 0) {
    const dir = created.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

// Builds the database exactly as a pre-Progress install would have left it:
// schema version 1, with a real log already in it.
function seedVersionOneDatabase(): { dbPath: string; backupDir: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "leettrack-v1-"));
  created.push(dir);

  const dbPath = path.join(dir, "database.db");
  const raw = new BetterSqlite3(dbPath);
  raw.exec(MIGRATIONS[0].sql);

  const platformId = (
    raw.prepare("SELECT id FROM platform WHERE name = 'LeetCode'").get() as { id: number }
  ).id;

  const insertProblem = raw.prepare(
    `INSERT INTO problem (title, url, platform_id, difficulty, completed_date, summary, notes, created_at, updated_at)
     VALUES (?, '', ?, ?, ?, 'old summary', 'old notes', datetime('now'), datetime('now'))`,
  );
  const first = Number(
    insertProblem.run("Two Sum", platformId, "Easy", "2026-08-10").lastInsertRowid,
  );
  insertProblem.run("Word Ladder", platformId, "Hard", "2026-08-12");
  insertProblem.run("Untyped One", platformId, null, "2026-08-13");

  const tagId = Number(
    raw
      .prepare("INSERT INTO tag (name, created_at) VALUES ('Graphs', datetime('now'))")
      .run().lastInsertRowid,
  );
  raw.prepare("INSERT INTO problem_tag (problem_id, tag_id) VALUES (?, ?)").run(first, tagId);

  raw
    .prepare(
      `INSERT INTO repeat (problem_id, date, notes, result, duration_minutes, created_at)
       VALUES (?, '2026-08-15', 'went fine', 'easy', 22, datetime('now'))`,
    )
    .run(first);

  raw
    .prepare(
      `INSERT INTO goal (name, target_count, start_date, end_date, created_at)
       VALUES ('August grind', 10, '2026-08-01', '2026-08-31', datetime('now'))`,
    )
    .run();

  raw.pragma("user_version = 1");
  raw.close();

  return { dbPath, backupDir: path.join(dir, "exports") };
}

describe("upgrading an existing v1 data folder", () => {
  it("migrates to v2 and leaves every existing row untouched", () => {
    const { dbPath, backupDir } = seedVersionOneDatabase();

    const db = openDatabase(dbPath, { backupDir });

    expect(getSchemaVersion(db)).toBe(2);

    const problems = db
      .prepare("SELECT title, difficulty, completed_date, summary, notes FROM problem ORDER BY id")
      .all();
    expect(problems).toEqual([
      {
        title: "Two Sum",
        difficulty: "Easy",
        completed_date: "2026-08-10",
        summary: "old summary",
        notes: "old notes",
      },
      {
        title: "Word Ladder",
        difficulty: "Hard",
        completed_date: "2026-08-12",
        summary: "old summary",
        notes: "old notes",
      },
      {
        title: "Untyped One",
        difficulty: null,
        completed_date: "2026-08-13",
        summary: "old summary",
        notes: "old notes",
      },
    ]);

    expect(
      db.prepare("SELECT date, result, duration_minutes FROM repeat").all(),
    ).toEqual([{ date: "2026-08-15", result: "easy", duration_minutes: 22 }]);

    expect(db.prepare("SELECT name FROM tag").all()).toEqual([{ name: "Graphs" }]);
    expect(db.prepare("SELECT COUNT(*) AS c FROM problem_tag").get()).toEqual({ c: 1 });
    expect(db.prepare("SELECT name, target_count FROM goal").all()).toEqual([
      { name: "August grind", target_count: 10 },
    ]);
    // The seeded platform list survives too, so existing problems keep their FK.
    expect(db.prepare("SELECT COUNT(*) AS c FROM platform").get()).toEqual({ c: 5 });
  });

  it("adds the new tables empty, ready to be backfilled on first use", () => {
    const { dbPath, backupDir } = seedVersionOneDatabase();

    const db = openDatabase(dbPath, { backupDir });

    expect(db.prepare("SELECT COUNT(*) AS c FROM achievement").get()).toEqual({ c: 0 });
    expect(db.prepare("SELECT COUNT(*) AS c FROM celebration").get()).toEqual({ c: 0 });
  });

  it("writes a pre-migration backup before changing anything", () => {
    const { dbPath, backupDir } = seedVersionOneDatabase();

    openDatabase(dbPath, { backupDir });

    const backups = fs.readdirSync(backupDir);
    expect(backups).toHaveLength(1);
    expect(backups[0]).toMatch(/^pre-migration-v1-.*\.db$/);

    // The backup is a genuine v1 copy with the original rows in it.
    const restored = new BetterSqlite3(path.join(backupDir, backups[0]), { readonly: true });
    expect(restored.pragma("user_version", { simple: true })).toBe(1);
    expect(restored.prepare("SELECT COUNT(*) AS c FROM problem").get()).toEqual({ c: 3 });
    restored.close();
  });

  it("is a no-op the second time the folder is opened", () => {
    const { dbPath, backupDir } = seedVersionOneDatabase();

    openDatabase(dbPath, { backupDir });
    closeDatabase();
    const reopened = openDatabase(dbPath, { backupDir });

    expect(getSchemaVersion(reopened)).toBe(2);
    expect(reopened.prepare("SELECT COUNT(*) AS c FROM problem").get()).toEqual({ c: 3 });
    // Still just the one backup: nothing was pending on the second open.
    expect(fs.readdirSync(backupDir)).toHaveLength(1);
  });
});
