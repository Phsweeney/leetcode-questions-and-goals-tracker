import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { formatShortDate } from "@/lib/dates";
import type { ProblemListItem } from "@/lib/types";

export function ProblemsTable({ problems }: { problems: ProblemListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface-raised">
      <table className="w-full min-w-[52rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-content-subtle">
            <th className="px-5 py-3 font-medium">Problem</th>
            <th className="px-5 py-3 font-medium">Platform</th>
            <th className="px-5 py-3 font-medium">Difficulty</th>
            <th className="px-5 py-3 font-medium">Tags</th>
            <th className="px-5 py-3 font-medium">Completed</th>
            <th className="px-5 py-3 text-right font-medium">Repeats</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {problems.map((problem) => (
            <tr key={problem.id} className="group transition-colors hover:bg-surface-sunken">
              <td className="px-5 py-3">
                <Link
                  href={`/problems/${problem.id}`}
                  className="font-medium text-content group-hover:text-accent"
                >
                  {problem.title}
                </Link>
              </td>
              <td className="px-5 py-3 text-content-muted">{problem.platformName}</td>
              <td className="px-5 py-3">
                <DifficultyBadge difficulty={problem.difficulty} />
              </td>
              <td className="px-5 py-3">
                <div className="flex flex-wrap gap-1">
                  {problem.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag.id}>{tag.name}</Badge>
                  ))}
                  {problem.tags.length > 3 ? (
                    <Badge>+{problem.tags.length - 3}</Badge>
                  ) : null}
                </div>
              </td>
              <td className="px-5 py-3 whitespace-nowrap text-content-muted">
                {formatShortDate(problem.completedDate)}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-content-muted">
                {problem.repeatCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
