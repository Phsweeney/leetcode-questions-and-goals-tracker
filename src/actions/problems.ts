"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProblem,
  deleteProblem,
  getProblem,
  updateProblem,
} from "@/lib/repos/problems";
import { problemInputSchema } from "@/lib/schemas";
import { DIFFICULTIES, type Difficulty } from "@/lib/types";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseDifficulty(value: FormDataEntryValue | null): Difficulty | null {
  const raw = typeof value === "string" ? value : "";
  return (DIFFICULTIES as readonly string[]).includes(raw) ? (raw as Difficulty) : null;
}

function readProblemForm(formData: FormData) {
  return problemInputSchema.safeParse({
    title: formData.get("title") ?? "",
    url: formData.get("url") ?? "",
    platformId: formData.get("platformId") ?? "",
    difficulty: parseDifficulty(formData.get("difficulty")),
    completedDate: formData.get("completedDate") ?? "",
    summary: formData.get("summary") ?? "",
    notes: formData.get("notes") ?? "",
    tagIds: formData.getAll("tagIds"),
  });
}

function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

function revalidateProblemViews(id?: number): void {
  revalidatePath("/problems");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/goals");
  revalidatePath("/tags");
  if (id) {
    revalidatePath(`/problems/${id}`);
  }
}

export async function saveNewProblem(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = readProblemForm(formData);
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const id = createProblem(parsed.data);
  revalidateProblemViews(id);
  redirect("/problems");
}

export async function saveExistingProblem(
  id: number,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!getProblem(id)) {
    return { error: "That problem no longer exists." };
  }

  const parsed = readProblemForm(formData);
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  updateProblem(id, parsed.data);
  revalidateProblemViews(id);
  redirect("/problems");
}

export async function removeProblem(id: number): Promise<void> {
  deleteProblem(id);
  revalidateProblemViews(id);
  redirect("/problems");
}
