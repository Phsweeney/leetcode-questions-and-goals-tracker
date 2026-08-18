import { redirect } from "next/navigation";
import path from "node:path";
import os from "node:os";
import { FolderBrowser } from "@/components/FolderBrowser";
import { getDataFolderStatus } from "@/lib/fs/dataFolder";

export const dynamic = "force-dynamic";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ change?: string }>;
}) {
  const { change } = await searchParams;
  const isChanging = change === "1";
  const status = getDataFolderStatus();

  if (status.isReady && !isChanging) {
    redirect("/dashboard");
  }

  const startPath = status.dataDir
    ? path.dirname(status.dataDir)
    : path.join(os.homedir(), "Documents");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-border bg-surface-raised p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isChanging ? "Change data folder" : "Welcome to LeetTrack"}
        </h1>
        <p className="mt-2 text-sm text-content-muted">
          Where should your data be stored? Pick an existing LeetTrack data folder to
          restore it, or create a new one. Everything lives in that folder, so you can copy
          it to another computer at any time.
        </p>

        {status.inspection && status.inspection.status !== "valid" && !isChanging ? (
          <p className="mt-4 rounded-lg border border-border bg-surface-sunken px-4 py-3 text-sm text-content-muted">
            The previously selected folder is no longer usable. Choose another one below.
          </p>
        ) : null}

        <div className="mt-6">
          <FolderBrowser initialPath={startPath} />
        </div>
      </div>
    </main>
  );
}
