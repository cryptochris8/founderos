"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useDebouncedUpdater } from "@/hooks/useDebouncedUpdater";
import type { Project, ProjectTask, TaskStatus, ProjectPriority } from "@/types";
import { PROJECT_STAGES, PROJECT_PRIORITIES } from "@/types";
import { Plus, Check, X, Trash2 } from "lucide-react";

interface Props {
  project: Project;
  tasks: ProjectTask[];
  onUpdateProject: (u: Partial<Project>) => Promise<void>;
  onAddTask: (t: Omit<ProjectTask, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onUpdateTask: (id: string, t: Partial<ProjectTask>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

const STATUS_COLORS: Record<TaskStatus, string> = {
  "todo": "bg-slate-500/20 text-slate-400",
  "in-progress": "bg-blue-500/20 text-blue-400",
  "blocked": "bg-red-500/20 text-red-400",
  "done": "bg-green-500/20 text-green-400",
};

export function StatusTab({ project, tasks, onUpdateProject, onAddTask, onUpdateTask, onDeleteTask }: Props) {
  const [newTask, setNewTask] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  // Mirror the project locally so editing Current Focus / Next Action / Progress
  // updates the UI instantly while persistence is debounced — one write per
  // pause instead of one per keystroke or slider step. Stage/Priority are
  // discrete single selections, so they keep persisting immediately. Re-sync
  // only when a different project loads (adjust-state-during-render pattern).
  const [form, setForm] = useState(project);
  const [syncedId, setSyncedId] = useState(project.id);
  if (project.id !== syncedId) {
    setSyncedId(project.id);
    setForm(project);
  }
  const { push } = useDebouncedUpdater<Project>(onUpdateProject, 600);
  const setText = (key: "currentFocus" | "nextAction", value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    push({ [key]: value } as Partial<Project>);
  };
  const setPercent = (value: number) => {
    setForm((f) => ({ ...f, percentComplete: value }));
    push({ percentComplete: value });
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    await onAddTask({
      title: newTask.trim(),
      status: "todo",
      priority: "Medium",
      sortOrder: tasks.length,
    });
    setNewTask("");
    setAddingTask(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
      {/* Project Status */}
      <Card>
        <CardHeader><CardTitle className="text-base">Project Status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Stage</Label>
              <Select value={project.stage} onValueChange={v => { if (v) onUpdateProject({ stage: v as Project["stage"] }); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Priority</Label>
              <Select value={project.priority} onValueChange={v => { if (v) onUpdateProject({ priority: v as ProjectPriority }); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Progress: {form.percentComplete}%</Label>
            <Slider
              value={[form.percentComplete]}
              onValueChange={(v) => setPercent(v as number)}
              max={100} step={5} className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Current Focus</Label>
            <Input
              value={form.currentFocus || ""}
              onChange={e => setText("currentFocus", e.target.value)}
              placeholder="What are you focused on right now?"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Next Action</Label>
            <Input
              value={form.nextAction || ""}
              onChange={e => setText("nextAction", e.target.value)}
              placeholder="What's the very next step?"
              className="h-8 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Blockers & Dependencies */}
      <Card>
        <CardHeader><CardTitle className="text-base">Blockers &amp; Dependencies</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {project.blockers?.length ? (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Blockers</p>
              <div className="space-y-1">
                {project.blockers.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                    {b}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">No blockers — you&apos;re clear to build.</p>
          )}
          {project.dependencies?.length ? (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Dependencies</p>
              <div className="space-y-1">
                {project.dependencies.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shrink-0" />
                    {d}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Tasks</CardTitle>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setAddingTask(true)}>
              <Plus className="h-3.5 w-3.5" />Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {addingTask && (
            <div className="flex gap-2">
              <Input
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                placeholder="Task title..."
                className="h-8 text-sm"
                onKeyDown={e => { if (e.key === "Enter") handleAddTask(); if (e.key === "Escape") setAddingTask(false); }}
                autoFocus
              />
              <Button size="sm" onClick={handleAddTask}><Check className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingTask(false)}><X className="h-3.5 w-3.5" /></Button>
            </div>
          )}
          {tasks.length === 0 && !addingTask ? (
            <p className="text-sm text-muted-foreground/50 italic py-4 text-center">No tasks yet. Add one to track your work.</p>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-accent/30 hover:bg-accent/50 group">
                <button
                  onClick={() => onUpdateTask(task.id, { status: task.status === "done" ? "todo" : "done", completedAt: task.status !== "done" ? new Date().toISOString() : undefined })}
                  className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${task.status === "done" ? "bg-green-500 border-green-500" : "border-border"}`}
                >
                  {task.status === "done" && <Check className="h-2.5 w-2.5 text-white" />}
                </button>
                <span className={`flex-1 text-sm ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</span>
                <Select value={task.status} onValueChange={v => { if (v) onUpdateTask(task.id, { status: v as TaskStatus }); }}>
                  <SelectTrigger className="h-6 w-28 text-xs border-0 bg-transparent p-0">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${STATUS_COLORS[task.status]}`}>{STATUS_OPTIONS.find(s => s.value === task.status)?.label}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <button onClick={() => onDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
