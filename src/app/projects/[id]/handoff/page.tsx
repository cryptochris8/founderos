"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getProject } from "@/lib/firebase/projects";
import { getToolchain } from "@/lib/firebase/settings";
import { DEFAULT_TOOLCHAIN } from "@/lib/defaults/toolchain";
import {
  generateHandoff,
  defaultHandoffFilename,
  HANDOFF_TASK_TYPES,
  type HandoffInput,
  type HandoffTaskType,
} from "@/lib/handoff/generate";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Project, ToolchainDefaults } from "@/types";
import { ArrowLeft, Copy, Check, Save, FileText } from "lucide-react";

const INITIAL_INPUT: HandoffInput = {
  taskTitle: "",
  taskType: "",
  objective: "",
  importantFiles: "",
  constraints: "",
  acceptanceCriteria: "",
  includeToolchain: true,
  includeProjectContext: true,
  includeAssetPaths: true,
  includeCommandPresets: true,
};

export default function HandoffPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [toolchain, setToolchain] = useState<ToolchainDefaults>(DEFAULT_TOOLCHAIN);
  const [input, setInput] = useState<HandoffInput>(INITIAL_INPUT);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || !params.id) return;
    let cancelled = false;
    Promise.all([getProject(user.uid, params.id), getToolchain(user.uid)])
      .then(([p, tc]) => {
        if (cancelled) return;
        setProject(p);
        setToolchain(tc);
      })
      .catch(() => toast.error("Failed to load project or toolchain"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, params.id]);

  const generated = useMemo(() => {
    if (!project) return "";
    return generateHandoff(toolchain, project, input);
  }, [project, toolchain, input]);

  const copy = async () => {
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const save = async () => {
    if (!project) return;
    const filename = defaultHandoffFilename(input);
    const api = window.electronAPI;
    if (api?.saveFile) {
      // Suggest the project's founderos_handoffs/ folder when localPath is set.
      const suggested = project.localPath
        ? `${project.localPath}/founderos_handoffs/${filename}`
        : filename;
      const res = await api.saveFile(suggested, generated);
      if (res.success) {
        toast.success(`Saved to ${res.path}`);
      } else {
        toast.message("Save canceled");
      }
      return;
    }
    // Browser fallback: download
    const blob = new Blob([generated], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AppLayout>
        <TopBar title="Generate Handoff" />
        <div className="p-6">Loading…</div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <TopBar title="Generate Handoff" />
        <div className="p-6">Project not found.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <TopBar title={`Handoff — ${project.title}`} />
      <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Claude Code Task
              </CardTitle>
              <Link href={`/projects/${project.id}`}>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to project
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Task title</Label>
              <Input
                value={input.taskTitle}
                onChange={(e) => setInput({ ...input, taskTitle: e.target.value })}
                placeholder="e.g. Add destruction tier 3 to Rage Smash"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Task type</Label>
              <Select
                value={input.taskType}
                onValueChange={(v) => setInput({ ...input, taskType: v as HandoffTaskType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a task type" />
                </SelectTrigger>
                <SelectContent>
                  {HANDOFF_TASK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Objective</Label>
              <Textarea
                rows={3}
                value={input.objective}
                onChange={(e) => setInput({ ...input, objective: e.target.value })}
                placeholder="What should Claude Code accomplish?"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Important files / folders (one per line)</Label>
              <Textarea
                rows={3}
                value={input.importantFiles}
                onChange={(e) => setInput({ ...input, importantFiles: e.target.value })}
                placeholder={"src/components/projects/QuickActions.tsx\nelectron/main.js"}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Extra constraints (one per line, optional)</Label>
              <Textarea
                rows={2}
                value={input.constraints}
                onChange={(e) => setInput({ ...input, constraints: e.target.value })}
                placeholder="e.g. Do not introduce new dependencies."
              />
            </div>

            <div className="space-y-1.5">
              <Label>Acceptance criteria (one per line)</Label>
              <Textarea
                rows={3}
                value={input.acceptanceCriteria}
                onChange={(e) => setInput({ ...input, acceptanceCriteria: e.target.value })}
                placeholder={"Build passes\nNew tier 3 appears in main menu\nNo regressions in tiers 1-2"}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  checked={input.includeToolchain}
                  onChange={(e) => setInput({ ...input, includeToolchain: e.target.checked })}
                />
                Include toolchain
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  checked={input.includeProjectContext}
                  onChange={(e) => setInput({ ...input, includeProjectContext: e.target.checked })}
                />
                Include project context
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  checked={input.includeAssetPaths}
                  onChange={(e) => setInput({ ...input, includeAssetPaths: e.target.checked })}
                />
                Include asset paths
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  checked={input.includeCommandPresets}
                  onChange={(e) => setInput({ ...input, includeCommandPresets: e.target.checked })}
                />
                Include command presets
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={copy} className="gap-2">
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy to clipboard"}
              </Button>
              <Button variant="outline" onClick={save} className="gap-2">
                <Save className="h-4 w-4" />
                Save .md file
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={generated}
              readOnly
              className="font-mono text-xs min-h-[70vh] resize-none"
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
