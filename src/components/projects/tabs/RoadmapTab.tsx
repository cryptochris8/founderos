"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "@/types";
import { Pencil, Check, X } from "lucide-react";

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => Promise<void>;
}

function EditableTextarea({ label, value, onSave }: { label: string; value?: string; onSave: (v: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(val);
    setSaving(false);
    setEditing(false);
  };

  if (editing) return (
    <div className="space-y-2">
      <Textarea value={val} onChange={e => setVal(e.target.value)} rows={6} className="font-mono text-sm" />
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={saving}><Check className="h-3.5 w-3.5 mr-1" />Save</Button>
        <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setVal(value || ""); }}><X className="h-3.5 w-3.5 mr-1" />Cancel</Button>
      </div>
    </div>
  );

  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
      {value ? (
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{value}</p>
      ) : (
        <button onClick={() => setEditing(true)} className="text-sm text-muted-foreground/50 italic hover:text-muted-foreground">
          Click to add {label.toLowerCase()}...
        </button>
      )}
    </div>
  );
}

export function RoadmapTab({ project, onUpdate }: Props) {
  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader><CardTitle className="text-base">MVP Definition</CardTitle></CardHeader>
        <CardContent>
          <EditableTextarea label="MVP Definition" value={project.mvpDefinition} onSave={v => onUpdate({ mvpDefinition: v })} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Feature Roadmap</CardTitle></CardHeader>
        <CardContent>
          <EditableTextarea label="Feature Roadmap" value={project.featureRoadmap} onSave={v => onUpdate({ featureRoadmap: v })} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Research Summary</CardTitle></CardHeader>
        <CardContent>
          <EditableTextarea label="Research Summary" value={project.researchSummary} onSave={v => onUpdate({ researchSummary: v })} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Master Prompt / Claude Build Prompt</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <EditableTextarea label="Master Prompt" value={project.masterPrompt} onSave={v => onUpdate({ masterPrompt: v })} />
          <EditableTextarea label="Claude Build Prompt" value={project.claudeBuildPrompt} onSave={v => onUpdate({ claudeBuildPrompt: v })} />
        </CardContent>
      </Card>
    </div>
  );
}
