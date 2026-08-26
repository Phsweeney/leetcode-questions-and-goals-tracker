"use server";

import { revalidatePath } from "next/cache";
import { markAllSeen, markSeen } from "@/lib/repos/achievements";
import { clearPendingCelebration } from "@/lib/repos/celebration";

// Called once the overlay has actually been shown. Deleting the row is what
// stops it re-appearing on the next render.
export async function dismissCelebration(keys: string[]): Promise<void> {
  markSeen(keys, new Date().toISOString());
  clearPendingCelebration();
  revalidatePath("/progress");
}

export async function acknowledgeAchievements(): Promise<void> {
  markAllSeen(new Date().toISOString());
  revalidatePath("/progress");
}
