import { db } from "@/lib/db";
import type { Platform } from "@/lib/types";

interface PlatformRow {
  id: number;
  name: string;
  created_at: string;
}

function toPlatform(row: PlatformRow): Platform {
  return { id: row.id, name: row.name, createdAt: row.created_at };
}

export function listPlatforms(): Platform[] {
  return (
    db()
      .prepare("SELECT id, name, created_at FROM platform ORDER BY name COLLATE NOCASE")
      .all() as PlatformRow[]
  ).map(toPlatform);
}

export function findPlatformByName(name: string): Platform | null {
  const row = db()
    .prepare("SELECT id, name, created_at FROM platform WHERE name = ? COLLATE NOCASE")
    .get(name.trim()) as PlatformRow | undefined;
  return row ? toPlatform(row) : null;
}

export function getPlatform(id: number): Platform | null {
  const row = db()
    .prepare("SELECT id, name, created_at FROM platform WHERE id = ?")
    .get(id) as PlatformRow | undefined;
  return row ? toPlatform(row) : null;
}

export function createPlatform(name: string): Platform {
  const trimmed = name.trim();
  const existing = findPlatformByName(trimmed);
  if (existing) {
    return existing;
  }

  const info = db()
    .prepare("INSERT INTO platform (name, created_at) VALUES (?, datetime('now'))")
    .run(trimmed);

  return {
    id: Number(info.lastInsertRowid),
    name: trimmed,
    createdAt: new Date().toISOString(),
  };
}

export function countProblemsForPlatform(id: number): number {
  const row = db()
    .prepare("SELECT COUNT(*) AS count FROM problem WHERE platform_id = ?")
    .get(id) as { count: number };
  return row.count;
}
