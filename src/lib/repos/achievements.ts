import { db } from "@/lib/db";

export interface UnlockedAchievement {
  key: string;
  unlockedAt: string;
  seenAt: string | null;
}

interface Row {
  key: string;
  unlocked_at: string;
  seen_at: string | null;
}

function toAchievement(row: Row): UnlockedAchievement {
  return { key: row.key, unlockedAt: row.unlocked_at, seenAt: row.seen_at };
}

export function listUnlocked(): UnlockedAchievement[] {
  const rows = db()
    .prepare("SELECT key, unlocked_at, seen_at FROM achievement ORDER BY unlocked_at DESC, key")
    .all() as Row[];
  return rows.map(toAchievement);
}

export function listUnseen(): UnlockedAchievement[] {
  const rows = db()
    .prepare(
      "SELECT key, unlocked_at, seen_at FROM achievement WHERE seen_at IS NULL ORDER BY unlocked_at, key",
    )
    .all() as Row[];
  return rows.map(toAchievement);
}

export function countUnlocked(): number {
  const row = db().prepare("SELECT COUNT(*) AS count FROM achievement").get() as {
    count: number;
  };
  return row.count;
}

// Returns only the keys that were genuinely new, which is what the celebration
// overlay announces. Badges are never revoked, so existing rows are left alone.
export function insertUnlocked(keys: string[], now: string, seen: boolean): string[] {
  if (keys.length === 0) {
    return [];
  }

  const insert = db().prepare(
    "INSERT OR IGNORE INTO achievement (key, unlocked_at, seen_at) VALUES (?, ?, ?)",
  );

  return db().transaction((candidates: string[]) => {
    const inserted: string[] = [];
    for (const key of candidates) {
      if (insert.run(key, now, seen ? now : null).changes > 0) {
        inserted.push(key);
      }
    }
    return inserted;
  })(keys);
}

export function markSeen(keys: string[], now: string): void {
  if (keys.length === 0) {
    return;
  }

  const update = db().prepare(
    "UPDATE achievement SET seen_at = ? WHERE key = ? AND seen_at IS NULL",
  );

  db().transaction((candidates: string[]) => {
    for (const key of candidates) {
      update.run(now, key);
    }
  })(keys);
}

export function markAllSeen(now: string): void {
  db().prepare("UPDATE achievement SET seen_at = ? WHERE seen_at IS NULL").run(now);
}
