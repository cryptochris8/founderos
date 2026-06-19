"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getProjects } from "@/lib/firebase/projects";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { StatCard } from "@/components/shared/StatCard";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { enrichProjectWithScore, calculateHealth } from "@/lib/scoring";
import type { Project } from "@/types";
import {
  FolderOpen, Zap, FlaskConical, Rocket, Globe, AlertTriangle, Plus,
  Circle, Sparkles, Bot, Megaphone, Video, Images, Settings, BookTemplate, FileText,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/shared/Skeleton";
import { seedDemoProjects } from "@/lib/firebase/seed";

const QUICK_LINKS = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/templates", label: "Templates", icon: BookTemplate },
  { href: "/prompts", label: "Prompts", icon: Zap },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/assets", label: "Assets", icon: Images },
];

interface ProjectListCardProps {
  title: string;
  icon: typeof Zap;
  iconClass?: string;
  projects: Project[];
  emptyMessage: string;
  renderSubtitle?: (p: Project) => string;
  renderRight?: (p: Project) => ReactNode;
}

function ProjectListCard({
  title,
  icon: Icon,
  iconClass = "text-muted-foreground",
  projects,
  emptyMessage,
  renderSubtitle,
  renderRight,
}: ProjectListCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconClass}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{emptyMessage}</p>
        ) : (
          projects.map((p) => (
            <Link key={p.id} href={`/projects/view?id=${p.id}`}>
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {renderSubtitle ? renderSubtitle(p) : p.stage}
                  </p>
                </div>
                {renderRight && <div className="shrink-0">{renderRight(p)}</div>}
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getProjects(user.uid).then((ps) => {
      setProjects(ps.map(enrichProjectWithScore));
      setLoading(false);
    });
  }, [user]);

  const activeProjects = projects.filter((p) => !["Paused", "Archived"].includes(p.stage));
  const readyToBuild = projects.filter((p) => p.stage === "Ready for Build");
  const inTesting = projects.filter((p) => p.stage === "Testing");
  const launchPrep = projects.filter((p) => p.stage === "Launch Prep");
  const liveProjects = projects.filter((p) => p.stage === "Live");
  const blockedProjects = projects.filter((p) => p.blockers && p.blockers.length > 0);

  const focusProjects = [...projects].sort((a, b) => (b.focusScore || 0) - (a.focusScore || 0)).slice(0, 3);
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);
  const launchingSoon = projects.filter((p) => ["Testing", "Launch Prep"].includes(p.stage)).slice(0, 3);

  const continueWithClaude = projects
    .filter((p) => p.claudeContext?.trim() && p.localPath?.trim())
    .slice(0, 4);

  const marketingQueue = projects
    .filter(
      (p) =>
        ["Launch Prep", "Live"].includes(p.stage) ||
        (p.marketingNotes && p.marketingNotes.trim().length > 0),
    )
    .slice(0, 4);

  const hasAnySocial = (p: Project) =>
    p.socialLinks &&
    Object.values(p.socialLinks).some((v) => typeof v === "string" && v.trim().length > 0);

  const videoFactoryQueue = projects
    .filter(
      (p) =>
        p.toolOverrides?.videoPipeline?.trim() ||
        (["Launch Prep", "Live"].includes(p.stage) && hasAnySocial(p)),
    )
    .slice(0, 4);

  const assetsNeedingOrg = projects
    .filter((p) => !p.assetPath?.trim() && !p.isArchived)
    .slice(0, 5);

  return (
    <AppLayout>
      <TopBar title="Dashboard" showNewProject />
      <div className="p-6 space-y-6">
        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard title="Active Projects" value={activeProjects.length} icon={FolderOpen} colorClass="bg-blue-500/20" />
              <StatCard title="Ready for Build" value={readyToBuild.length} icon={Zap} colorClass="bg-cyan-500/20" />
              <StatCard title="In Testing" value={inTesting.length} icon={FlaskConical} colorClass="bg-orange-500/20" />
              <StatCard title="Launch Prep" value={launchPrep.length} icon={Rocket} colorClass="bg-pink-500/20" />
              <StatCard title="Live" value={liveProjects.length} icon={Globe} colorClass="bg-green-500/20" />
              <StatCard title="Blocked" value={blockedProjects.length} icon={AlertTriangle} colorClass="bg-red-500/20" />
            </div>

            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
                <p className="text-muted-foreground mb-6">Start by creating your first project or load demo data</p>
                <div className="flex gap-3">
                  <Link href="/projects/new">
                    <Button className="gap-2"><Plus className="h-4 w-4" />New Project</Button>
                  </Link>
                  <Button variant="outline" className="gap-2" onClick={async () => {
                    if (!user) return;
                    await seedDemoProjects(user.uid);
                    const ps = await getProjects(user.uid);
                    setProjects(ps.map(enrichProjectWithScore));
                  }}>
                    <Sparkles className="h-4 w-4" />Load Demo Projects
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Quick Links */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href}>
                      <Card className="hover:bg-accent transition-colors cursor-pointer">
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-2.5">
                            <Icon className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{label}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Today's Focus + Continue With Claude */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-400" />
                        Today&apos;s Focus
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {focusProjects.map((p) => {
                        const health = calculateHealth(p);
                        const hColor =
                          health.status === "green"
                            ? "text-green-400"
                            : health.status === "yellow"
                              ? "text-yellow-400"
                              : "text-red-400";
                        return (
                          <Link key={p.id} href={`/projects/view?id=${p.id}`}>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                              <div className="flex items-center gap-2 min-w-0">
                                <Circle className={`h-2.5 w-2.5 fill-current shrink-0 ${hColor}`} />
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{p.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {p.stage} · {p.nextAction || "No next action set"}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-primary shrink-0 ml-2">{p.focusScore}/10</span>
                            </div>
                          </Link>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <ProjectListCard
                    title="Continue With Claude"
                    icon={Bot}
                    iconClass="text-violet-400"
                    projects={continueWithClaude}
                    emptyMessage="No projects have Claude context configured. Set claudeContext + localPath on a project's Workspace tab to populate this list."
                    renderSubtitle={(p) => `${p.stage} · ${p.localPath}`}
                  />
                </div>

                {/* Recently Updated + Marketing Queue */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ProjectListCard
                    title="Recently Updated"
                    icon={Circle}
                    projects={recentProjects}
                    emptyMessage="No projects yet."
                  />
                  <ProjectListCard
                    title="Marketing Queue"
                    icon={Megaphone}
                    iconClass="text-fuchsia-400"
                    projects={marketingQueue}
                    emptyMessage="No projects in launch/live stage and no marketing notes set."
                    renderSubtitle={(p) =>
                      p.marketingNotes?.trim()
                        ? p.marketingNotes.trim().split("\n")[0].slice(0, 80)
                        : p.stage
                    }
                  />
                </div>

                {/* Video Factory + Assets Needing Org */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ProjectListCard
                    title="Video Factory Queue"
                    icon={Video}
                    iconClass="text-orange-400"
                    projects={videoFactoryQueue}
                    emptyMessage="No video pipelines configured. Set toolOverrides.videoPipeline on a project, or move it to Launch Prep with social links."
                    renderSubtitle={(p) =>
                      p.toolOverrides?.videoPipeline
                        ? `Pipeline: ${p.toolOverrides.videoPipeline}`
                        : `${p.stage} · marketing-ready`
                    }
                  />
                  <ProjectListCard
                    title="Assets Needing Organization"
                    icon={Images}
                    iconClass="text-amber-400"
                    projects={assetsNeedingOrg}
                    emptyMessage="Every active project has an asset folder set. Nice work."
                    renderSubtitle={() => "No asset path set"}
                  />
                </div>

                {/* Launching Soon */}
                {launchingSoon.length > 0 && (
                  <div>
                    <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                      <Rocket className="h-4 w-4 text-pink-400" />
                      Launching Soon
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {launchingSoon.map((p) => <ProjectCard key={p.id} project={p} />)}
                    </div>
                  </div>
                )}

                {/* Blocked Projects */}
                {blockedProjects.length > 0 && (
                  <div>
                    <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      Blocked Projects
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {blockedProjects.slice(0, 3).map((p) => <ProjectCard key={p.id} project={p} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
