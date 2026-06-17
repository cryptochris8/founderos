import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./config";
import type { Project, ProjectStage, ProjectPriority } from "@/types";

function toTimestampString(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === "string") return ts;
  return new Date().toISOString();
}

function docToProject(docSnapshot: { id: string; data: () => Record<string, unknown> }): Project {
  const data = docSnapshot.data();
  // Spread the stored document first so optional fields added over time
  // (workspace paths, links, social, tool overrides, command presets, Claude
  // context, marketing notes, launch checklist, …) survive the round-trip
  // instead of being silently dropped. Then normalize the id, the required
  // fields, the array fields (default to []), and the Timestamp-valued date
  // fields. Mirrors the deserialization style used in subcollections.ts and
  // globals.ts, and keeps this mapper from drifting out of sync with Project.
  return {
    ...(data as Partial<Project>),
    id: docSnapshot.id,
    ownerId: (data.ownerId as string) || "",
    title: (data.title as string) || "",
    slug: (data.slug as string) || "",
    shortDescription: (data.shortDescription as string) || "",
    categoryId: (data.categoryId as string) || "",
    tags: (data.tags as string[]) || [],
    stage: (data.stage as ProjectStage) || "Idea",
    priority: (data.priority as ProjectPriority) || "Medium",
    percentComplete: (data.percentComplete as number) || 0,
    techStack: (data.techStack as string[]) || [],
    platformTargets: (data.platformTargets as string[]) || [],
    dependencies: (data.dependencies as string[]) || [],
    blockers: (data.blockers as string[]) || [],
    repoLinks: (data.repoLinks as string[]) || [],
    deploymentLinks: (data.deploymentLinks as string[]) || [],
    externalToolLinks: (data.externalToolLinks as string[]) || [],
    isArchived: (data.isArchived as boolean) || false,
    createdAt: toTimestampString(data.createdAt),
    updatedAt: toTimestampString(data.updatedAt),
    lastViewedAt: data.lastViewedAt ? toTimestampString(data.lastViewedAt) : undefined,
  };
}

export async function getProjects(userId: string): Promise<Project[]> {
  const q = query(
    collection(db, "users", userId, "projects"),
    where("isArchived", "==", false),
    orderBy("updatedAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToProject);
}

export async function getProject(userId: string, projectId: string): Promise<Project | null> {
  const docRef = doc(db, "users", userId, "projects", projectId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return docToProject({ id: snapshot.id, data: () => snapshot.data() as Record<string, unknown> });
}

export async function createProject(userId: string, data: Omit<Project, "id" | "ownerId" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "users", userId, "projects"), {
    ...data,
    ownerId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProject(userId: string, projectId: string, data: Partial<Project>): Promise<void> {
  const docRef = doc(db, "users", userId, "projects", projectId);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  const docRef = doc(db, "users", userId, "projects", projectId);
  await deleteDoc(docRef);
}
