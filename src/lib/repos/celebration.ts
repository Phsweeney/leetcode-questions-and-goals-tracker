import { db } from "@/lib/db";

export interface CelebrationPayload {
  createdAt: string;
  kind: "problem" | "repeat";
  title: string;
  xpGained: number;
  xpTotal: number;
  levelBefore: number;
  levelAfter: number;
  streak: number;
  unlockedKeys: string[];
}

interface Row {
  created_at: string;
  kind: "problem" | "repeat";
  title: string;
  xp_gained: number;
  xp_total: number;
  level_before: number;
  level_after: number;
  streak: number;
  unlocked_keys: string;
}

function parseKeys(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === "string") : [];
  } catch {
    return [];
  }
}

// One row, replaced by each rewardable mutation and deleted once the overlay has
// shown it. A missing row simply means there is nothing to celebrate.
export function getPendingCelebration(): CelebrationPayload | null {
  const row = db()
    .prepare(
      `SELECT created_at, kind, title, xp_gained, xp_total,
              level_before, level_after, streak, unlocked_keys
       FROM celebration WHERE id = 1`,
    )
    .get() as Row | undefined;

  if (!row) {
    return null;
  }

  return {
    createdAt: row.created_at,
    kind: row.kind,
    title: row.title,
    xpGained: row.xp_gained,
    xpTotal: row.xp_total,
    levelBefore: row.level_before,
    levelAfter: row.level_after,
    streak: row.streak,
    unlockedKeys: parseKeys(row.unlocked_keys),
  };
}

export function setPendingCelebration(payload: CelebrationPayload): void {
  db()
    .prepare(
      `INSERT OR REPLACE INTO celebration
         (id, created_at, kind, title, xp_gained, xp_total,
          level_before, level_after, streak, unlocked_keys)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      payload.createdAt,
      payload.kind,
      payload.title,
      payload.xpGained,
      payload.xpTotal,
      payload.levelBefore,
      payload.levelAfter,
      payload.streak,
      JSON.stringify(payload.unlockedKeys),
    );
}

export function clearPendingCelebration(): void {
  db().prepare("DELETE FROM celebration WHERE id = 1").run();
}
