import { describe, expect, it, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  closeDatabase,
  getDb,
  getOpenDatabasePath,
  openDatabase,
} from "@/lib/db/connection";
import { SchemaTooNewError, getSchemaVersion, runMigrations } from "@/lib/db/migrate";
import { SCHEMA_VERSION } from "@/lib/db/migrations";

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "leettrack-test-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  closeDatabase();
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("migrations", () => {
  it("migrates a fresh database to the current schema version", () => {
    const dir = makeTempDir();
    const db = openDatabase(path.join(dir, "database.db"));

    expect(getSchemaVersion(db)).toBe(SCHEMA_VERSION);
    expect(getOpenDatabasePath()).toBe(path.join(dir, "database.db"));
  });

  it("seeds the default platforms exactly once", () => {
    const dir = makeTempDir();
    const dbPath = path.join(dir, "database.db");

    openDatabase(dbPath);
    const first = getDb()
      .prepare("SELECT name FROM platform ORDER BY id")
      .all()
      .map((row) => (row as { name: string }).name);
    closeDatabase();

    openDatabase(dbPath);
    const second = getDb()
      .prepare("SELECT name FROM platform ORDER BY id")
      .all()
      .map((row) => (row as { name: string }).name);

    expect(first).toEqual(["LeetCode", "Codeforces", "HackerRank", "NeetCode", "Other"]);
    expect(second).toEqual(first);
  });

  it("is a no-op when run twice", () => {
    const dir = makeTempDir();
    const db = openDatabase(path.join(dir, "database.db"));

    expect(runMigrations(db)).toBe(SCHEMA_VERSION);
    expect(runMigrations(db)).toBe(SCHEMA_VERSION);
  });

  it("refuses to open a database written by a newer app version", () => {
    const dir = makeTempDir();
    const db = openDatabase(path.join(dir, "database.db"));
    db.pragma(`user_version = ${SCHEMA_VERSION + 5}`);

    expect(() => runMigrations(db)).toThrow(SchemaTooNewError);
  });

  it("keeps the data folder to a single database file", () => {
    const dir = makeTempDir();
    openDatabase(path.join(dir, "database.db"));
    getDb()
      .prepare("INSERT INTO tag (name, created_at) VALUES (?, datetime('now'))")
      .run("Arrays");
    closeDatabase();

    expect(fs.readdirSync(dir)).toEqual(["database.db"]);
  });
});

describe("schema constraints", () => {
  function seededDb() {
    const dir = makeTempDir();
    const db = openDatabase(path.join(dir, "database.db"));
    const problemId = db
      .prepare(
        `INSERT INTO problem (title, url, platform_id, difficulty, completed_date, summary, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      )
      .run("Binary Search", "https://example.com", 1, "Medium", "2026-08-18", "", "")
      .lastInsertRowid as number;
    const tagId = db
      .prepare("INSERT INTO tag (name, created_at) VALUES (?, datetime('now'))")
      .run("Binary Search").lastInsertRowid as number;
    db.prepare("INSERT INTO problem_tag (problem_id, tag_id) VALUES (?, ?)").run(
      problemId,
      tagId,
    );
    return { db, problemId, tagId };
  }

  it("treats tag names as case insensitive", () => {
    const { db } = seededDb();

    expect(() =>
      db
        .prepare("INSERT INTO tag (name, created_at) VALUES (?, datetime('now'))")
        .run("binary search"),
    ).toThrow();
  });

  it("rejects a difficulty outside the allowed set", () => {
    const { db } = seededDb();

    expect(() =>
      db
        .prepare(
          `INSERT INTO problem (title, platform_id, difficulty, completed_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
        )
        .run("Trivial Problem", 1, "Trivial", "2026-01-01"),
    ).toThrow();
  });

  it("refuses to delete a platform that still has problems", () => {
    const { db } = seededDb();

    expect(() => db.prepare("DELETE FROM platform WHERE id = 1").run()).toThrow();
  });

  it("keeps problems when a tag is deleted", () => {
    const { db, tagId } = seededDb();

    db.prepare("DELETE FROM tag WHERE id = ?").run(tagId);

    const problems = db.prepare("SELECT COUNT(*) AS count FROM problem").get() as {
      count: number;
    };
    const links = db.prepare("SELECT COUNT(*) AS count FROM problem_tag").get() as {
      count: number;
    };
    expect(problems.count).toBe(1);
    expect(links.count).toBe(0);
  });

  it("deletes repeats and tag links when a problem is deleted", () => {
    const { db, problemId } = seededDb();
    db.prepare(
      "INSERT INTO repeat (problem_id, date, notes, result, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
    ).run(problemId, "2026-08-25", "solved it", "struggled");

    db.prepare("DELETE FROM problem WHERE id = ?").run(problemId);

    const repeats = db.prepare("SELECT COUNT(*) AS count FROM repeat").get() as {
      count: number;
    };
    const links = db.prepare("SELECT COUNT(*) AS count FROM problem_tag").get() as {
      count: number;
    };
    expect(repeats.count).toBe(0);
    expect(links.count).toBe(0);
  });
});
