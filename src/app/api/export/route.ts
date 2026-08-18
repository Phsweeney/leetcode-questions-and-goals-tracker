import { getConfiguredDataDir } from "@/lib/config";
import { backupFileName, createBackup } from "@/lib/fs/backup";
import { todayLocal } from "@/lib/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const dataDir = getConfiguredDataDir();
  if (!dataDir) {
    return new Response("No data folder is configured.", { status: 400 });
  }

  let archive: Uint8Array;
  try {
    archive = createBackup(dataDir);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not build the backup.";
    return new Response(message, { status: 400 });
  }

  const fileName = backupFileName(todayLocal());

  return new Response(archive as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(archive.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
