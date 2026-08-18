import { cn } from "@/lib/cn";

export function Badge({
  children,
  className,
  tone = "neutral",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "neutral" | "accent" | "easy" | "medium" | "hard";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-surface-sunken text-content-muted border-border",
    accent: "bg-accent-soft text-accent border-transparent",
    easy: "bg-transparent text-easy border-easy/40",
    medium: "bg-transparent text-medium border-medium/40",
    hard: "bg-transparent text-hard border-hard/40",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
