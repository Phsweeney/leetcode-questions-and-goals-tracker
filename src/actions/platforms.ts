"use server";

import { revalidatePath } from "next/cache";
import { createPlatform, findPlatformByName } from "@/lib/repos/platforms";
import { platformNameSchema } from "@/lib/schemas";
import type { Platform } from "@/lib/types";

export interface PlatformResult {
  ok: boolean;
  error?: string;
  platform?: Platform;
}

export async function addPlatform(name: string): Promise<PlatformResult> {
  const parsed = platformNameSchema.safeParse(name);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid platform name." };
  }

  if (findPlatformByName(parsed.data)) {
    return { ok: false, error: "That platform already exists." };
  }

  const platform = createPlatform(parsed.data);
  revalidatePath("/problems");
  return { ok: true, platform };
}
