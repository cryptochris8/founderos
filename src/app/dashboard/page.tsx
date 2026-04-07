"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getProjects } from "@/lib/firebase/projects";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { StatCard } from "@/components/shared/StatCard";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { enrichProjectWithScore } from "@/lib/scoring";
import type { Project } from "@/types";
import { FolderOpen, Zap, FlaskConical, Rocket, Globe, AlertTriangle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getProjects(user.uid).then(ps => {
      setProjects(ps.map(enrichProjectWithScore));
      setLoading(false);
    });
  }, [user]);

  const activeProjects = projects.filter(p => !["Paused", "Archived"].includes(p.stage));
  const readyToBuild = projects.filter(p => p.stage === "Ready for Build");
  const inTesting = projects.filter(p => p.stage === "Testing");
  const launchPrep = projects.filter(p => p.stage === "Launch Prep");
  const liveProjects = projects.filter(p => p.stage === "Live");
  const blockedProjects = projects.filter(p => p.blockers && p.blockers.length > 0);
  const recentProjects = [...projects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4);
  const focusProjects = [...projects].sort((a, b) => (b.focusScore || 0) - (a.focusScore || 0)).slice(0, 3);
  const launchingSoon = [...projects].filter(p => ["Testing", "Launch Prep"].includes(p.stage)).slice(0, 3);

  return (
    <AppLayout>
      <TopBar title="Dashboard" showNewProject />
      <div className="p-6 space-y-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-lg bg-card animate-pulse" />
            ))}
          </div>
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
                <p className="text-muted-foreground mb-6">Start by creating your first project</p>
                <Link href="/projects/new">
                  <Button className="gap-2"><Plus className="h-4 w-4" />New Project</Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Focus + Recent */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-400" />
                        What to Work on Next
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {focusProjects.map(p => (
                        <Link key={p.id} href={`/projects/${p.id}`}>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                            <div>
                              <p className="font-medium text-sm">{p.title}</p>
                              <p className="text-xs text-muted-foreground">{p.stage} · {p.nextAction || "No next action set"}</p>
                            </div>
                            <span className="text-xs font-bold text-primary">{p.focusScore}/10</span>
                          </div>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Recently Updated</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recentProjects.map(p => (
                        <Link key={p.id} href={`/projects/${p.id}`}>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                            <div>
                              <p className="font-medium text-sm">{p.title}</p>
                              <p className="text-xs text-muted-foreground">{p.stage}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Launching Soon + Recent Projects Grid */}
                {launchingSoon.length > 0 && (
                  <div>
                    <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                      <Rocket className="h-4 w-4 text-pink-400" />
                      Launching Soon
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {launchingSoon.map(p => <ProjectCard key={p.id} project={p} />)}
                    </div>
                  </div>
                )}

                {blockedProjects.length > 0 && (
                  <div>
                    <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      Blocked Projects
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {blockedProjects.slice(0, 3).map(p => <ProjectCard key={p.id} project={p} />)}
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
