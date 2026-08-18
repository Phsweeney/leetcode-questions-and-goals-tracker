import { db } from "@/lib/db";
import { toRepeat } from "./problems";
import type { RepeatInput } from "@/lib/schemas";
import type { Repeat } from "@/lib/types";

interface RepeatRow {
  id: number;
  problem_id: number;
  date: string;
  notes: string;
  result: Repeat["result"];
  duration_minutes: number | null;
  created_at: string;
}

const SELECT_REPEAT = `
  SELECT id, problem_id, date, notes, result, duration_minutes, created_at
  FROM repeat
`;

export function listRepeatsForProblem(problemId: number): Repeat[] {
  return (
    db()
      .prepare(`${SELECT_REPEAT} WHERE problem_id = ? ORDER BY date ASC, id ASC`)
      .all(problemId) as RepeatRow[]
  ).map(toRepeat);
}

export function getRepeat(id: number): Repeat | null {
  const row = db().prepare(`${SELECT_REPEAT} WHERE id = ?`).get(id) as
    | RepeatRow
    | undefined;
  return row ? toRepeat(row) : null;
}

export function addRepeat(input: RepeatInput): number {
  const info = db()
    .prepare(
      `INSERT INTO repeat (problem_id, date, notes, result, duration_minutes, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    )
    .run(
      input.problemId,
      input.date,
      input.notes,
      input.result,
      input.durationMinutes,
    );
  return Number(info.lastInsertRowid);
}

export function deleteRepeat(id: number): void {
  db().prepare("DELETE FROM repeat WHERE id = ?").run(id);
}

export function countRepeats(): number {
  const row = db().prepare("SELECT COUNT(*) AS count FROM repeat").get() as {
    count: number;
  };
  return row.count;
}

export function countRepeatedProblems(): number {
  const row = db()
    .prepare("SELECT COUNT(DISTINCT problem_id) AS count FROM repeat")
    .get() as { count: number };
  return row.count;
}
