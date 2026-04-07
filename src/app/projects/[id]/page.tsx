"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getProject, updateProject, deleteProject } from "@/lib/firebase/projects";
import {
  getPrompts, getDocuments, getTasks, getMilestones, getAssets, getChecklist, getNotes,
  addPrompt, updatePrompt, deletePrompt,
  addDocument, updateDocument, deleteDocument,
  addTask, updateTask, deleteTask,
  addMilestone, updateMilestone,
  addAsset, deleteAsset,
  addChecklistItem, updateChecklistItem, deleteChecklistItem,
  addNote, updateNote, deleteNote
} from "@/lib/firebase/subcollections";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StageBadge } from "@/components/projects/StageBadge";
import { PriorityBadge } from "@/components/projects/PriorityBadge";
import { OverviewTab } from "@/components/projects/tabs/OverviewTab";
import { StatusTab } from "@/components/projects/tabs/StatusTab";
import { RoadmapTab } from "@/components/projects/tabs/RoadmapTab";
import { PromptsTab } from "@/components/projects/tabs/PromptsTab";
import { DocumentsTab } from "@/components/projects/tabs/DocumentsTab";
import { AssetsTab } from "@/components/projects/tabs/AssetsTab";
import { MilestonesTab } from "@/components/projects/tabs/MilestonesTab";
import { ChecklistTab } from "@/components/projects/tabs/ChecklistTab";
import { NotesTab } from "@/components/projects/tabs/NotesTab";
import { ExportModal } from "@/components/projects/ExportModal";
import { ProjectEditForm } from "@/components/projects/ProjectEditForm";
import type {
  Project, ProjectPrompt, ProjectDocument, ProjectTask,
  ProjectMilestone, ProjectAsset, ChecklistItem, ProjectNote
} from "@/types";
import { ArrowLeft, Download, Pencil, Trash2 } from "lucide-react";
import { ProjectDetailSkeleton } from "@/components/shared/Skeleton";
import Link from "next/link";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showExport, setShowExport] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  // Subcollection data - loaded lazily per tab
  const [prompts, setPrompts] = useState<ProjectPrompt[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [notes, setNotes] = useState<ProjectNote[]>([]);

  const loadedTabs = useState<Set<string>>(new Set(["overview"]))[0];

  useEffect(() => {
    if (!user || !params.id) return;
    getProject(user.uid, params.id).then(p => {
      setProject(p);
      setLoading(false);
    });
  }, [user, params.id]);

  const loadTabData = useCallback(async (tab: string) => {
    if (!user || !params.id || loadedTabs.has(tab)) return;
    loadedTabs.add(tab);
    if (tab === "prompts") setPrompts(await getPrompts(user.uid, params.id));
    if (tab === "documents") setDocuments(await getDocuments(user.uid, params.id));
    if (tab === "status") setTasks(await getTasks(user.uid, params.id));
    if (tab === "milestones") setMilestones(await getMilestones(user.uid, params.id));
    if (tab === "assets") setAssets(await getAssets(user.uid, params.id));
    if (tab === "checklist") setChecklist(await getChecklist(user.uid, params.id));
    if (tab === "notes") setNotes(await getNotes(user.uid, params.id));
  }, [user, params.id, loadedTabs]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    loadTabData(tab);
  };

  const handleUpdateProject = async (updates: Partial<Project>) => {
    if (!user || !project) return;
    await updateProject(user.uid, project.id, updates);
    setProject(prev => prev ? { ...prev, ...updates } : null);
    setShowEdit(false);
  };

  const handleDeleteProject = async () => {
    if (!user || !project) return;
    if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    await deleteProject(user.uid, project.id);
    router.push("/projects");
  };

  if (loading) {
    return (
      <AppLayout>
        <ProjectDetailSkeleton />
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Project not found.</p>
          <Link href="/projects"><Button className="mt-4" variant="outline">Back to Projects</Button></Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <TopBar title={project.title} />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Projects
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{project.title}</h1>
                <StageBadge stage={project.stage} />
                <PriorityBadge priority={project.priority} />
              </div>
              <p className="text-muted-foreground">{project.shortDescription}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{project.percentComplete}% complete</span>
                {project.nextAction && <span className="text-foreground/70">Next: {project.nextAction}</span>}
              </div>
              <div className="max-w-sm">
                <Progress value={project.percentComplete} className="h-2" />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowExport(true)}>
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Dialog open={showEdit} onOpenChange={setShowEdit}>
                <DialogTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                  </DialogHeader>
                  <ProjectEditForm project={project} onSave={handleUpdateProject} onCancel={() => setShowEdit(false)} />
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleDeleteProject}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab project={project} onUpdate={handleUpdateProject} /></TabsContent>
          <TabsContent value="status">
            <StatusTab project={project} tasks={tasks} onUpdateProject={handleUpdateProject}
              onAddTask={async (t) => { if (!user) return; const id = await addTask(user.uid, params.id, t); setTasks(prev => [...prev, { ...t, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]); }}
              onUpdateTask={async (id, t) => { if (!user) return; await updateTask(user.uid, params.id, id, t); setTasks(prev => prev.map(x => x.id === id ? { ...x, ...t } : x)); }}
              onDeleteTask={async (id) => { if (!user) return; await deleteTask(user.uid, params.id, id); setTasks(prev => prev.filter(x => x.id !== id)); }}
            />
          </TabsContent>
          <TabsContent value="roadmap"><RoadmapTab project={project} onUpdate={handleUpdateProject} /></TabsContent>
          <TabsContent value="prompts">
            <PromptsTab prompts={prompts}
              onAdd={async (p) => { if (!user) return; const id = await addPrompt(user.uid, params.id, p); setPrompts(prev => [{ ...p, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev]); }}
              onUpdate={async (id, p) => { if (!user) return; await updatePrompt(user.uid, params.id, id, p); setPrompts(prev => prev.map(x => x.id === id ? { ...x, ...p } : x)); }}
              onDelete={async (id) => { if (!user) return; await deletePrompt(user.uid, params.id, id); setPrompts(prev => prev.filter(x => x.id !== id)); }}
            />
          </TabsContent>
          <TabsContent value="documents">
            <DocumentsTab documents={documents}
              onAdd={async (d) => { if (!user) return; const id = await addDocument(user.uid, params.id, d); setDocuments(prev => [{ ...d, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev]); }}
              onUpdate={async (id, d) => { if (!user) return; await updateDocument(user.uid, params.id, id, d); setDocuments(prev => prev.map(x => x.id === id ? { ...x, ...d } : x)); }}
              onDelete={async (id) => { if (!user) return; await deleteDocument(user.uid, params.id, id); setDocuments(prev => prev.filter(x => x.id !== id)); }}
            />
          </TabsContent>
          <TabsContent value="assets">
            <AssetsTab assets={assets}
              onAdd={async (a) => { if (!user) return; const id = await addAsset(user.uid, params.id, a); setAssets(prev => [{ ...a, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev]); }}
              onDelete={async (id) => { if (!user) return; await deleteAsset(user.uid, params.id, id); setAssets(prev => prev.filter(x => x.id !== id)); }}
            />
          </TabsContent>
          <TabsContent value="milestones">
            <MilestonesTab milestones={milestones}
              onAdd={async (m) => { if (!user) return; const id = await addMilestone(user.uid, params.id, m); setMilestones(prev => [...prev, { ...m, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]); }}
              onUpdate={async (id, m) => { if (!user) return; await updateMilestone(user.uid, params.id, id, m); setMilestones(prev => prev.map(x => x.id === id ? { ...x, ...m } : x)); }}
            />
          </TabsContent>
          <TabsContent value="checklist">
            <ChecklistTab items={checklist}
              onAdd={async (item) => { if (!user) return; const id = await addChecklistItem(user.uid, params.id, item); setChecklist(prev => [...prev, { ...item, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]); }}
              onUpdate={async (id, item) => { if (!user) return; await updateChecklistItem(user.uid, params.id, id, item); setChecklist(prev => prev.map(x => x.id === id ? { ...x, ...item } : x)); }}
              onDelete={async (id) => { if (!user) return; await deleteChecklistItem(user.uid, params.id, id); setChecklist(prev => prev.filter(x => x.id !== id)); }}
            />
          </TabsContent>
          <TabsContent value="notes">
            <NotesTab notes={notes}
              onAdd={async (n) => { if (!user) return; const id = await addNote(user.uid, params.id, n); setNotes(prev => [{ ...n, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev]); }}
              onUpdate={async (id, n) => { if (!user) return; await updateNote(user.uid, params.id, id, n); setNotes(prev => prev.map(x => x.id === id ? { ...x, ...n } : x)); }}
              onDelete={async (id) => { if (!user) return; await deleteNote(user.uid, params.id, id); setNotes(prev => prev.filter(x => x.id !== id)); }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {showExport && (
        <ExportModal project={project} prompts={prompts} checklist={checklist} milestones={milestones} onClose={() => setShowExport(false)} />
      )}
    </AppLayout>
  );
}
