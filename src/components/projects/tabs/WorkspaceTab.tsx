"use client";
import { useEffect, useRef, useState } from "react";
import { useDebouncedUpdater } from "@/hooks/useDebouncedUpdater";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { getToolchain } from "@/lib/firebase/settings";
import { DEFAULT_TOOLCHAIN } from "@/lib/defaults/toolchain";
import type { Project, ProjectCommand, ProjectSocialLinks, ProjectToolOverrides, ToolchainDefaults } from "@/types";
import {
  FolderOpen, TerminalSquare, Code2, Sparkles, Github, Globe, Flame, Apple, Send, ExternalLink, Play,
  Plus, Pencil, Trash2,
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

const EMPTY_DRAFT: ProjectCommand = { id: "", label: "", command: "" };

export function WorkspaceTab({ project, onUpdate }: Props) {
  const { user } = useAuth();
  const [toolchain, setToolchain] = useState<ToolchainDefaults>(DEFAULT_TOOLCHAIN);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProjectCommand>(EMPTY_DRAFT);

  useEffect(() => {
    if (!user) return;
    getToolchain(user.uid).then(setToolchain).catch(() => {});
  }, [user]);

  // Free-text workspace fields (paths, links, social, tool overrides) are
  // edited against a local mirror for instant feedback and persisted on a
  // debounce, so typing doesn't fire a Firestore write per keystroke. Command
  // presets are discrete actions and persist immediately, so they keep reading
  // from `project` directly. The mirror re-syncs only when a different project
  // loads, so an in-flight edit is never clobbered by its own debounced write.
  const [form, setForm] = useState(project);
  // Keep a ref to the latest form so nested-object change handlers (social /
  // tool overrides) can rebuild the full sub-object without a stale closure.
  // Updated in an effect — never assigned during render (rules of refs).
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  });
  // Re-sync the mirror only when a different project loads, so an in-flight
  // edit isn't clobbered by its own debounced write (which yields a new
  // project object with the same id). This is React's recommended "adjust
  // state during render when a prop changes" pattern (no effect needed).
  const [syncedId, setSyncedId] = useState(project.id);
  if (project.id !== syncedId) {
    setSyncedId(project.id);
    setForm(project);
  }
  const { push, flush } = useDebouncedUpdater<Project>(onUpdate, 600);

  type StringField =
    | "localPath" | "assetPath" | "githubUrl" | "netlifyUrl" | "firebaseUrl"
    | "appStoreConnectUrl" | "testFlightUrl" | "websiteUrl";
  const setField = (key: StringField, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    push({ [key]: value } as Partial<Project>);
  };
  const setSocial = (k: keyof ProjectSocialLinks, value: string) => {
    const socialLinks = { ...(formRef.current.socialLinks || {}), [k]: value };
    setForm((f) => ({ ...f, socialLinks }));
    push({ socialLinks });
  };
  const setTool = (k: keyof ProjectToolOverrides, value: string) => {
    const toolOverrides = { ...(formRef.current.toolOverrides || {}), [k]: value };
    setForm((f) => ({ ...f, toolOverrides }));
    push({ toolOverrides });
  };

  const presets = project.commandPresets || [];
  const isNewPreset = editingId !== null && !presets.some((p) => p.id === editingId);

  const startAdd = () => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setDraft({ id, label: "", command: "" });
    setEditingId(id);
  };

  const startEdit = (preset: ProjectCommand) => {
    setDraft({ ...preset });
    setEditingId(preset.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  const saveEdit = async () => {
    const label = draft.label.trim();
    const command = draft.command.trim();
    if (!label || !command) {
      toast.error("Label and command are required");
      return;
    }
    const cleaned: ProjectCommand = {
      id: draft.id,
      label,
      command,
      ...(draft.workingDirectory?.trim() ? { workingDirectory: draft.workingDirectory.trim() } : {}),
      ...(draft.description?.trim() ? { description: draft.description.trim() } : {}),
    };
    const exists = presets.some((p) => p.id === draft.id);
    const next = exists
      ? presets.map((p) => (p.id === draft.id ? cleaned : p))
      : [...presets, cleaned];
    await onUpdate({ commandPresets: next });
    toast.success(exists ? "Preset updated" : "Preset added");
    cancelEdit();
  };

  const deletePreset = async (id: string) => {
    await onUpdate({ commandPresets: presets.filter((p) => p.id !== id) });
    toast.success("Preset deleted");
  };

  const renderEditRow = (key: string) => (
    <div key={key} className="p-3 rounded border border-border space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Label</Label>
          <Input
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            placeholder="Install deps"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Working directory (optional)</Label>
          <Input
            value={draft.workingDirectory || ""}
            onChange={(e) => setDraft({ ...draft, workingDirectory: e.target.value })}
            placeholder="(uses project local path)"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Command</Label>
        <Input
          value={draft.command}
          onChange={(e) => setDraft({ ...draft, command: e.target.value })}
          placeholder="npm install"
          className="font-mono"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Description (optional)</Label>
        <Input
          value={draft.description || ""}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="What does this do?"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
        <Button size="sm" onClick={saveEdit}>Save</Button>
      </div>
    </div>
  );

  const api = typeof window !== "undefined" ? window.electronAPI : undefined;
  const editorCmd = form.toolOverrides?.editor || toolchain.executables.cursor;
  const aiCmd = form.toolOverrides?.aiTool || toolchain.executables.claudeCode;
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
    const res = await api.selectFolder(form[field]);
    if (!res.canceled && res.path) {
      setForm((f) => ({ ...f, [field]: res.path }));
      push({ [field]: res.path } as Partial<Project>);
      flush(); // discrete action — persist immediately rather than waiting
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
                value={form.localPath || ""}
                onChange={(e) => setField("localPath", e.target.value)}
                placeholder="C:/Projects/MyProject"
              />
              <Button variant="outline" size="sm" onClick={() => pickFolder("localPath")}>Browse…</Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5"
              disabled={!form.localPath}
              onClick={() => callApi("Open folder", api && form.localPath ? () => api.openFolder(form.localPath!) : undefined)}>
              <FolderOpen className="h-3.5 w-3.5" /> Open folder
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5"
              disabled={!form.localPath}
              onClick={() => callApi("Open terminal", api && form.localPath ? () => api.openTerminal(form.localPath!, terminalCmd) : undefined)}>
              <TerminalSquare className="h-3.5 w-3.5" /> Terminal
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5"
              disabled={!form.localPath}
              onClick={() => callApi("Open in editor", api && form.localPath ? () => api.openInCursor(form.localPath!, editorCmd) : undefined)}>
              <Code2 className="h-3.5 w-3.5" /> Editor
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5"
              disabled={!form.localPath}
              onClick={() => callApi("Launch Claude Code", api && form.localPath ? () => api.runClaudeCode(form.localPath!, aiCmd) : undefined)}>
              <Sparkles className="h-3.5 w-3.5" /> Claude Code
            </Button>
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Asset path</Label>
            <div className="flex gap-2">
              <Input
                value={form.assetPath || ""}
                onChange={(e) => setField("assetPath", e.target.value)}
                placeholder="C:/FounderOS_Assets/projects/my_project"
              />
              <Button variant="outline" size="sm" onClick={() => pickFolder("assetPath")}>Browse…</Button>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 mt-2"
              disabled={!form.assetPath}
              onClick={() => callApi("Open assets", api && form.assetPath ? () => api.openFolder(form.assetPath!) : undefined)}>
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
            const value = form[key] as string | undefined;
            return (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={value || ""}
                    onChange={(e) => setField(key, e.target.value)}
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
            const value = form.socialLinks?.[k] || "";
            return (
              <div key={k} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground capitalize">{k}</Label>
                <div className="flex gap-2">
                  <Input
                    value={value}
                    onChange={(e) => setSocial(k, e.target.value)}
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
                value={form.toolOverrides?.[key] || ""}
                onChange={(e) => setTool(key, e.target.value)}
                placeholder="(use default)"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Command presets */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Command Presets</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={startAdd}
            disabled={editingId !== null}
          >
            <Plus className="h-3.5 w-3.5" /> Add preset
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {presets.length === 0 && editingId === null && (
            <p className="text-sm text-muted-foreground">
              No command presets defined. Click &quot;Add preset&quot; to create one.
            </p>
          )}
          {presets.map((c) =>
            editingId === c.id ? (
              renderEditRow(c.id)
            ) : (
              <div key={c.id} className="flex items-center gap-2 p-2 rounded border border-border">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{c.label}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">{c.command}</div>
                  {c.workingDirectory && (
                    <div className="text-xs text-muted-foreground truncate">cwd: {c.workingDirectory}</div>
                  )}
                  {c.description && (
                    <div className="text-xs text-muted-foreground truncate">{c.description}</div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => callApi(`Run ${c.label}`, api ? () => api.runCommand(c) : undefined)}
                  disabled={editingId !== null}
                >
                  <Play className="h-3.5 w-3.5" /> Run
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(c)}
                  disabled={editingId !== null}
                  aria-label="Edit preset"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deletePreset(c.id)}
                  disabled={editingId !== null}
                  aria-label="Delete preset"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
          )}
          {isNewPreset && renderEditRow(draft.id)}
        </CardContent>
      </Card>
    </div>
  );
}
