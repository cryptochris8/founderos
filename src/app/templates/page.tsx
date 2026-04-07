"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createProject } from "@/lib/firebase/projects";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PROJECT_TEMPLATES } from "@/data/templates";
import { SEED_CATEGORIES } from "@/data/seed";
import type { Template } from "@/types";
import { Rocket, ArrowRight } from "lucide-react";

function getCategoryIcon(categoryId: string) {
  return SEED_CATEGORIES.find(c => c.slug === categoryId)?.icon || "📁";
}

export default function TemplatesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<Omit<Template, "id" | "createdAt" | "updatedAt"> | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const handleUseTemplate = async () => {
    if (!user || !selected || !projectTitle.trim()) return;
    setCreating(true);
    const slug = projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const id = await createProject(user.uid, {
      title: projectTitle,
      slug,
      shortDescription: selected.description || "",
      longDescription: selected.starterOverview,
      categoryId: selected.categoryId,
      tags: selected.defaultTags || [],
      stage: selected.defaultStage || "Idea",
      priority: selected.defaultPriority || "Medium",
      percentComplete: 0,
      nextAction: selected.starterMilestones?.[0] || "",
      techStack: selected.starterTechStack || [],
      mvpDefinition: selected.starterRoadmap,
      isArchived: false,
    });
    router.push(`/projects/${id}`);
  };

  return (
    <AppLayout>
      <TopBar title="Templates" />
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Project Templates</h2>
          <p className="text-sm text-muted-foreground mt-1">Start a new project from a template with pre-filled structure, milestones, and prompts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROJECT_TEMPLATES.map(t => (
            <Card key={t.slug} className="group hover:border-primary/40 transition-colors cursor-pointer" onClick={() => { setSelected(t); setProjectTitle(""); }}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(t.categoryId)}</span>
                  <CardTitle className="text-base">{t.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {t.defaultTags?.slice(0, 4).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {t.starterTechStack?.map(tech => (
                    <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">{t.starterMilestones?.length || 0} milestones · {t.starterChecklist?.length || 0} checklist items</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected && <span className="text-xl">{getCategoryIcon(selected.categoryId)}</span>}
              Use {selected?.title} Template
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selected.description}</p>

              <div className="space-y-2 text-sm">
                <p className="font-medium">This template includes:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Stage: {selected.defaultStage} · Priority: {selected.defaultPriority}</li>
                  <li>• {selected.starterMilestones?.length || 0} starter milestones</li>
                  <li>• {selected.starterChecklist?.length || 0} checklist items</li>
                  <li>• {selected.starterPromptPack?.length || 0} prompt starters</li>
                  <li>• Tech stack: {selected.starterTechStack?.join(", ")}</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="templateTitle">Project Name *</Label>
                <Input
                  id="templateTitle"
                  value={projectTitle}
                  onChange={e => setProjectTitle(e.target.value)}
                  placeholder="Name your new project"
                  onKeyDown={e => { if (e.key === "Enter" && projectTitle.trim()) handleUseTemplate(); }}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleUseTemplate} disabled={!projectTitle.trim() || creating} className="gap-2">
                  <Rocket className="h-4 w-4" />
                  {creating ? "Creating..." : "Create Project"}
                </Button>
                <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
