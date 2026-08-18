import { PageHeader } from "@/components/PageHeader";
import { GoalManager } from "@/components/GoalManager";
import { listGoals } from "@/lib/repos/goals";
import { addMonths, endOfMonth, todayLocal } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default function GoalsPage() {
  const today = todayLocal();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals"
        description="Set a target and a deadline. Progress is calculated from the problems you complete."
      />
      <GoalManager
        goals={listGoals(today)}
        today={today}
        defaultEndDate={endOfMonth(addMonths(today, 3))}
      />
    </div>
  );
}
