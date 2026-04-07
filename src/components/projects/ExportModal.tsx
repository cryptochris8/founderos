"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { buildFullProjectSpecMarkdown, buildMvpSpecMarkdown, buildPromptPackMarkdown } from "@/lib/markdown/export";
import type { Project, ProjectPrompt, ChecklistItem, ProjectMilestone } from "@/types";
import { Copy, Download, Check } from "lucide-react";

interface Props {
  project: Project;
  prompts: ProjectPrompt[];
  checklist: ChecklistItem[];
  milestones: ProjectMilestone[];
  onClose: () => void;
}

type ExportType = "full-spec" | "mvp-spec" | "prompt-pack";

export function ExportModal({ project, prompts, checklist, milestones, onClose }: Props) {
  const [exportType, setExportType] = useState<ExportType>("full-spec");
  const [copied, setCopied] = useState(false);

  const generateMarkdown = () => {
    switch (exportType) {
      case "full-spec":
        return buildFullProjectSpecMarkdown(project, { prompts, checklist, milestones });
      case "mvp-spec":
        return buildMvpSpecMarkdown(project);
      case "prompt-pack":
        return buildPromptPackMarkdown(project, prompts);
    }
  };

  const markdown = generateMarkdown();

  const copy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = async () => {
    const filename = `${project.slug}-${exportType}.md`;
    // Use native file save dialog when running in Electron
    const api = (window as unknown as { electronAPI?: { exportMarkdown: (f: string, c: string) => Promise<{ success: boolean }> } }).electronAPI;
    if (api?.exportMarkdown) {
      await api.exportMarkdown(filename, markdown);
      return;
    }
    // Fallback: browser download
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Export Markdown — {project.title}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4 my-2">
          <div className="space-y-1 flex-1">
            <Label className="text-xs">Export Type</Label>
            <Select value={exportType} onValueChange={v => { if (v) setExportType(v as ExportType); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-spec">Full Project Spec</SelectItem>
                <SelectItem value="mvp-spec">MVP Build Spec</SelectItem>
                <SelectItem value="prompt-pack">Prompt Pack</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" className="gap-2" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={download}>
              <Download className="h-3.5 w-3.5" />
              Download .md
            </Button>
          </div>
        </div>
        <Textarea
          value={markdown}
          readOnly
          className="flex-1 font-mono text-sm resize-none min-h-[400px]"
        />
      </DialogContent>
    </Dialog>
  );
}
