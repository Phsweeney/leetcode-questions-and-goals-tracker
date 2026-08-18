import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Calendar" />
      <EmptyState title="Nothing here yet" />
    </div>
  );
}
