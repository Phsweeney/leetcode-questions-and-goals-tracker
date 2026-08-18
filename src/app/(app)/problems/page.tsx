import { PageHeader } from "@/components/PageHeader";
import { ProblemFilters } from "@/components/ProblemFilters";
import { ProblemsTable } from "@/components/ProblemsTable";
import { AddProblemButton } from "@/components/AddProblemButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { listProblems } from "@/lib/repos/problems";
import { listPlatforms } from "@/lib/repos/platforms";
import { listTags } from "@/lib/repos/tags";
import { hasActiveFilters, parseProblemQuery } from "@/lib/problemQuery";

export const dynamic = "force-dynamic";

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseProblemQuery(await searchParams);
  const problems = listProblems(query);
  const filtered = hasActiveFilters(query);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Problems"
        description="Everything you have completed, in one searchable list."
        actions={<AddProblemButton />}
      />

      <ProblemFilters
        query={query}
        platforms={listPlatforms()}
        tags={listTags()}
        resultCount={problems.length}
      />

      {problems.length === 0 ? (
        <EmptyState
          title={filtered ? "No problems match those filters" : "No problems yet"}
          description={
            filtered
              ? "Try clearing a filter or widening the date range."
              : "Add the first problem you have completed and it will show up here."
          }
          action={filtered ? undefined : <AddProblemButton />}
        />
      ) : (
        <ProblemsTable problems={problems} />
      )}
    </div>
  );
}
