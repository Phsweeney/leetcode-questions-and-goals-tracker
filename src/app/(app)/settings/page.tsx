import { PageHeader } from "@/components/PageHeader";
import { DataFolderSettings } from "@/components/DataFolderSettings";
import { getConfiguredDataDir, isDataDirLockedByEnv } from "@/lib/config";
import { readMetadata } from "@/lib/fs/dataFolder";
import { SCHEMA_VERSION } from "@/lib/db/migrations";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const dataDir = getConfiguredDataDir() ?? "";
  const metadata = readMetadata(dataDir);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Where your data lives and how to move or protect it."
      />
      <DataFolderSettings
        dataDir={dataDir}
        lockedByEnv={isDataDirLockedByEnv()}
        schemaVersion={metadata?.schemaVersion ?? SCHEMA_VERSION}
        createdAt={metadata?.createdAt ?? ""}
      />
    </div>
  );
}
