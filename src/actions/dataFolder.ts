"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { setConfiguredDataDir, isDataDirLockedByEnv } from "@/lib/config";
import { inspectFolder, openDataFolder } from "@/lib/fs/dataFolder";
import { validateFolderName } from "@/lib/fs/folderName";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function createFolder(
  parentPath: string,
  name: string,
): Promise<ActionResult & { path?: string }> {
  const problem = validateFolderName(name);
  if (problem) {
    return { ok: false, error: problem };
  }

  const target = path.join(path.resolve(parentPath), name.trim());
  if (fs.existsSync(target)) {
    return { ok: false, error: "A folder with that name already exists here." };
  }

  try {
    fs.mkdirSync(target, { recursive: false });
  } catch {
    return { ok: false, error: "Could not create the folder. Check that you have permission." };
  }

  return { ok: true, path: target };
}

export async function useDataFolder(targetPath: string): Promise<ActionResult> {
  if (isDataDirLockedByEnv()) {
    return {
      ok: false,
      error: "The data folder is fixed by the LEETTRACK_DATA_DIR environment variable.",
    };
  }

  const resolved = path.resolve(targetPath);
  const inspection = inspectFolder(resolved);

  if (inspection.status === "not-a-data-folder") {
    return { ok: false, error: inspection.reason };
  }

  try {
    openDataFolder(resolved);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not open that data folder.",
    };
  }

  setConfiguredDataDir(resolved);
  revalidatePath("/", "layout");
  return { ok: true };
}
