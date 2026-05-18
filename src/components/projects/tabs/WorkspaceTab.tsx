"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { getToolchain } from "@/lib/firebase/settings";
import { DEFAULT_TOOLCHAIN } from "@/lib/defaults/toolchain";
import type { Project, ProjectSocialLinks, ProjectToolOverrides, ToolchainDefaults } from "@/types";
import {
  FolderOpen, TerminalSquare, Code2, Sparkles, Github, Globe, Flame, Apple, Send, ExternalLink, Play,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => Promise<void>;
}

const SOCIAL_KEYS: Array<keyof ProjectSocialLinks> = [
  "website", "youtube", "tiktok", "instagram", "x", "reddit", "facebook",
];

const TOOL_KEYS: Array<{ key: keyof ProjectToolOverrides; label: string }> = [
  { key: "aiTool", label: "AI tool" },
  { key: "editor", label: "Editor" },
  { key: "hosting", label: "Hosting" },
  { key: "domainRegistrar", label: "Domain registrar" },
  { key: "voiceProvider", label: "Voice provider" },
  { key: "artProvider", label: "Art provider" },
  { key: "videoPipeline", label: "Video pipeline" },
];

export function WorkspaceTab({ project, onUpdate }: Props) {
  const { user } = useAuth();
  const [toolchain, setToolchain] = useState<ToolchainDefaults>(DEFAULT_TOOLCHAIN);

  useEffect(() => {
    if (!user) return;
    getToolchain(user.uid).then(setToolchain).catch(() => {});
  }, [user]);

  const api = typeof window !== "undefined" ? window.electronAPI : undefined;
  const editorCmd = project.toolOverrides?.editor || toolchain.executables.cursor;
  const aiCmd = project.toolOverrides?.aiTool || toolchain.executables.claudeCode;
  const terminalCmd = toolchain.terminal.defaultCommand;

  const callApi = async (
    label: string,
    fn: (() => Promise<{ success: boolean; error?: string }>) | undefined,
  ) => {
    if (!fn || !api) {
      toast.error(`${label} requires the desktop app`);
      return;
    }
    const res = await fn();
    if (!res.success) toast.error(`${label} failed: ${res.error || "unknown error"}`);
  };

  const openUrl = (url: string) => {
    if (api?.openExternal) api.openExternal(url);
    else window.open(url, "_blank", "noopener,noreferrer");
  };

  const pickFolder = async (
    field: "localPath" | "assetPath",
  ) => {
    if (!api) {
      toast.error("Folder picker requires the desktop app");
      return;
    }
    const res = await api.selectFolder(project[field]);
    if (!res.canceled && res.path) {
      await onUpdate({ [field]: res.path });
      toast.success(`${field} updated`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
      {/* Local workspace */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="h-4 w-4" /> Local Workspace
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Local path</Label>
            <div className="flex gap-2">
              <Input
                value={project.localPath || ""}
                onChange={(e) => onUpdate({ localPath: e.target.value })}
                placeholder="C:/Projects/MyProject"
              />
              <Button variant="outline" size="sm" onClick={() => pickFolder("localPath")}>Browse…</Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5"
              disabled={!project.localPath}
              onClick={() => callApi("Open folder", api && project.localPath ? () => api.openFolder(project.localPath!) : undefined)}>
              <FolderOpen className="h-3.5 w-3.5" /> Open folder
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5"
              disabled={!project.localPath}
              onClick={() => callApi("Open terminal", api && project.localPath ? () => api.openTerminal(project.localPath!, terminalCmd) : undefined)}>
              <TerminalSquare className="h-3.5 w-3.5" /> Terminal
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5"
              disabled={!project.localPath}
              onClick={() => callApi("Open in editor", api && project.localPath ? () => api.openInCursor(project.localPath!, editorCmd) : undefined)}>
              <Code2 className="h-3.5 w-3.5" /> Editor
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5"
              disabled={!project.localPath}
              onClick={() => callApi("Launch Claude Code", api && project.localPath ? () => api.runClaudeCode(project.localPath!, aiCmd) : undefined)}>
              <Sparkles className="h-3.5 w-3.5" /> Claude Code
            </Button>
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Asset path</Label>
            <div className="flex gap-2">
              <Input
                value={project.assetPath || ""}
                onChange={(e) => onUpdate({ assetPath: e.target.value })}
                placeholder="C:/FounderOS_Assets/projects/my_project"
              />
              <Button variant="outline" size="sm" onClick={() => pickFolder("assetPath")}>Browse…</Button>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 mt-2"
              disabled={!project.assetPath}
              onClick={() => callApi("Open assets", api && project.assetPath ? () => api.openFolder(project.assetPath!) : undefined)}>
              <FolderOpen className="h-3.5 w-3.5" /> Open assets
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink className="h-4 w-4" /> Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {([
            { key: "githubUrl", label: "GitHub", icon: Github },
            { key: "netlifyUrl", label: "Netlify", icon: Globe },
            { key: "firebaseUrl", label: "Firebase Console", icon: Flame },
            { key: "appStoreConnectUrl", label: "App Store Connect", icon: Apple },
            { key: "testFlightUrl", label: "TestFlight", icon: Send },
            { key: "websiteUrl", label: "Website", icon: Globe },
          ] as const).map(({ key, label, icon: Icon }) => {
            const value = project[key] as string | undefined;
            return (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={value || ""}
                    onChange={(e) => onUpdate({ [key]: e.target.value } as Partial<Project>)}
                    placeholder={`https://…`}
                  />
                  <Button variant="outline" size="sm" disabled={!value} onClick={() => value && openUrl(value)}>Open</Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Social links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {SOCIAL_KEYS.map((k) => {
            const value = project.socialLinks?.[k] || "";
            return (
              <div key={k} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground capitalize">{k}</Label>
                <div className="flex gap-2">
                  <Input
                    value={value}
                    onChange={(e) =>
                      onUpdate({
                        socialLinks: { ...(project.socialLinks || {}), [k]: e.target.value },
                      })
                    }
                    placeholder="https://…"
                  />
                  <Button variant="outline" size="sm" disabled={!value} onClick={() => value && openUrl(value)}>Open</Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Tool overrides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tool Overrides</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Leave blank to use your global toolchain defaults from Settings.
          </p>
          {TOOL_KEYS.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input
                value={project.toolOverrides?.[key] || ""}
                onChange={(e) =>
                  onUpdate({
                    toolOverrides: { ...(project.toolOverrides || {}), [key]: e.target.value },
                  })
                }
                placeholder="(use default)"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Command presets (read + run; full CRUD is Phase 2) */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Command Presets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {project.commandPresets && project.commandPresets.length > 0 ? (
            project.commandPresets.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded border border-border">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{c.label}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">{c.command}</div>
                  {c.workingDirectory && (
                    <div className="text-xs text-muted-foreground truncate">cwd: {c.workingDirectory}</div>
                  )}
                </div>
                <Button variant="outline" size="sm" className="gap-1.5"
                  onClick={() => callApi(`Run ${c.label}`, api ? () => api.runCommand(c) : undefined)}>
                  <Play className="h-3.5 w-3.5" /> Run
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No command presets defined. Adding presets via UI is planned for Phase 2 — for now, you can set them in seed.ts or via Firestore.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
