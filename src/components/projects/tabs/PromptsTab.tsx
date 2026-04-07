"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ProjectPrompt } from "@/types";
import { Plus, Copy, Pencil, Trash2, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const PROMPT_TYPES = ["research", "build", "debug", "design", "marketing", "app-store", "legal", "image", "video", "reusable"];

interface Props {
  prompts: ProjectPrompt[];
  onAdd: (p: Omit<ProjectPrompt, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onUpdate: (id: string, p: Partial<ProjectPrompt>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function PromptCard({ prompt, onUpdate, onDelete }: { prompt: ProjectPrompt; onUpdate: Props["onUpdate"]; onDelete: Props["onDelete"] }) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: prompt.title, promptType: prompt.promptType, body: prompt.body, intendedUse: prompt.intendedUse || "" });

  const copy = async () => {
    await navigator.clipboard.writeText(prompt.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const save = async () => {
    await onUpdate(prompt.id, editForm);
    setEditing(false);
  };

  if (editing) {
    return (
      <Card className="border-primary/50">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={editForm.promptType} onValueChange={v => { if (v) setEditForm(f => ({ ...f, promptType: v })); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROMPT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1"><Label className="text-xs">Intended Use</Label><Input value={editForm.intendedUse} onChange={e => setEditForm(f => ({ ...f, intendedUse: e.target.value }))} /></div>
          <div className="space-y-1"><Label className="text-xs">Prompt Body</Label><Textarea value={editForm.body} onChange={e => setEditForm(f => ({ ...f, body: e.target.value }))} rows={6} className="font-mono text-sm" /></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:border-border/80">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-medium text-sm">{prompt.title}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="secondary" className="text-xs px-1.5 py-0">{prompt.promptType}</Badge>
              {prompt.intendedUse && <span className="text-xs text-muted-foreground">{prompt.intendedUse}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => onDelete(prompt.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground bg-accent/50 rounded p-2.5 line-clamp-3 font-mono leading-relaxed">{prompt.body}</p>
        <p className="text-xs text-muted-foreground mt-2">Updated {formatDistanceToNow(new Date(prompt.updatedAt), { addSuffix: true })}</p>
      </CardContent>
    </Card>
  );
}

export function PromptsTab({ prompts, onAdd, onUpdate, onDelete }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", promptType: "build", body: "", intendedUse: "" });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    await onAdd({ title: form.title, promptType: form.promptType, body: form.body, intendedUse: form.intendedUse });
    setForm({ title: "", promptType: "build", body: "", intendedUse: "" });
    setSaving(false);
    setShowAdd(false);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{prompts.length} prompt{prompts.length !== 1 ? "s" : ""}</p>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3.5 w-3.5" />Add Prompt
        </Button>
      </div>

      {showAdd && (
        <Card className="border-dashed border-primary/50">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Build prompt, Marketing copy, etc." /></div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={form.promptType} onValueChange={v => { if (v) setForm(f => ({ ...f, promptType: v })); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROMPT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Intended Use</Label><Input value={form.intendedUse} onChange={e => setForm(f => ({ ...f, intendedUse: e.target.value }))} placeholder="e.g. Feed into Claude Code, Use for marketing copy" /></div>
            <div className="space-y-1"><Label className="text-xs">Prompt Body *</Label><Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={6} placeholder="Write your prompt here..." className="font-mono text-sm" /></div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={saving}>{saving ? "Saving..." : "Save Prompt"}</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {prompts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No prompts yet.</p>
          <p className="text-sm mt-1">Add build prompts, marketing prompts, or reusable templates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {prompts.map(p => <PromptCard key={p.id} prompt={p} onUpdate={onUpdate} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
}
