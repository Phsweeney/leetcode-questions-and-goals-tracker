import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { closeDatabase } from "@/lib/db/connection";
import { db } from "@/lib/db";
import { ensureDataFolderOpen } from "@/lib/fs/dataFolder";

const created: string[] = [];

export function useTempDataFolder(): string {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "leettrack-repo-"));
  created.push(parent);
  const dir = path.join(parent, "Data");
  process.env.LEETTRACK_DATA_DIR = dir;
  ensureDataFolderOpen();
  return dir;
}

export function cleanupTempDataFolders(): void {
  closeDatabase();
  delete process.env.LEETTRACK_DATA_DIR;
  while (created.length > 0) {
    const dir = created.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}

export function insertRepeat(
  problemId: number,
  date: string,
  notes = "",
  result: string | null = null,
  durationMinutes: number | null = null,
): number {
  const info = db()
    .prepare(
      `INSERT INTO repeat (problem_id, date, notes, result, duration_minutes, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    )
    .run(problemId, date, notes, result, durationMinutes);
  return Number(info.lastInsertRowid);
}
