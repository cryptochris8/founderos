"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getGlobalPrompts, addGlobalPrompt, updateGlobalPrompt, deleteGlobalPrompt } from "@/lib/firebase/globals";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { GlobalPrompt } from "@/types";
import { Plus, Copy, Pencil, Trash2, Check, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const PROMPT_TYPES = ["system", "build", "debug", "review", "explain", "generate", "refactor", "test", "document", "other"];

function PromptCard({ prompt, onUpdate, onDelete }: { prompt: GlobalPrompt; onUpdate: (id: string, d: Partial<GlobalPrompt>) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ title: prompt.title, body: prompt.body, promptType: prompt.promptType, intendedUse: prompt.intendedUse || "", tags: prompt.tags?.join(", ") || "" });

  const copy = async () => {
    await navigator.clipboard.writeText(prompt.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const save = async () => {
    await onUpdate(prompt.id, { ...form, tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [] });
    setEditing(false);
  };

  if (editing) return (
    <Card className="border-primary/50">
      <CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={form.promptType} onValueChange={v => { if (v) setForm(f => ({ ...f, promptType: v })); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROMPT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1"><Label className="text-xs">Intended Use</Label><Input value={form.intendedUse} onChange={e => setForm(f => ({ ...f, intendedUse: e.target.value }))} /></div>
        <div className="space-y-1"><Label className="text-xs">Tags (comma-separated)</Label><Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} /></div>
        <div className="space-y-1"><Label className="text-xs">Prompt Body</Label><Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={8} className="font-mono text-sm" /></div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="group">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            <Zap className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm">{prompt.title}</h3>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <Badge variant="outline" className="text-xs px-1.5 py-0">{prompt.promptType}</Badge>
                {prompt.tags?.map(tag => <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">{tag}</Badge>)}
                <span className="text-xs text-muted-foreground">Updated {formatDistanceToNow(new Date(prompt.updatedAt), { addSuffix: true })}</span>
              </div>
              {prompt.intendedUse && <p className="text-xs text-muted-foreground mt-1">{prompt.intendedUse}</p>}
              <pre className="mt-2 text-sm whitespace-pre-wrap bg-accent/50 rounded p-3 font-mono leading-relaxed max-h-32 overflow-y-auto">{prompt.body}</pre>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => onDelete(prompt.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PromptsPage() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<GlobalPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", promptType: "system", intendedUse: "", tags: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getGlobalPrompts(user.uid).then(p => { setPrompts(p); setLoading(false); });
  }, [user]);

  const handleAdd = async () => {
    if (!user || !form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    const id = await addGlobalPrompt(user.uid, {
      title: form.title,
      body: form.body,
      promptType: form.promptType,
      intendedUse: form.intendedUse,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    });
    setPrompts(prev => [{ ...form, id, tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev]);
    setForm({ title: "", body: "", promptType: "system", intendedUse: "", tags: "" });
    setSaving(false);
    setShowAdd(false);
  };

  const handleUpdate = async (id: string, data: Partial<GlobalPrompt>) => {
    if (!user) return;
    await updateGlobalPrompt(user.uid, id, data);
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteGlobalPrompt(user.uid, id);
    setPrompts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <AppLayout>
      <TopBar title="Prompts" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Global Prompts</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Reusable prompts available across all projects.</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-3.5 w-3.5" />New Prompt
          </Button>
        </div>

        {showAdd && (
          <Card className="border-dashed border-primary/50">
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="System prompt, build prompt, etc." /></div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={form.promptType} onValueChange={v => { if (v) setForm(f => ({ ...f, promptType: v })); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PROMPT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Intended Use</Label><Input value={form.intendedUse} onChange={e => setForm(f => ({ ...f, intendedUse: e.target.value }))} placeholder="When and how to use this prompt" /></div>
              <div className="space-y-1"><Label className="text-xs">Tags (comma-separated)</Label><Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="claude, coding, review" /></div>
              <div className="space-y-1"><Label className="text-xs">Prompt Body *</Label><Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={8} placeholder="Write your prompt..." className="font-mono text-sm" /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd} disabled={saving}>{saving ? "Saving..." : "Save Prompt"}</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 rounded-lg bg-card animate-pulse" />)}</div>
        ) : prompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Zap className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No global prompts yet</h2>
            <p className="text-muted-foreground mb-6">Create reusable prompts for Claude Code, system prompts, and more.</p>
            <Button className="gap-2" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" />New Prompt</Button>
          </div>
        ) : (
          <div className="space-y-3">{prompts.map(p => <PromptCard key={p.id} prompt={p} onUpdate={handleUpdate} onDelete={handleDelete} />)}</div>
        )}
      </div>
    </AppLayout>
  );
}
