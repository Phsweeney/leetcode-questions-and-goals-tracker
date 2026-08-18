import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
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

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
