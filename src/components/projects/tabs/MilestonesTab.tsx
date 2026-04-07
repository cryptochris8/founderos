"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProjectMilestone, MilestoneStatus } from "@/types";
import { Plus, CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const STATUS_ICONS: Record<MilestoneStatus, React.ReactNode> = {
  "upcoming": <Circle className="h-5 w-5 text-muted-foreground" />,
  "active": <Clock className="h-5 w-5 text-blue-400" />,
  "completed": <CheckCircle2 className="h-5 w-5 text-green-400" />,
};

interface Props {
  milestones: ProjectMilestone[];
  onAdd: (m: Omit<ProjectMilestone, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onUpdate: (id: string, m: Partial<ProjectMilestone>) => Promise<void>;
}

export function MilestonesTab({ milestones, onAdd, onUpdate }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status: "upcoming" as MilestoneStatus, targetDate: "" });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await onAdd({ title: form.title, description: form.description, status: form.status, targetDate: form.targetDate || undefined, sortOrder: milestones.length });
    setForm({ title: "", description: "", status: "upcoming", targetDate: "" });
    setSaving(false);
    setShowAdd(false);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{milestones.length} milestone{milestones.length !== 1 ? "s" : ""}</p>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3.5 w-3.5" />Add Milestone
        </Button>
      </div>
      {showAdd && (
        <Card className="border-dashed border-primary/50">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="MVP Launch, Beta Complete, etc." /></div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => { if (v) setForm(f => ({ ...f, status: v as MilestoneStatus })); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs">Target Date</Label><Input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} /></div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={saving}>{saving ? "Saving..." : "Add"}</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {milestones.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><p>No milestones yet. Track your major progress markers here.</p></div>
      ) : (
        <div className="relative">
          <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-4">
            {milestones.map(m => (
              <div key={m.id} className="flex gap-4 relative">
                <div className="shrink-0 z-10 bg-background">{STATUS_ICONS[m.status]}</div>
                <div className={cn("flex-1 p-3 rounded-lg border", m.status === "completed" ? "bg-green-500/5 border-green-500/20" : m.status === "active" ? "bg-blue-500/5 border-blue-500/20" : "bg-card border-border")}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={cn("font-medium text-sm", m.status === "completed" && "line-through text-muted-foreground")}>{m.title}</p>
                      {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                      {m.targetDate && <p className="text-xs text-muted-foreground mt-1">Target: {m.targetDate}</p>}
                    </div>
                    <Select value={m.status} onValueChange={v => { if (v) onUpdate(m.id, { status: v as MilestoneStatus, completedDate: v === "completed" ? new Date().toISOString() : undefined }); }}>
                      <SelectTrigger className="h-6 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
