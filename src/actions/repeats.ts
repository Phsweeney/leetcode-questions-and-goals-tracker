"use server";

import { revalidatePath } from "next/cache";
import { addRepeat, deleteRepeat, getRepeat } from "@/lib/repos/repeats";
import { getProblem } from "@/lib/repos/problems";
import { repeatInputSchema } from "@/lib/schemas";

export interface RepeatResultState {
  ok: boolean;
  error?: string;
}

function revalidateRepeatViews(problemId: number): void {
  revalidatePath(`/problems/${problemId}`);
  revalidatePath("/problems");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

export async function saveRepeat(input: {
  problemId: number;
  date: string;
  notes: string;
  result: string | null;
  durationMinutes: number | null;
}): Promise<RepeatResultState> {
  const parsed = repeatInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the repeat details." };
  }

  const problem = getProblem(parsed.data.problemId);
  if (!problem) {
    return { ok: false, error: "That problem no longer exists." };
  }

  if (parsed.data.date < problem.completedDate) {
    return { ok: false, error: "A repeat cannot happen before the original completion." };
  }

  addRepeat(parsed.data);
  revalidateRepeatViews(parsed.data.problemId);
  return { ok: true };
}

export async function removeRepeat(id: number): Promise<RepeatResultState> {
  const repeat = getRepeat(id);
  if (!repeat) {
    return { ok: false, error: "That repeat no longer exists." };
  }

  deleteRepeat(id);
  revalidateRepeatViews(repeat.problemId);
  return { ok: true };
}
