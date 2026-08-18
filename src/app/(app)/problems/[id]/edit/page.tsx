import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { ProblemForm } from "@/components/ProblemForm";
import { saveExistingProblem } from "@/actions/problems";
import { getProblemDetail } from "@/lib/repos/problems";
import { listPlatforms } from "@/lib/repos/platforms";
import { listTags } from "@/lib/repos/tags";
import { todayLocal } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function EditProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const problem = getProblemDetail(Number(id));
  if (!problem) {
    notFound();
  }

  const save = saveExistingProblem.bind(null, problem.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Edit problem" description={problem.title} />
      <ProblemForm
        action={save}
        platforms={listPlatforms()}
        tags={listTags()}
        problem={problem}
        defaultCompletedDate={todayLocal()}
        submitLabel="Save changes"
        cancelHref={`/problems/${problem.id}`}
      />
    </div>
  );
}
