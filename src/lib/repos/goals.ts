import { db } from "@/lib/db";
import { daysBetween } from "@/lib/dates";
import type { GoalInput } from "@/lib/schemas";
import type { Goal, GoalWithProgress } from "@/lib/types";

interface GoalRow {
  id: number;
  name: string;
  target_count: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface GoalProgressRow extends GoalRow {
  completed_count: number;
}

function toGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    name: row.name,
    targetCount: row.target_count,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
  };
}

// Progress counts original completions inside the goal window. Repeats of an
// older problem do not move a goal forward.
const SELECT_WITH_PROGRESS = `
  SELECT g.id, g.name, g.target_count, g.start_date, g.end_date, g.created_at,
         (SELECT COUNT(*) FROM problem p
          WHERE p.completed_date >= g.start_date AND p.completed_date <= g.end_date)
         AS completed_count
  FROM goal g
`;

function toGoalWithProgress(row: GoalProgressRow, today: string): GoalWithProgress {
  const goal = toGoal(row);
  const completedCount = row.completed_count;
  const remainingCount = Math.max(goal.targetCount - completedCount, 0);
  const percentComplete = Math.min(
    100,
    Math.round((completedCount / goal.targetCount) * 100),
  );

  return {
    ...goal,
    completedCount,
    remainingCount,
    percentComplete,
    daysRemaining: daysBetween(today, goal.endDate),
    isActive: today <= goal.endDate,
  };
}

export function listGoals(today: string): GoalWithProgress[] {
  const rows = db()
    .prepare(`${SELECT_WITH_PROGRESS} ORDER BY g.end_date ASC, g.id ASC`)
    .all() as GoalProgressRow[];
  return rows.map((row) => toGoalWithProgress(row, today));
}

export function listActiveGoals(today: string): GoalWithProgress[] {
  return listGoals(today).filter((goal) => goal.isActive);
}

export function getGoal(id: number): Goal | null {
  const row = db()
    .prepare(
      "SELECT id, name, target_count, start_date, end_date, created_at FROM goal WHERE id = ?",
    )
    .get(id) as GoalRow | undefined;
  return row ? toGoal(row) : null;
}

export function createGoal(input: GoalInput): number {
  const info = db()
    .prepare(
      `INSERT INTO goal (name, target_count, start_date, end_date, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
    )
    .run(input.name, input.targetCount, input.startDate, input.endDate);
  return Number(info.lastInsertRowid);
}

export function updateGoal(id: number, input: GoalInput): void {
  db()
    .prepare(
      `UPDATE goal SET name = ?, target_count = ?, start_date = ?, end_date = ?
       WHERE id = ?`,
    )
    .run(input.name, input.targetCount, input.startDate, input.endDate, id);
}

export function deleteGoal(id: number): void {
  db().prepare("DELETE FROM goal WHERE id = ?").run(id);
}
