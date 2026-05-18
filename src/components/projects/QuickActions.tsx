"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { buildClaudeHandoffPrompt, buildMvpPlanPrompt } from "@/lib/markdown/export";
import { useAuth } from "@/hooks/useAuth";
import { getToolchain } from "@/lib/firebase/settings";
import { DEFAULT_TOOLCHAIN } from "@/lib/defaults/toolchain";
import type { Project, ToolchainDefaults } from "@/types";
import {
  Bot,
  Target,
  Copy,
  Check,
  Download,
  FolderOpen,
  TerminalSquare,
  Code2,
  Sparkles,
  Github,
  Globe,
  Flame,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

type ActionType = "build-prompt" | "mvp-plan" | null;

export function QuickActions({ project }: { project: Project }) {
  const { user } = useAuth();
  const [action, setAction] = useState<ActionType>(null);
  const [copied, setCopied] = useState(false);
  const [toolchain, setToolchainState] = useState<ToolchainDefaults>(DEFAULT_TOOLCHAIN);

  useEffect(() => {
    if (!user) return;
    getToolchain(user.uid).then(setToolchainState).catch(() => {});
  }, [user]);

  const content =
    action === "build-prompt"
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
    const api = window.electronAPI;
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

  // Desktop action helpers — gracefully no-op in browser
  const api = typeof window !== "undefined" ? window.electronAPI : undefined;
  const editorCmd = project.toolOverrides?.editor || toolchain.executables.cursor;
  const aiCmd = project.toolOverrides?.aiTool || toolchain.executables.claudeCode;
  const terminalCmd = toolchain.terminal.defaultCommand;

  const runOrToast = async (
    label: string,
    fn: () => Promise<{ success: boolean; error?: string }>,
  ) => {
    if (!api) {
      toast.error(`${label} requires the desktop app`);
      return;
    }
    const res = await fn();
    if (!res.success) toast.error(`${label} failed: ${res.error || "unknown error"}`);
  };

  const openFolder = () =>
    runOrToast("Open folder", () => api!.openFolder(project.localPath!));
  const openTerminal = () =>
    runOrToast("Open terminal", () => api!.openTerminal(project.localPath!, terminalCmd));
  const openInCursor = () =>
    runOrToast("Open in editor", () => api!.openInCursor(project.localPath!, editorCmd));
  const runClaude = () =>
    runOrToast("Launch Claude Code", () => api!.runClaudeCode(project.localPath!, aiCmd));

  const openUrl = (url: string) => {
    if (api?.openExternal) api.openExternal(url);
    else window.open(url, "_blank", "noopener,noreferrer");
  };

  const hasLocalPath = Boolean(project.localPath);
  const hasGithub = Boolean(project.githubUrl);
  const hasNetlify = Boolean(project.netlifyUrl);
  const hasFirebase = Boolean(project.firebaseUrl);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Desktop actions — require localPath */}
        {hasLocalPath && (
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={openFolder}>
              <FolderOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Folder</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={openTerminal}>
              <TerminalSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Terminal</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={openInCursor}>
              <Code2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Editor</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={runClaude}>
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Claude Code</span>
            </Button>
          </>
        )}

        {/* External links */}
        {hasGithub && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openUrl(project.githubUrl!)}>
            <Github className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </Button>
        )}
        {hasNetlify && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openUrl(project.netlifyUrl!)}>
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Netlify</span>
          </Button>
        )}
        {hasFirebase && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openUrl(project.firebaseUrl!)}>
            <Flame className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Firebase</span>
          </Button>
        )}

        {/* Handoff generator (own page) */}
        <Link href={`/projects/${project.id}/handoff`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Handoff</span>
          </Button>
        </Link>

        {/* Existing prompt builders */}
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAction("build-prompt")}>
          <Bot className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Build Prompt</span>
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAction("mvp-plan")}>
          <Target className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">MVP Plan</span>
        </Button>
      </div>

      <Dialog open={!!action} onOpenChange={(open) => { if (!open) setAction(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {title} — {project.title}
            </DialogTitle>
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
