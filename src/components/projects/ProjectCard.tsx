import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StageBadge } from "./StageBadge";
import { PriorityBadge } from "./PriorityBadge";
import type { Project } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight } from "lucide-react";

export function ProjectCard({ project }: { project: Project }) {
  const updated = formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true });
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
        <CardContent className="pt-5 pb-4 flex flex-col h-full">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors line-clamp-1">
              {project.title}
            </h3>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
            {project.shortDescription}
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <StageBadge stage={project.stage} />
            <PriorityBadge priority={project.priority} />
          </div>
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{project.percentComplete}%</span>
            </div>
            <Progress value={project.percentComplete} className="h-1.5" />
          </div>
          {project.nextAction && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              <span className="text-foreground/60">Next: </span>{project.nextAction}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">Updated {updated}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
