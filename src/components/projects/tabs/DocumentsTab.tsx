"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ProjectDocument } from "@/types";
import { Plus, Copy, Pencil, Trash2, Check, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const DOC_TYPES = ["overview", "research", "sprint-spec", "launch-plan", "architecture", "meeting-note", "legal-note", "app-store-response", "export", "other"];

interface Props {
  documents: ProjectDocument[];
  onAdd: (d: Omit<ProjectDocument, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onUpdate: (id: string, d: Partial<ProjectDocument>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function DocumentCard({ doc, onUpdate, onDelete }: { doc: ProjectDocument; onUpdate: Props["onUpdate"]; onDelete: Props["onDelete"] }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editForm, setEditForm] = useState({ title: doc.title, content: doc.content, docType: doc.docType, summary: doc.summary || "" });

  const copy = async () => {
    await navigator.clipboard.writeText(doc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const save = async () => {
    await onUpdate(doc.id, editForm);
    setEditing(false);
  };

  if (editing) return (
    <Card className="border-primary/50">
      <CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={editForm.docType} onValueChange={v => { if (v) setEditForm(f => ({ ...f, docType: v })); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1"><Label className="text-xs">Summary</Label><Input value={editForm.summary} onChange={e => setEditForm(f => ({ ...f, summary: e.target.value }))} /></div>
        <div className="space-y-1"><Label className="text-xs">Content (Markdown)</Label><Textarea value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} rows={10} className="font-mono text-sm" /></div>
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
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <h3 className="font-medium text-sm">{doc.title}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="text-xs px-1.5 py-0">{doc.docType}</Badge>
                <span className="text-xs text-muted-foreground">Updated {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</span>
              </div>
              {doc.summary && <p className="text-xs text-muted-foreground mt-1">{doc.summary}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => onDelete(doc.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
        {expanded && (
          <pre className="mt-3 text-sm whitespace-pre-wrap bg-accent/50 rounded p-3 font-mono leading-relaxed overflow-x-auto max-h-96 overflow-y-auto">
            {doc.content}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}

export function DocumentsTab({ documents, onAdd, onUpdate, onDelete }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", docType: "overview", summary: "" });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await onAdd({ title: form.title, content: form.content, docType: form.docType, summary: form.summary, slug });
    setForm({ title: "", content: "", docType: "overview", summary: "" });
    setSaving(false);
    setShowAdd(false);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{documents.length} document{documents.length !== 1 ? "s" : ""}</p>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3.5 w-3.5" />New Document
        </Button>
      </div>
      {showAdd && (
        <Card className="border-dashed border-primary/50">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Sprint spec, Launch plan, etc." /></div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={form.docType} onValueChange={v => { if (v) setForm(f => ({ ...f, docType: v })); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Summary</Label><Input value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs">Content (Markdown)</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8} placeholder={"# Title\n\nWrite your document here..."} className="font-mono text-sm" /></div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={saving}>{saving ? "Saving..." : "Save Document"}</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {documents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><p>No documents yet.</p></div>
      ) : (
        <div className="space-y-3">{documents.map(d => <DocumentCard key={d.id} doc={d} onUpdate={onUpdate} onDelete={onDelete} />)}</div>
      )}
    </div>
  );
}
