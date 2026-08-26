import { db } from "@/lib/db";
import {
  addDays,
  calculateStreak,
  longestGap,
  longestStreak,
  startOfWeek,
} from "@/lib/dates";
import {
  describeLevel,
  problemXp,
  repeatXp,
  type DifficultyCounts,
  type LevelInfo,
  type RepeatCounts,
} from "@/lib/progress/xp";
import {
  describeMastery,
  MASTERED_TIER_INDEX,
  type TagMastery,
} from "@/lib/progress/mastery";
import { emptySnapshot, type AchievementSnapshot } from "@/lib/progress/snapshot";
import type { DayActivity, Difficulty, RepeatResult } from "@/lib/types";

// 53 weeks of columns, so the heatmap always shows a full year plus the partial
// current week rather than cutting off mid-column.
const HEATMAP_WEEKS = 53;
const MOMENTUM_WEEKS = 26;
const COMEBACK_GAP_DAYS = 7;

interface ProblemDay {
  date: string;
  difficulty: Difficulty | null;
}

interface RepeatDay {
  date: string;
  problemId: number;
  result: RepeatResult | null;
  minutes: number | null;
}

// The whole snapshot is built from two skinny table scans rather than a query
// per statistic: two columns per row stays cheap well past any realistic log,
// and everything downstream is then guaranteed to agree with itself.
function listProblemDays(): ProblemDay[] {
  return db()
    .prepare("SELECT completed_date AS date, difficulty FROM problem")
    .all() as ProblemDay[];
}

function listRepeatDays(): RepeatDay[] {
  const rows = db()
    .prepare(
      "SELECT date, problem_id, result, duration_minutes FROM repeat",
    )
    .all() as Array<{
    date: string;
    problem_id: number;
    result: RepeatResult | null;
    duration_minutes: number | null;
  }>;

  return rows.map((row) => ({
    date: row.date,
    problemId: row.problem_id,
    result: row.result,
    minutes: row.duration_minutes,
  }));
}

interface TagMasteryRow {
  id: number;
  name: string;
  solved: number;
  easy: number | null;
  medium: number | null;
  hard: number | null;
  unset: number | null;
  repeats: number;
  last_solved: string | null;
}

export function listTagMastery(): TagMastery[] {
  const rows = db()
    .prepare(
      `SELECT t.id, t.name,
              COUNT(DISTINCT p.id)                    AS solved,
              SUM(p.difficulty = 'Easy')              AS easy,
              SUM(p.difficulty = 'Medium')            AS medium,
              SUM(p.difficulty = 'Hard')              AS hard,
              SUM(p.id IS NOT NULL AND p.difficulty IS NULL) AS unset,
              MAX(p.completed_date)                   AS last_solved,
              (SELECT COUNT(*) FROM repeat r
                 JOIN problem_tag pt2 ON pt2.problem_id = r.problem_id
                WHERE pt2.tag_id = t.id)              AS repeats
       FROM tag t
       LEFT JOIN problem_tag pt ON pt.tag_id = t.id
       LEFT JOIN problem p      ON p.id = pt.problem_id
       GROUP BY t.id
       ORDER BY solved DESC, t.name COLLATE NOCASE`,
    )
    .all() as TagMasteryRow[];

  return rows.map((row) =>
    describeMastery({
      id: row.id,
      name: row.name,
      solved: row.solved,
      lastSolved: row.last_solved,
      easy: row.easy ?? 0,
      medium: row.medium ?? 0,
      hard: row.hard ?? 0,
      unset: row.unset ?? 0,
      repeats: row.repeats,
    }),
  );
}

// A goal counts as met on the same window basis GoalWithProgress already uses.
export function countGoalsCompleted(): number {
  const row = db()
    .prepare(
      `SELECT COUNT(*) AS count FROM goal g
        WHERE (SELECT COUNT(*) FROM problem p
                WHERE p.completed_date >= g.start_date
                  AND p.completed_date <= g.end_date) >= g.target_count`,
    )
    .get() as { count: number };
  return row.count;
}

