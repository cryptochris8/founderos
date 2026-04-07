"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProjectAsset } from "@/types";
import { Plus, ExternalLink, Trash2, Github, Globe, Figma, Database } from "lucide-react";

const ASSET_TYPES = ["repo", "deploy", "firebase", "figma", "screenshot", "design", "reference-link", "video", "image", "other"];

const ASSET_ICONS: Record<string, React.ReactNode> = {
  "repo": <Github className="h-4 w-4" />,
  "deploy": <Globe className="h-4 w-4" />,
  "firebase": <Database className="h-4 w-4" />,
  "figma": <Figma className="h-4 w-4" />,
};

interface Props {
  assets: ProjectAsset[];
  onAdd: (a: Omit<ProjectAsset, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function AssetsTab({ assets, onAdd, onDelete }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", assetType: "repo", url: "", description: "" });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.url.trim()) return;
    setSaving(true);
    await onAdd({ title: form.title, assetType: form.assetType, url: form.url, description: form.description });
    setForm({ title: "", assetType: "repo", url: "", description: "" });
    setSaving(false);
    setShowAdd(false);
  };

  const grouped = ASSET_TYPES.reduce((acc, type) => {
    const items = assets.filter(a => a.assetType === type);
    if (items.length > 0) acc[type] = items;
    return acc;
  }, {} as Record<string, ProjectAsset[]>);

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{assets.length} asset{assets.length !== 1 ? "s" : ""}</p>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3.5 w-3.5" />Add Asset
        </Button>
      </div>
      {showAdd && (
        <Card className="border-dashed border-primary/50">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Main Repo, Production Deploy, etc." /></div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={form.assetType} onValueChange={v => { if (v) setForm(f => ({ ...f, assetType: v })); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">URL *</Label><Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." /></div>
            <div className="space-y-1"><Label className="text-xs">Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={saving}>{saving ? "Saving..." : "Add"}</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><p>No assets yet. Add repo links, deploy URLs, Figma files, and more.</p></div>
      ) : (
        Object.entries(grouped).map(([type, items]) => (
          <div key={type}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 capitalize">{type.replace("-", " ")}</h3>
            <div className="space-y-2">
              {items.map(asset => (
                <div key={asset.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border group hover:border-border/80">
                  <span className="text-muted-foreground shrink-0">{ASSET_ICONS[asset.assetType] || <Globe className="h-4 w-4" />}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{asset.title}</p>
                    {asset.url && <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block">{asset.url}</a>}
                    {asset.description && <p className="text-xs text-muted-foreground">{asset.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {asset.url && <a href={asset.url} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-3.5 w-3.5" /></Button></a>}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => onDelete(asset.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
