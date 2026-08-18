"use server";

import { revalidatePath } from "next/cache";
import {
  createTag,
  deleteTag,
  findTagByName,
  renameTag,
} from "@/lib/repos/tags";
import { tagNameSchema } from "@/lib/schemas";
import type { Tag } from "@/lib/types";

export interface TagResult {
  ok: boolean;
  error?: string;
  tag?: Tag;
}

function revalidateTagViews(): void {
  revalidatePath("/tags");
  revalidatePath("/problems");
  revalidatePath("/dashboard");
}

export async function addTag(name: string): Promise<TagResult> {
  const parsed = tagNameSchema.safeParse(name);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid tag name." };
  }

  if (findTagByName(parsed.data)) {
    return { ok: false, error: "That tag already exists." };
  }

  const tag = createTag(parsed.data);
  revalidateTagViews();
  return { ok: true, tag };
}

export async function editTag(id: number, name: string): Promise<TagResult> {
  const parsed = tagNameSchema.safeParse(name);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid tag name." };
  }

  const existing = findTagByName(parsed.data);
  if (existing && existing.id !== id) {
    return { ok: false, error: "Another tag already uses that name." };
  }

  renameTag(id, parsed.data);
  revalidateTagViews();
  return { ok: true };
}

export async function removeTag(id: number): Promise<TagResult> {
  deleteTag(id);
  revalidateTagViews();
  return { ok: true };
}
