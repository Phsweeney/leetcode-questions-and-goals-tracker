import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { CelebrationHost } from "@/components/progress/CelebrationHost";
import { getPendingCelebration } from "@/lib/repos/celebration";
import { ensureDataFolderOpen, getDataFolderStatus } from "@/lib/fs/dataFolder";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const status = getDataFolderStatus();
  if (!status.isReady) {
    redirect("/setup");
  }
  ensureDataFolderOpen();

  // A single primary-key lookup. Reading it here means the overlay finds its
  // payload wherever the user lands after a mutation, redirect included.
  const celebration = getPendingCelebration();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
      <CelebrationHost pending={celebration} />
    </div>
  );
}
