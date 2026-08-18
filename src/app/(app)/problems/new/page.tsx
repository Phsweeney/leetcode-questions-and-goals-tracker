import { PageHeader } from "@/components/PageHeader";
import { ProblemForm } from "@/components/ProblemForm";
import { saveNewProblem } from "@/actions/problems";
import { listPlatforms, findPlatformByName } from "@/lib/repos/platforms";
import { listTags } from "@/lib/repos/tags";
import { todayLocal } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function NewProblemPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
  const platforms = listPlatforms();
  const tags = listTags();
  const isLeetCode = kind !== "other";
  const defaultPlatform = isLeetCode ? findPlatformByName("LeetCode") : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isLeetCode ? "Add LeetCode problem" : "Add problem"}
        description="Record a problem you have already completed."
      />
      <ProblemForm
        action={saveNewProblem}
        platforms={platforms}
        tags={tags}
        defaultPlatformId={defaultPlatform?.id}
        defaultCompletedDate={todayLocal()}
        submitLabel="Save problem"
        cancelHref="/problems"
      />
    </div>
  );
}
