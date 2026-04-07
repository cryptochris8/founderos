"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getProjects } from "@/lib/firebase/projects";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { enrichProjectWithScore } from "@/lib/scoring";
import type { Project, ProjectStage, ProjectPriority } from "@/types";
import { PROJECT_STAGES, PROJECT_PRIORITIES } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StageBadge } from "@/components/projects/StageBadge";
import { PriorityBadge } from "@/components/projects/PriorityBadge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { CardSkeleton } from "@/components/shared/Skeleton";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [view, setView] = useState<"grid" | "table">("grid");

  useEffect(() => {
    if (!user) return;
    getProjects(user.uid).then(ps => {
      setProjects(ps.map(enrichProjectWithScore));
      setLoading(false);
    });
  }, [user]);

  const filtered = projects.filter(p => {
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.shortDescription?.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === "all" || p.stage === stageFilter;
    const matchesPriority = priorityFilter === "all" || p.priority === priorityFilter;
    return matchesSearch && matchesStage && matchesPriority;
  });

  return (
    <AppLayout>
      <TopBar title="Projects" searchValue={search} onSearchChange={setSearch} showNewProject />
      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={stageFilter} onValueChange={(v) => setStageFilter(v ?? "all")}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {PROJECT_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v ?? "all")}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {PROJECT_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-1">
            <Button variant={view === "grid" ? "default" : "ghost"} size="icon" onClick={() => setView("grid")}><LayoutGrid className="h-4 w-4" /></Button>
            <Button variant={view === "table" ? "default" : "ghost"} size="icon" onClick={() => setView("table")}><List className="h-4 w-4" /></Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{filtered.length} project{filtered.length !== 1 ? "s" : ""}</p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>No projects found.</p>
            {!search && stageFilter === "all" && (
              <Link href="/projects/new"><Button className="mt-4">Create your first project</Button></Link>
            )}
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stage</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Priority</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Progress</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Next Action</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Focus</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/projects/${p.id}`} className="font-medium hover:text-primary transition-colors">{p.title}</Link>
                      <p className="text-xs text-muted-foreground line-clamp-1">{p.shortDescription}</p>
                    </td>
                    <td className="px-4 py-3"><StageBadge stage={p.stage} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={p.priority} /></td>
                    <td className="px-4 py-3 w-32">
                      <div className="flex items-center gap-2">
                        <Progress value={p.percentComplete} className="h-1.5 w-16" />
                        <span className="text-xs text-muted-foreground">{p.percentComplete}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-48">
                      <span className="text-xs text-muted-foreground line-clamp-1">{p.nextAction || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-primary">{p.focusScore || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
