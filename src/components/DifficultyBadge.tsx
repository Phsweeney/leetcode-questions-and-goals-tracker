import { Badge } from "@/components/ui/Badge";
import type { Difficulty } from "@/lib/types";

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty | null }) {
  if (!difficulty) {
    return <span className="text-xs text-content-subtle">None</span>;
  }

  const tone = difficulty === "Easy" ? "easy" : difficulty === "Medium" ? "medium" : "hard";
  return <Badge tone={tone}>{difficulty}</Badge>;
}
