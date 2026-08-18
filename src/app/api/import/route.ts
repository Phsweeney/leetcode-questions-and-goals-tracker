import { revalidatePath } from "next/cache";
import { isDataDirLockedByEnv, setConfiguredDataDir } from "@/lib/config";
import { restoreBackup } from "@/lib/fs/backup";
import { openDataFolder } from "@/lib/fs/dataFolder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (isDataDirLockedByEnv()) {
    return Response.json(
      { ok: false, error: "The data folder is fixed by the LEETTRACK_DATA_DIR environment variable." },
      { status: 400 },
    );
  }

  const form = await request.formData();
  const file = form.get("archive");
  const targetPath = form.get("targetPath");

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ ok: false, error: "Choose a backup zip file." }, { status: 400 });
  }
  if (typeof targetPath !== "string" || targetPath.trim().length === 0) {
    return Response.json({ ok: false, error: "Choose a target folder." }, { status: 400 });
  }

  const archive = new Uint8Array(await file.arrayBuffer());
  const outcome = restoreBackup(archive, targetPath);
  if (!outcome.ok) {
    return Response.json({ ok: false, error: outcome.error }, { status: 400 });
  }

  try {
    openDataFolder(targetPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not open the restored folder.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }

  setConfiguredDataDir(targetPath);
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