function countBy<T>(items: T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

function maxValue(counts: Map<string, number>): number {
  let max = 0;
  for (const value of counts.values()) {
    if (value > max) {
      max = value;
    }
  }
  return max;
}

function longestWeekRun(weekStarts: Iterable<string>): number {
  const weeks = [...new Set(weekStarts)].sort();
  let longest = 0;
  let run = 0;
  let previous: string | null = null;

  for (const week of weeks) {
    run = previous !== null && addDays(previous, 7) === week ? run + 1 : 1;
    previous = week;
    if (run > longest) {
      longest = run;
    }
  }

  return longest;
}

export interface WeekBucket {
  weekStart: string;
  easy: number;
  medium: number;
  hard: number;
  unset: number;
  total: number;
}

export interface PersonalRecords {
  bestDay: { date: string; count: number } | null;
  bestWeek: { weekStart: string; count: number } | null;
  longestStreak: number;
  topTag: { name: string; solved: number } | null;
  totalMinutes: number;
  cleanRecallPercent: number | null;
}

export interface ProgressOverview {
  level: LevelInfo;
  snapshot: AchievementSnapshot;
  year: DayActivity[];
  heatmapStart: string;
  tags: TagMastery[];
  weeks: WeekBucket[];
  records: PersonalRecords;
}

interface Derived {
  snapshot: AchievementSnapshot;
  problems: ProblemDay[];
  repeats: RepeatDay[];
  tags: TagMastery[];
  bestDay: { date: string; count: number } | null;
  bestWeek: { weekStart: string; count: number } | null;
}

function derive(today: string): Derived {
  const problems = listProblemDays();
  const repeats = listRepeatDays();
  const tags = listTagMastery();
  const goalsCompleted = countGoalsCompleted();

  const snapshot = emptySnapshot(today);
  snapshot.totalProblems = problems.length;
  snapshot.totalRepeats = repeats.length;
  snapshot.goalsCompleted = goalsCompleted;

  const byDifficulty: DifficultyCounts = { Easy: 0, Medium: 0, Hard: 0, Unset: 0 };
  for (const problem of problems) {
    byDifficulty[problem.difficulty ?? "Unset"] += 1;
  }
  snapshot.byDifficulty = byDifficulty;

  const repeatsByResult: RepeatCounts = { easy: 0, struggled: 0, failed: 0, unset: 0 };
  let totalMinutes = 0;
  for (const repeat of repeats) {
    repeatsByResult[repeat.result ?? "unset"] += 1;
    totalMinutes += repeat.minutes ?? 0;
  }
  snapshot.repeatsByResult = repeatsByResult;
  snapshot.totalMinutes = totalMinutes;

  snapshot.problemsRepeatedAtLeast3 = [
    ...countBy(repeats, (repeat) => String(repeat.problemId)).values(),
  ].filter((count) => count >= 3).length;

  const perDay = countBy(problems, (problem) => problem.date);
  snapshot.bestDayCount = maxValue(perDay);

  const perWeek = countBy(problems, (problem) => startOfWeek(problem.date));
  snapshot.bestWeekCount = maxValue(perWeek);

  const hardPerWeek = countBy(
    problems.filter((problem) => problem.difficulty === "Hard"),
    (problem) => startOfWeek(problem.date),
  );
  snapshot.hardestWeekCount = maxValue(hardPerWeek);

  // A day is active when either an original completion or a repeat lands on it,
  // matching how the dashboard and calendar already define activity.
  const activeDates = new Set<string>();
  for (const problem of problems) {
    activeDates.add(problem.date);
  }
  for (const repeat of repeats) {
    activeDates.add(repeat.date);
  }

  snapshot.activeDays = activeDates.size;
  snapshot.currentStreak = calculateStreak(activeDates, today);
  snapshot.longestStreak = longestStreak(activeDates);
  snapshot.hadComeback = longestGap(activeDates) >= COMEBACK_GAP_DAYS;
  snapshot.weeksActiveInARow = longestWeekRun(
    [...activeDates].map((date) => startOfWeek(date)),
  );

  const solvedTags = tags.filter((tag) => tag.solved > 0);
  snapshot.distinctTags = solvedTags.length;
  snapshot.maxProblemsInOneTag = solvedTags.reduce(
    (max, tag) => Math.max(max, tag.solved),
    0,
  );
  snapshot.masteredTags = tags.filter(
    (tag) => tag.tierIndex === MASTERED_TIER_INDEX,
  ).length;

  snapshot.xpTotal = problemXp(byDifficulty) + repeatXp(repeatsByResult);

  function best(counts: Map<string, number>): { key: string; count: number } | null {
    let bestKey: string | null = null;
    let bestCount = 0;
    for (const [key, count] of counts) {
      if (count > bestCount || (count === bestCount && bestKey !== null && key > bestKey)) {
        bestKey = key;
        bestCount = count;
      }
    }
    return bestKey === null ? null : { key: bestKey, count: bestCount };
  }

  const bestDayEntry = best(perDay);
  const bestWeekEntry = best(perWeek);

  return {
    snapshot,
    problems,
    repeats,
    tags,
    bestDay: bestDayEntry && { date: bestDayEntry.key, count: bestDayEntry.count },
    bestWeek: bestWeekEntry && {
      weekStart: bestWeekEntry.key,
      count: bestWeekEntry.count,
    },
  };
}

export function buildSnapshot(today: string): AchievementSnapshot {
  return derive(today).snapshot;
}

function buildYear(
  problems: ProblemDay[],
  repeats: RepeatDay[],
  from: string,
  to: string,
): DayActivity[] {
  const byDate = new Map<string, DayActivity>();

  function slot(date: string): DayActivity {
    let entry = byDate.get(date);
    if (!entry) {
      entry = { date, completions: 0, repeats: 0 };
      byDate.set(date, entry);
    }
    return entry;
  }

  for (const problem of problems) {
    if (problem.date >= from && problem.date <= to) {
      slot(problem.date).completions += 1;
    }
  }
  for (const repeat of repeats) {
    if (repeat.date >= from && repeat.date <= to) {
      slot(repeat.date).repeats += 1;
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function buildWeeks(problems: ProblemDay[], today: string): WeekBucket[] {
  const currentWeek = startOfWeek(today);
  const buckets: WeekBucket[] = [];
  const index = new Map<string, WeekBucket>();

  for (let offset = MOMENTUM_WEEKS - 1; offset >= 0; offset -= 1) {
    const weekStart = addDays(currentWeek, -7 * offset);
    const bucket: WeekBucket = {
      weekStart,
      easy: 0,
      medium: 0,
      hard: 0,
      unset: 0,
      total: 0,
    };
    buckets.push(bucket);
    index.set(weekStart, bucket);
  }

  for (const problem of problems) {
    const bucket = index.get(startOfWeek(problem.date));
    if (!bucket) {
      continue;
    }
    switch (problem.difficulty) {
      case "Easy":
        bucket.easy += 1;
        break;
      case "Medium":
        bucket.medium += 1;
        break;
      case "Hard":
        bucket.hard += 1;
        break;
      default:
        bucket.unset += 1;
    }
    bucket.total += 1;
  }

  return buckets;
}

export function getProgressOverview(today: string): ProgressOverview {
  const { snapshot, problems, repeats, tags, bestDay, bestWeek } = derive(today);

  const heatmapStart = addDays(startOfWeek(today), -7 * (HEATMAP_WEEKS - 1));
  const gradedRepeats =
    snapshot.repeatsByResult.easy +
    snapshot.repeatsByResult.struggled +
    snapshot.repeatsByResult.failed;

  return {
    level: describeLevel(snapshot.xpTotal),
    snapshot,
    heatmapStart,
    year: buildYear(problems, repeats, heatmapStart, today),
    tags,
    weeks: buildWeeks(problems, today),
    records: {
      bestDay,
      bestWeek,
      longestStreak: snapshot.longestStreak,
      topTag: tags[0] && tags[0].solved > 0
        ? { name: tags[0].name, solved: tags[0].solved }
        : null,
      totalMinutes: snapshot.totalMinutes,
      cleanRecallPercent:
        gradedRepeats > 0
          ? Math.round((snapshot.repeatsByResult.easy / gradedRepeats) * 100)
          : null,
    },
  };
}
