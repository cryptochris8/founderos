"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ProjectNote } from "@/types";
import { Plus, Pencil, Trash2, Pin, PinOff, StickyNote } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const NOTE_CATEGORIES = ["general", "idea", "decision", "question", "blocker", "reference", "meeting", "other"];

interface Props {
  notes: ProjectNote[];
  onAdd: (n: Omit<ProjectNote, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onUpdate: (id: string, n: Partial<ProjectNote>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function NoteCard({ note, onUpdate, onDelete }: { note: ProjectNote; onUpdate: Props["onUpdate"]; onDelete: Props["onDelete"] }) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: note.title, content: note.content, category: note.category || "general", isPinned: note.isPinned || false });

  const save = async () => {
    await onUpdate(note.id, editForm);
    setEditing(false);
  };

  const togglePin = () => onUpdate(note.id, { isPinned: !note.isPinned });

  if (editing) return (
    <Card className="border-primary/50">
      <CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Select value={editForm.category} onValueChange={v => { if (v) setEditForm(f => ({ ...f, category: v })); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{NOTE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1"><Label className="text-xs">Content</Label><Textarea value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} rows={6} className="text-sm" /></div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className={`group ${note.isPinned ? "border-primary/30" : ""}`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {note.isPinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                <h3 className="font-medium text-sm">{note.title}</h3>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {note.category && <Badge variant="outline" className="text-xs px-1.5 py-0">{note.category}</Badge>}
                <span className="text-xs text-muted-foreground">Updated {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap line-clamp-4">{note.content}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={togglePin}>
              {note.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => onDelete(note.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function NotesTab({ notes, onAdd, onUpdate, onDelete }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "general", isPinned: false });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await onAdd(form);
    setForm({ title: "", content: "", category: "general", isPinned: false });
    setSaving(false);
    setShowAdd(false);
  };

  const pinned = notes.filter(n => n.isPinned);
  const unpinned = notes.filter(n => !n.isPinned);
  const sorted = [...pinned, ...unpinned];

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{notes.length} note{notes.length !== 1 ? "s" : ""}</p>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3.5 w-3.5" />New Note
        </Button>
      </div>
      {showAdd && (
        <Card className="border-dashed border-primary/50">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Quick note, decision log, etc." /></div>
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => { if (v) setForm(f => ({ ...f, category: v })); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{NOTE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Content</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} placeholder="Write your note..." className="text-sm" /></div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={saving}>{saving ? "Saving..." : "Save Note"}</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {notes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><p>No notes yet. Jot down ideas, decisions, or quick thoughts.</p></div>
      ) : (
        <div className="space-y-3">{sorted.map(n => <NoteCard key={n.id} note={n} onUpdate={onUpdate} onDelete={onDelete} />)}</div>
      )}
    </div>
  );
}
