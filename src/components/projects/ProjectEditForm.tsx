"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { Project, ProjectStage, ProjectPriority } from "@/types";
import { PROJECT_STAGES, PROJECT_PRIORITIES } from "@/types";
import { SEED_CATEGORIES } from "@/data/seed";

interface Props {
  project: Project;
  onSave: (updates: Partial<Project>) => Promise<void>;
  onCancel: () => void;
}

export function ProjectEditForm({ project, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    title: project.title,
    shortDescription: project.shortDescription,
    categoryId: project.categoryId,
    stage: project.stage,
    priority: project.priority,
    percentComplete: project.percentComplete,
    currentFocus: project.currentFocus || "",
    nextAction: project.nextAction || "",
    tags: project.tags.join(", "),
    techStack: (project.techStack || []).join(", "),
    monetizationModel: project.monetizationModel || "",
    targetAudience: project.targetAudience || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      title: form.title,
      shortDescription: form.shortDescription,
      categoryId: form.categoryId,
      stage: form.stage,
      priority: form.priority,
      percentComplete: form.percentComplete,
      currentFocus: form.currentFocus,
      nextAction: form.nextAction,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      techStack: form.techStack ? form.techStack.split(",").map(t => t.trim()).filter(Boolean) : [],
      monetizationModel: form.monetizationModel,
      targetAudience: form.targetAudience,
    });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
      <div className="space-y-1.5"><Label>Short Description</Label><Textarea value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))} rows={2} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.categoryId} onValueChange={v => { if (v) setForm(f => ({ ...f, categoryId: v })); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SEED_CATEGORIES.map(c => <SelectItem key={c.slug} value={c.slug}>{c.icon} {c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Stage</Label>
          <Select value={form.stage} onValueChange={v => { if (v) setForm(f => ({ ...f, stage: v as ProjectStage })); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PROJECT_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={v => { if (v) setForm(f => ({ ...f, priority: v as ProjectPriority })); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PROJECT_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Progress: {form.percentComplete}%</Label>
          <Slider value={[form.percentComplete]} onValueChange={(v) => setForm(f => ({ ...f, percentComplete: v as number }))} max={100} step={5} />
        </div>
      </div>
      <div className="space-y-1.5"><Label>Current Focus</Label><Input value={form.currentFocus} onChange={e => setForm(f => ({ ...f, currentFocus: e.target.value }))} /></div>
      <div className="space-y-1.5"><Label>Next Action</Label><Input value={form.nextAction} onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))} /></div>
      <div className="space-y-1.5"><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} /></div>
      <div className="space-y-1.5"><Label>Tech Stack (comma-separated)</Label><Input value={form.techStack} onChange={e => setForm(f => ({ ...f, techStack: e.target.value }))} /></div>
      <div className="space-y-1.5"><Label>Target Audience</Label><Input value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))} /></div>
      <div className="space-y-1.5"><Label>Monetization Model</Label><Input value={form.monetizationModel} onChange={e => setForm(f => ({ ...f, monetizationModel: e.target.value }))} /></div>
      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
