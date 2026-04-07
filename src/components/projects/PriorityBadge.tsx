import type { ProjectPriority } from "@/types";
import { cn } from "@/lib/utils/cn";

const priorityColorMap: Record<ProjectPriority, string> = {
  "Low": "bg-slate-500/20 text-slate-400 border-slate-500/30",
  "Medium": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "High": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Critical": "bg-red-500/20 text-red-400 border-red-500/30",
};

export function PriorityBadge({ priority }: { priority: ProjectPriority }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", priorityColorMap[priority])}>
      {priority}
    </span>
  );
}
