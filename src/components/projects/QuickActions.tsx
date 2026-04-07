"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { buildClaudeHandoffPrompt, buildMvpPlanPrompt } from "@/lib/markdown/export";
import type { Project } from "@/types";
import { Bot, Target, Copy, Check, Download } from "lucide-react";

type ActionType = "build-prompt" | "mvp-plan" | null;

export function QuickActions({ project }: { project: Project }) {
  const [action, setAction] = useState<ActionType>(null);
  const [copied, setCopied] = useState(false);

  const content = action === "build-prompt"
    ? buildClaudeHandoffPrompt(project)
    : action === "mvp-plan"
    ? buildMvpPlanPrompt(project)
    : "";

  const title = action === "build-prompt" ? "Claude Build Prompt" : "MVP Plan";

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = async () => {
    const filename = `${project.slug}-${action}.md`;
    const api = (window as unknown as { electronAPI?: { exportMarkdown: (f: string, c: string) => Promise<{ success: boolean }> } }).electronAPI;
    if (api?.exportMarkdown) {
      await api.exportMarkdown(filename, content);
      return;
    }
    const blob = new Blob([content], { type: "text/markdown" });
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
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAction("build-prompt")}>
          <Bot className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Build Prompt</span>
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAction("mvp-plan")}>
          <Target className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">MVP Plan</span>
        </Button>
      </div>

      <Dialog open={!!action} onOpenChange={open => { if (!open) setAction(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{title} — {project.title}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 my-1">
            <Button variant="outline" size="sm" className="gap-2" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={download}>
              <Download className="h-3.5 w-3.5" />
              Download .md
            </Button>
          </div>
          <Textarea
            value={content}
            readOnly
            className="flex-1 font-mono text-sm resize-none min-h-[400px]"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
