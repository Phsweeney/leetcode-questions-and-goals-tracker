import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { ProblemActions } from "@/components/ProblemActions";
import { RepeatModal } from "@/components/RepeatModal";
import { ReviewHistory } from "@/components/ReviewHistory";
import { getProblemDetail } from "@/lib/repos/problems";
import { formatLongDate, todayLocal } from "@/lib/dates";

export const dynamic = "force-dynamic";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-5">
      <h2 className="text-xs font-medium uppercase tracking-wide text-content-subtle">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ProseBlock({ text, fallback }: { text: string; fallback: string }) {
  if (text.trim().length === 0) {
    return <p className="text-sm text-content-subtle">{fallback}</p>;
  }
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-content">{text}</p>
  );
}

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const problem = getProblemDetail(Number(id));
  if (!problem) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/problems"
            className="text-xs text-content-muted transition-colors hover:text-accent"
          >
            Back to problems
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{problem.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge>{problem.platformName}</Badge>
            <DifficultyBadge difficulty={problem.difficulty} />
            <span className="text-sm text-content-muted">
              Completed {formatLongDate(problem.completedDate)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <RepeatModal
            problemId={problem.id}
            today={todayLocal()}
            minDate={problem.completedDate}
          />
          <ProblemActions id={problem.id} title={problem.title} />
        </div>
      </div>

      {problem.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {problem.tags.map((tag) => (
            <Badge key={tag.id} tone="accent">
              {tag.name}
            </Badge>
          ))}
        </div>
      ) : null}

      {problem.url ? (
        <Section title="Problem">
          <a
            href={problem.url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm font-medium text-accent hover:underline"
          >
            Open problem on {problem.platformName}
          </a>
        </Section>
      ) : null}

      <Section title="Summary">
        <ProseBlock
          text={problem.summary}
          fallback="No summary yet. Use Edit to add one."
        />
      </Section>

      <Section title="Notes">
        <ProseBlock text={problem.notes} fallback="No notes yet. Use Edit to add some." />
      </Section>

      <Section title={`Review history, ${problem.repeats.length + 1} entries`}>
        <ReviewHistory
          completedDate={problem.completedDate}
          repeats={problem.repeats}
        />
      </Section>
    </div>
  );
}
