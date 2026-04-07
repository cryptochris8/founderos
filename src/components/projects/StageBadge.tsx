import { Badge } from "@/components/ui/badge";
import type { ProjectStage } from "@/types";

const stageVariantMap: Record<ProjectStage, "default" | "secondary" | "destructive" | "outline"> = {
  "Idea": "outline",
  "Researching": "secondary",
  "Planning": "secondary",
  "Designing": "secondary",
  "Ready for Build": "default",
  "Building": "default",
  "Testing": "default",
  "Launch Prep": "default",
  "Live": "default",
  "Paused": "outline",
  "Archived": "outline",
};

export function StageBadge({ stage }: { stage: ProjectStage }) {
  return <Badge variant={stageVariantMap[stage]}>{stage}</Badge>;
}
