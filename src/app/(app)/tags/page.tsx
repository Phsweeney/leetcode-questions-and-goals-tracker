import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default function TagsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tags" />
      <EmptyState title="Nothing here yet" />
    </div>
  );
}
