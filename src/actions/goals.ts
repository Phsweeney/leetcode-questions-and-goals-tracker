"use server";

import { revalidatePath } from "next/cache";
import { createGoal, deleteGoal, getGoal, updateGoal } from "@/lib/repos/goals";
import { goalInputSchema } from "@/lib/schemas";

export interface GoalActionResult {
  ok: boolean;
  error?: string;
}

export interface GoalFormValues {
  name: string;
  targetCount: string;
  startDate: string;
  endDate: string;
}

function revalidateGoalViews(): void {
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

function parse(values: GoalFormValues) {
  return goalInputSchema.safeParse({
    name: values.name,
    targetCount: values.targetCount,
    startDate: values.startDate,
    endDate: values.endDate,
  });
}

export async function addGoal(values: GoalFormValues): Promise<GoalActionResult> {
  const parsed = parse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the goal details." };
  }

  createGoal(parsed.data);
  revalidateGoalViews();
  return { ok: true };
}

export async function editGoal(
  id: number,
  values: GoalFormValues,
): Promise<GoalActionResult> {
  if (!getGoal(id)) {
    return { ok: false, error: "That goal no longer exists." };
  }

  const parsed = parse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the goal details." };
  }

  updateGoal(id, parsed.data);
  revalidateGoalViews();
  return { ok: true };
}

export async function removeGoal(id: number): Promise<GoalActionResult> {
  deleteGoal(id);
  revalidateGoalViews();
  return { ok: true };
}
