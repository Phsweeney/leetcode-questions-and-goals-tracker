import { db } from "@/lib/db";
import { getTagsForProblem, setProblemTags } from "./tags";
import type { ProblemInput } from "@/lib/schemas";
import type { Difficulty, Problem, ProblemDetail, Repeat } from "@/lib/types";

export interface ProblemRow {
  id: number;
  title: string;
  url: string | null;
  platform_id: number;
  platform_name: string;
  difficulty: Difficulty | null;
  completed_date: string;
  summary: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export function toProblem(row: ProblemRow): Problem {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    platformId: row.platform_id,
    platformName: row.platform_name,
    difficulty: row.difficulty,
    completedDate: row.completed_date,
    summary: row.summary,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const PROBLEM_SELECT = `
  SELECT p.id, p.title, p.url, p.platform_id, pl.name AS platform_name, p.difficulty,
         p.completed_date, p.summary, p.notes, p.created_at, p.updated_at
  FROM problem p
  JOIN platform pl ON pl.id = p.platform_id
`;

export function getProblem(id: number): Problem | null {
  const row = db()
    .prepare(`${PROBLEM_SELECT} WHERE p.id = ?`)
    .get(id) as ProblemRow | undefined;
  return row ? toProblem(row) : null;
}

interface RepeatRow {
  id: number;
  problem_id: number;
  date: string;
  notes: string;
  result: Repeat["result"];
  duration_minutes: number | null;
  created_at: string;
}

export function toRepeat(row: RepeatRow): Repeat {
  return {
    id: row.id,
    problemId: row.problem_id,
    date: row.date,
    notes: row.notes,
    result: row.result,
    durationMinutes: row.duration_minutes,
    createdAt: row.created_at,
  };
}

export function getProblemDetail(id: number): ProblemDetail | null {
  const problem = getProblem(id);
  if (!problem) {
    return null;
  }

  const repeats = (
    db()
      .prepare(
        `SELECT id, problem_id, date, notes, result, duration_minutes, created_at
         FROM repeat WHERE problem_id = ? ORDER BY date ASC, id ASC`,
      )
      .all(id) as RepeatRow[]
  ).map(toRepeat);

  return { ...problem, tags: getTagsForProblem(id), repeats };
}

export function createProblem(input: ProblemInput): number {
  const database = db();

  return database.transaction(() => {
    const info = database
      .prepare(
        `INSERT INTO problem (title, url, platform_id, difficulty, completed_date, summary, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      )
      .run(
        input.title,
        input.url.length > 0 ? input.url : null,
        input.platformId,
        input.difficulty,
        input.completedDate,
        input.summary,
        input.notes,
      );

    const id = Number(info.lastInsertRowid);
    setProblemTags(id, input.tagIds);
    return id;
  })();
}

export function updateProblem(id: number, input: ProblemInput): void {
  const database = db();

  database.transaction(() => {
    database
      .prepare(
        `UPDATE problem
         SET title = ?, url = ?, platform_id = ?, difficulty = ?, completed_date = ?,
             summary = ?, notes = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .run(
        input.title,
        input.url.length > 0 ? input.url : null,
        input.platformId,
        input.difficulty,
        input.completedDate,
        input.summary,
        input.notes,
        id,
      );

    setProblemTags(id, input.tagIds);
  })();
}

export function deleteProblem(id: number): void {
  db().prepare("DELETE FROM problem WHERE id = ?").run(id);
}
