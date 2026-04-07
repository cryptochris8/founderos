"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Project } from "@/types";
import { Pencil, Check, X } from "lucide-react";

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => Promise<void>;
}

function EditableField({
  label, value, onSave, multiline = false
}: {
  label: string;
  value?: string;
  onSave: (v: string) => Promise<void>;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(val);
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        {multiline ? (
          <Textarea value={val} onChange={e => setVal(e.target.value)} rows={4} className="resize-none" />
        ) : (
          <Input value={val} onChange={e => setVal(e.target.value)} />
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving}><Check className="h-3.5 w-3.5 mr-1" />Save</Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setVal(value || ""); }}><X className="h-3.5 w-3.5 mr-1" />Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group space-y-0.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
      {value ? (
        <p className="text-sm leading-relaxed">{value}</p>
      ) : (
        <button onClick={() => setEditing(true)} className="text-sm text-muted-foreground/50 italic hover:text-muted-foreground transition-colors">
          Click to add {label.toLowerCase()}...
        </button>
      )}
    </div>
  );
}

export function OverviewTab({ project, onUpdate }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <EditableField label="Long Description" value={project.longDescription} onSave={v => onUpdate({ longDescription: v })} multiline />
          <EditableField label="Target Audience" value={project.targetAudience} onSave={v => onUpdate({ targetAudience: v })} multiline />
          <EditableField label="Problem Solved" value={project.problemSolved} onSave={v => onUpdate({ problemSolved: v })} multiline />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Business Context</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <EditableField label="Value Proposition" value={project.valueProposition} onSave={v => onUpdate({ valueProposition: v })} multiline />
          <EditableField label="Monetization Model" value={project.monetizationModel} onSave={v => onUpdate({ monetizationModel: v })} multiline />
          <EditableField label="Design Direction" value={project.designDirection} onSave={v => onUpdate({ designDirection: v })} multiline />
        </CardContent>
      </Card>
      {project.tags.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Tags</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {project.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-accent rounded-full text-xs">{tag}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {(project.techStack?.length || project.platformTargets?.length) ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Tech</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {project.techStack?.length ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Tech Stack</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.techStack.map(t => <span key={t} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">{t}</span>)}
                </div>
              </div>
            ) : null}
            {project.platformTargets?.length ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Platforms</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.platformTargets.map(p => <span key={p} className="px-2 py-0.5 bg-secondary rounded text-xs">{p}</span>)}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
