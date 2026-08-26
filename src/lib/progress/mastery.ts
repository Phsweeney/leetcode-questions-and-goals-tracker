// A topic tile fills as you solve harder problems in it and come back to them.
// Hard problems and revisits both count for more than raw volume, so the tier
// reflects depth rather than how many easy problems share a tag.
export const MASTERY_WEIGHTS = { easy: 1, medium: 1.5, hard: 2, repeat: 0.5 } as const;

export const MASTERY_TIERS = [
  { name: "Untouched", min: 0 },
  { name: "Seen", min: 1 },
  { name: "Practiced", min: 8 },
  { name: "Strong", min: 20 },
  { name: "Mastered", min: 40 },
] as const;

export const MASTERED_TIER_INDEX = MASTERY_TIERS.length - 1;

export interface MasteryCounts {
  easy: number;
  medium: number;
  hard: number;
  unset: number;
  repeats: number;
}

export function masteryPoints(counts: MasteryCounts): number {
  return (
    counts.easy * MASTERY_WEIGHTS.easy +
    counts.medium * MASTERY_WEIGHTS.medium +
    counts.hard * MASTERY_WEIGHTS.hard +
    // A problem with no difficulty set still counts as practice.
    counts.unset * MASTERY_WEIGHTS.easy +
    counts.repeats * MASTERY_WEIGHTS.repeat
  );
}

export function tierIndexFor(points: number): number {
  let index = 0;
  for (let i = 0; i < MASTERY_TIERS.length; i += 1) {
    if (points >= MASTERY_TIERS[i].min) {
      index = i;
    }
  }
  return index;
}

export interface TagMastery extends MasteryCounts {
  id: number;
  name: string;
  solved: number;
  lastSolved: string | null;
  points: number;
  tierIndex: number;
  tier: string;
  nextTier: string | null;
  pointsIntoTier: number;
  pointsForTier: number;
  percent: number;
}

export function describeMastery(
  input: { id: number; name: string; solved: number; lastSolved: string | null } & MasteryCounts,
): TagMastery {
  const points = masteryPoints(input);
  const tierIndex = tierIndexFor(points);
  const tier = MASTERY_TIERS[tierIndex];
  const next = MASTERY_TIERS[tierIndex + 1] ?? null;

  const pointsIntoTier = points - tier.min;
  const pointsForTier = next ? next.min - tier.min : 0;

  return {
    ...input,
    points,
    tierIndex,
    tier: tier.name,
    nextTier: next?.name ?? null,
    pointsIntoTier,
    pointsForTier,
    percent: next
      ? Math.min(100, Math.max(0, Math.round((pointsIntoTier / pointsForTier) * 100)))
      : 100,
  };
}
