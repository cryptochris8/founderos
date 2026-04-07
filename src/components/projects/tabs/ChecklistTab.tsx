"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ChecklistItem } from "@/types";
import { Plus, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const GROUPS = ["branding", "product", "legal", "analytics", "launch", "qa", "marketing", "other"];

interface Props {
  items: ChecklistItem[];
  onAdd: (item: Omit<ChecklistItem, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onUpdate: (id: string, item: Partial<ChecklistItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ChecklistTab({ items, onAdd, onUpdate, onDelete }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", group: "launch", description: "" });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await onAdd({ title: form.title, group: form.group, description: form.description, isComplete: false, sortOrder: items.length });
    setForm({ title: "", group: "launch", description: "" });
    setSaving(false);
    setShowAdd(false);
  };

  const grouped = GROUPS.reduce((acc, group) => {
    const groupItems = items.filter(i => i.group === group);
    if (groupItems.length > 0) acc[group] = groupItems;
    return acc;
  }, {} as Record<string, ChecklistItem[]>);
  const ungrouped = items.filter(i => !i.group || !GROUPS.includes(i.group));
  if (ungrouped.length > 0) grouped["other"] = [...(grouped["other"] || []), ...ungrouped];

  const total = items.length;
  const completed = items.filter(i => i.isComplete).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{completed}/{total} complete ({percent}%)</p>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3.5 w-3.5" />Add Item
        </Button>
      </div>
      {showAdd && (
        <Card className="border-dashed border-primary/50">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Item *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Branding complete, App store copy written, etc." /></div>
              <div className="space-y-1">
                <Label className="text-xs">Group</Label>
                <Select value={form.group} onValueChange={v => { if (v) setForm(f => ({ ...f, group: v })); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={saving}>{saving ? "Saving..." : "Add"}</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><p>No checklist items yet. Add launch checklist items to track readiness.</p></div>
      ) : (
        Object.entries(grouped).map(([group, groupItems]) => (
          <div key={group}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 capitalize">{group}</h3>
            <Card>
              <CardContent className="pt-3 pb-2 divide-y divide-border/50">
                {groupItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-2.5 group">
                    <button
                      onClick={() => onUpdate(item.id, { isComplete: !item.isComplete, completedAt: !item.isComplete ? new Date().toISOString() : undefined })}
                      className={cn("h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors", item.isComplete ? "bg-green-500 border-green-500" : "border-border hover:border-green-400")}
                    >
                      {item.isComplete && <Check className="h-3 w-3 text-white" />}
                    </button>
                    <span className={cn("flex-1 text-sm", item.isComplete && "line-through text-muted-foreground")}>{item.title}</span>
                    <button onClick={() => onDelete(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))
      )}
    </div>
  );
}
