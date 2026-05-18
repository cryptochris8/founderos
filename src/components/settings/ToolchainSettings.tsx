"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { getToolchain, setToolchain } from "@/lib/firebase/settings";
import { DEFAULT_TOOLCHAIN } from "@/lib/defaults/toolchain";
import type { ToolchainDefaults } from "@/types";
import { toast } from "sonner";
import { Wrench, FolderTree, Terminal } from "lucide-react";

export function ToolchainSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ToolchainDefaults>(DEFAULT_TOOLCHAIN);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    getToolchain(user.uid)
      .then((s) => {
        if (!cancelled) setSettings(s);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load toolchain settings");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setToolchain(user.uid, settings);
      toast.success("Toolchain settings saved");
    } catch {
      toast.error("Saved locally — could not sync to Firestore");
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, value: string, onChange: (v: string) => void, placeholder?: string) => (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={loading} />
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Toolchain Defaults
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field("Default AI tool", settings.ai.defaultAI, (v) =>
              setSettings({ ...settings, ai: { ...settings.ai, defaultAI: v } }),
            )}
            {field("Default editor", settings.ai.defaultEditor, (v) =>
              setSettings({ ...settings, ai: { ...settings.ai, defaultEditor: v } }),
            )}
            {field("Fallback editor", settings.ai.fallbackEditor, (v) =>
              setSettings({ ...settings, ai: { ...settings.ai, fallbackEditor: v } }),
            )}
            {field("Website hosting", settings.hosting.websiteHosting, (v) =>
              setSettings({ ...settings, hosting: { ...settings.hosting, websiteHosting: v } }),
            )}
            {field("Domain registrar", settings.hosting.domainRegistrar, (v) =>
              setSettings({ ...settings, hosting: { ...settings.hosting, domainRegistrar: v } }),
            )}
            {field("Voice / SFX provider", settings.audio.voiceProvider, (v) =>
              setSettings({ ...settings, audio: { ...settings.audio, voiceProvider: v } }),
            )}
            {field("Art provider", settings.images.artProvider, (v) =>
              setSettings({ ...settings, images: { ...settings.images, artProvider: v } }),
            )}
            {field("Video pipeline", settings.video.videoAutomation, (v) =>
              setSettings({ ...settings, video: { ...settings.video, videoAutomation: v } }),
            )}
            {field("Dictation tool", settings.dictation.dictation, (v) =>
              setSettings({ ...settings, dictation: { ...settings.dictation, dictation: v } }),
            )}
            {field("Default terminal", settings.terminal.defaultCommand, (v) =>
              setSettings({ ...settings, terminal: { ...settings.terminal, defaultCommand: v } }),
              "e.g. wt.exe, powershell.exe, cmd.exe",
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Executables
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Commands or full paths used when launching tools from project quick actions. Leave defaults
            unless the tool is installed somewhere outside your PATH.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field(
              "Claude Code command",
              settings.executables.claudeCode,
              (v) => setSettings({ ...settings, executables: { ...settings.executables, claudeCode: v } }),
              "claude",
            )}
            {field(
              "Cursor command",
              settings.executables.cursor,
              (v) => setSettings({ ...settings, executables: { ...settings.executables, cursor: v } }),
              "cursor",
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Asset Library
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Root folders for global assets and exports. Per-project asset paths are configured on each project.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field(
              "Global asset library",
              settings.paths.globalAssetLibrary,
              (v) => setSettings({ ...settings, paths: { ...settings.paths, globalAssetLibrary: v } }),
              "C:/FounderOS_Assets",
            )}
            {field(
              "Global exports",
              settings.paths.globalExports,
              (v) => setSettings({ ...settings, paths: { ...settings.paths, globalExports: v } }),
              "C:/FounderOS_Assets/exports",
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button onClick={save} disabled={saving || loading}>
          {saving ? "Saving..." : "Save toolchain settings"}
        </Button>
      </div>
      <Separator />
    </>
  );
}
