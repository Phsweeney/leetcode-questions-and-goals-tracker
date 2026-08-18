export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface-raised px-6 py-14 text-center">
      <p className="text-sm font-medium text-content">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-sm text-sm text-content-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
