import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default function ProblemsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Problems" />
      <EmptyState title="Nothing here yet" />
    </div>
  );
}
