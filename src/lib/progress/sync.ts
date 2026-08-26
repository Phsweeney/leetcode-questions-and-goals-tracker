import { todayLocal } from "@/lib/dates";
import { countUnlocked, insertUnlocked } from "@/lib/repos/achievements";
import { setPendingCelebration } from "@/lib/repos/celebration";
import { buildSnapshot } from "@/lib/repos/progress";
import { evaluateAchievements } from "./achievements";
import { describeLevel } from "./xp";
import type { AchievementSnapshot } from "./snapshot";

export interface SyncResult {
  snapshot: AchievementSnapshot;
  // Empty on a backfill: those badges are revealed once on /progress instead of
  // firing a backlog of overlays.
  newlyUnlocked: string[];
  backfilled: boolean;
}

// Runs after every mutation. Badges are never revoked, so this only ever adds.
export function syncAchievements(today: string = todayLocal()): SyncResult {
  const snapshot = buildSnapshot(today);
  const satisfied = evaluateAchievements(snapshot);

  // The first sync against a log that already has history is a backfill: the
  // user earned those badges before the feature existed. A brand-new log with a
  // single problem has nothing to backfill, so it celebrates normally.
  const backfilled = countUnlocked() === 0 && snapshot.totalProblems > 1;

  const newlyUnlocked = insertUnlocked(satisfied, new Date().toISOString(), false);

  return {
    snapshot,
    newlyUnlocked: backfilled ? [] : newlyUnlocked,
    backfilled,
  };
}

export function recordCelebration(input: {
  kind: "problem" | "repeat";
  title: string;
  xpGained: number;
  snapshot: AchievementSnapshot;
  unlockedKeys: string[];
}): void {
  // The level before the action is the current total minus what was just
  // earned, so nothing has to be measured ahead of the write.
  const before = describeLevel(Math.max(0, input.snapshot.xpTotal - input.xpGained));
  const after = describeLevel(input.snapshot.xpTotal);

  setPendingCelebration({
    createdAt: new Date().toISOString(),
    kind: input.kind,
    title: input.title,
    xpGained: input.xpGained,
    xpTotal: input.snapshot.xpTotal,
    levelBefore: before.level,
    levelAfter: after.level,
    streak: input.snapshot.currentStreak,
    unlockedKeys: input.unlockedKeys,
  });
}

export function syncAndCelebrate(input: {
  kind: "problem" | "repeat";
  title: string;
  xpGained: number;
}): SyncResult {
  const result = syncAchievements();
  recordCelebration({ ...input, snapshot: result.snapshot, unlockedKeys: result.newlyUnlocked });
  return result;
}
