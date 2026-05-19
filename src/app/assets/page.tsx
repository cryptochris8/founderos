"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getProjects } from "@/lib/firebase/projects";
import { getToolchain } from "@/lib/firebase/settings";
import { DEFAULT_TOOLCHAIN } from "@/lib/defaults/toolchain";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Project, ToolchainDefaults } from "@/types";
import { FolderOpen, Images, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function AssetsPage() {
  const { user } = useAuth();
  const [toolchain, setToolchain] = useState<ToolchainDefaults>(DEFAULT_TOOLCHAIN);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPath, setSavingPath] = useState<"library" | "exports" | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([getToolchain(user.uid), getProjects(user.uid)])
      .then(([tc, ps]) => {
        setToolchain(tc);
        setProjects(ps);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const api = typeof window !== "undefined" ? window.electronAPI : undefined;
  const libraryPath = toolchain.paths.globalAssetLibrary;
  const exportsPath = toolchain.paths.globalExports;

  const openFolder = async (folderPath: string | undefined, label: string) => {
    if (!folderPath) {
      toast.error(`No ${label.toLowerCase()} path set`);
      return;
    }
    if (!api) {
      toast.error("Opening folders requires the desktop app");
      return;
    }
    const res = await api.openFolder(folderPath);
    if (!res.success) toast.error(`Open failed: ${res.error || "unknown error"}`);
  };

  const browseFolder = async (kind: "library" | "exports") => {
    if (!api) {
      toast.error("Folder picker requires the desktop app");
      return;
    }
    const current = kind === "library" ? libraryPath : exportsPath;
    const res = await api.selectFolder(current);
    if (res.canceled || !res.path || !user) return;
    setSavingPath(kind);
    try {
      const { setToolchain: persist } = await import("@/lib/firebase/settings");
      const next: ToolchainDefaults = {
        ...toolchain,
        paths: {
          ...toolchain.paths,
          ...(kind === "library" ? { globalAssetLibrary: res.path } : { globalExports: res.path }),
        },
      };
      await persist(user.uid, { paths: next.paths });
      setToolchain(next);
      toast.success(`${kind === "library" ? "Asset library" : "Exports"} path updated`);
    } catch {
      toast.error("Failed to save path");
    } finally {
      setSavingPath(null);
    }
  };

  const projectsWithAssets = projects.filter((p) => p.assetPath);
  const projectsMissingAssets = projects.filter((p) => !p.assetPath && !p.isArchived);

  return (
    <AppLayout>
      <TopBar title="Asset Library" />
      <div className="p-6 space-y-6">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Images className="h-4 w-4" /> Global Asset Library
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Path</Label>
                    <div className="flex gap-2">
                      <Input value={libraryPath || ""} readOnly placeholder="Not set" className="font-mono text-xs" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => browseFolder("library")}
                        disabled={savingPath !== null}
                      >
                        Browse…
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => openFolder(libraryPath, "Global asset library")}
                    disabled={!libraryPath}
                  >
                    <FolderOpen className="h-3.5 w-3.5" /> Open folder
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Shared assets used across projects: logos, fonts, music, SFX, voiceover templates, and render presets.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Download className="h-4 w-4" /> Exports
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Path</Label>
                    <div className="flex gap-2">
                      <Input value={exportsPath || ""} readOnly placeholder="Not set" className="font-mono text-xs" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => browseFolder("exports")}
                        disabled={savingPath !== null}
                      >
                        Browse…
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => openFolder(exportsPath, "Exports")}
                    disabled={!exportsPath}
                  >
                    <FolderOpen className="h-3.5 w-3.5" /> Open folder
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Final renders: marketing videos, social cuts, App Store assets, and KDP exports.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Asset Folders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {projectsWithAssets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No projects have an asset folder configured yet.
                  </p>
                ) : (
                  projectsWithAssets.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-2 rounded border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          {p.assetPath}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => openFolder(p.assetPath, `${p.title} assets`)}
                      >
                        <FolderOpen className="h-3.5 w-3.5" /> Open
                      </Button>
                      <Link href={`/projects/${p.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5" /> Project
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {projectsMissingAssets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-muted-foreground">
                    Needs an asset folder ({projectsMissingAssets.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {projectsMissingAssets.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="flex items-center justify-between p-2 rounded hover:bg-accent transition-colors text-sm"
                    >
                      <span>{p.title}</span>
                      <span className="text-xs text-muted-foreground">Set in Workspace tab</span>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
