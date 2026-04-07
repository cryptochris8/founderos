"use client";
import { StageBadge } from "./StageBadge";
import { PriorityBadge } from "./PriorityBadge";
import { Progress } from "@/components/ui/progress";
import { calculateHealth, type HealthStatus } from "@/lib/scoring";
import type { Project } from "@/types";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const healthColors: Record<HealthStatus, string> = {
  green: "text-green-400",
  yellow: "text-yellow-400",
  red: "text-red-400",
};

const healthLabels: Record<HealthStatus, string> = {
  green: "Healthy",
  yellow: "Needs Attention",
  red: "At Risk",
};

export function ProjectStickyHeader({ project }: { project: Project }) {
  const health = calculateHealth(project);

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <h1 className="text-lg font-bold truncate">{project.title}</h1>
          <StageBadge stage={project.stage} />
          <PriorityBadge priority={project.priority} />
          <div className="hidden sm:flex items-center gap-1.5" title={health.reasons.join(", ")}>
            <Circle className={cn("h-2.5 w-2.5 fill-current", healthColors[health.status])} />
            <span className={cn("text-xs font-medium", healthColors[health.status])}>{healthLabels[health.status]}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {project.focusScore !== undefined && (
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Focus</span>
              <span className="text-sm font-bold text-primary">{project.focusScore}/10</span>
            </div>
          )}
          <div className="hidden md:flex items-center gap-2 min-w-[120px]">
            <Progress value={project.percentComplete} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground w-8 text-right">{project.percentComplete}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
