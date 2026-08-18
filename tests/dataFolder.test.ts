import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { closeDatabase, getDb, isDatabaseOpen } from "@/lib/db/connection";
import { SCHEMA_VERSION } from "@/lib/db/migrations";
import {
  APP_DATA_VERSION,
  ensureDataFolderOpen,
  inspectFolder,
  openDataFolder,
  readMetadata,
} from "@/lib/fs/dataFolder";

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "leettrack-folder-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  closeDatabase();
  delete process.env.LEETTRACK_DATA_DIR;
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("data folder", () => {
  it("scaffolds the full folder contract", () => {
    const dir = path.join(makeTempDir(), "LeetTrackData");

    openDataFolder(dir);

    expect(fs.readdirSync(dir).sort()).toEqual([
      "attachments",
      "database.db",
      "exports",
      "metadata.json",
    ]);
    expect(readMetadata(dir)).toMatchObject({
      app: "LeetTrack",
      schemaVersion: SCHEMA_VERSION,
      appDataVersion: APP_DATA_VERSION,
    });
  });

  it("reports a valid folder as valid and preserves its creation date", () => {
    const dir = path.join(makeTempDir(), "LeetTrackData");
    openDataFolder(dir);
    const created = readMetadata(dir)?.createdAt;
    closeDatabase();

    openDataFolder(dir);

    const inspection = inspectFolder(dir);
    expect(inspection.status).toBe("valid");
    expect(readMetadata(dir)?.createdAt).toBe(created);
  });

  it("distinguishes missing, empty, and foreign folders", () => {
    const parent = makeTempDir();

    expect(inspectFolder(path.join(parent, "nope")).status).toBe("missing");

    const empty = path.join(parent, "empty");
    fs.mkdirSync(empty);
    expect(inspectFolder(empty).status).toBe("empty");

    const foreign = path.join(parent, "foreign");
    fs.mkdirSync(foreign);
    fs.writeFileSync(path.join(foreign, "notes.txt"), "hello");
    expect(inspectFolder(foreign).status).toBe("not-a-data-folder");
  });

  it("rejects a folder whose database file was removed", () => {
    const dir = path.join(makeTempDir(), "LeetTrackData");
    openDataFolder(dir);
    closeDatabase();
    fs.rmSync(path.join(dir, "database.db"));

    const inspection = inspectFolder(dir);
    expect(inspection.status).toBe("not-a-data-folder");
  });

  it("opens the folder named by the environment override", () => {
    const dir = path.join(makeTempDir(), "PortableData");
    process.env.LEETTRACK_DATA_DIR = dir;

    const opened = ensureDataFolderOpen();

    expect(opened).toBe(path.resolve(dir));
    expect(isDatabaseOpen()).toBe(true);
    expect(getDb().prepare("SELECT COUNT(*) AS c FROM platform").get()).toEqual({ c: 5 });
  });

  it("does not reopen the database when the folder is already open", () => {
    const dir = path.join(makeTempDir(), "PortableData");
    process.env.LEETTRACK_DATA_DIR = dir;

    ensureDataFolderOpen();
    getDb()
      .prepare("INSERT INTO tag (name, created_at) VALUES (?, datetime('now'))")
      .run("Arrays");
    ensureDataFolderOpen();

    const tags = getDb().prepare("SELECT COUNT(*) AS c FROM tag").get() as { c: number };
    expect(tags.c).toBe(1);
  });

  it("switches to a different folder when the configured path changes", () => {
    const parent = makeTempDir();
    const first = path.join(parent, "First");
    const second = path.join(parent, "Second");

    process.env.LEETTRACK_DATA_DIR = first;
    ensureDataFolderOpen();
    getDb()
      .prepare("INSERT INTO tag (name, created_at) VALUES (?, datetime('now'))")
      .run("OnlyInFirst");

    process.env.LEETTRACK_DATA_DIR = second;
    ensureDataFolderOpen();

    const tags = getDb().prepare("SELECT COUNT(*) AS c FROM tag").get() as { c: number };
    expect(tags.c).toBe(0);
  });
});
