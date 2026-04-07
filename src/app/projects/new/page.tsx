"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createProject } from "@/lib/firebase/projects";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROJECT_STAGES, PROJECT_PRIORITIES } from "@/types";
import type { ProjectStage, ProjectPriority } from "@/types";
import { SEED_CATEGORIES } from "@/data/seed";

export default function NewProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    shortDescription: "",
    categoryId: "",
    stage: "Idea" as ProjectStage,
    priority: "Medium" as ProjectPriority,
    nextAction: "",
    tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const id = await createProject(user.uid, {
        title: form.title,
        slug,
        shortDescription: form.shortDescription,
        categoryId: form.categoryId || "experimental-idea",
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        stage: form.stage,
        priority: form.priority,
        percentComplete: 0,
        nextAction: form.nextAction,
        isArchived: false,
      });
      router.push(`/projects/${id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <TopBar title="New Project" />
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="title">Project Title *</Label>
                <Input id="title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Pregame, Free Fall, FounderOS" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shortDesc">Short Description *</Label>
                <Textarea id="shortDesc" value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))} placeholder="One sentence describing what this project is" rows={2} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v ?? "" }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEED_CATEGORIES.map(c => (
                        <SelectItem key={c.slug} value={c.slug}>{c.icon} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Stage</Label>
                  <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: (v ?? "Idea") as ProjectStage }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: (v ?? "Medium") as ProjectPriority }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input id="tags" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="mobile, game, saas" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nextAction">Next Action</Label>
                <Input id="nextAction" value={form.nextAction} onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))} placeholder="What's the immediate next step?" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Project"}</Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
