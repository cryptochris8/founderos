import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, orderBy, query, serverTimestamp, Timestamp
} from "firebase/firestore";
import { db } from "./config";
import type { ProjectPrompt, ProjectDocument, ProjectTask, ProjectMilestone, ProjectAsset, ChecklistItem } from "@/types";

function toStr(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === "string") return ts;
  return new Date().toISOString();
}

// ── Prompts ──────────────────────────────────────────────────────────────────

export async function getPrompts(userId: string, projectId: string): Promise<ProjectPrompt[]> {
  const q = query(collection(db, "users", userId, "projects", projectId, "prompts"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id, createdAt: toStr(d.data().createdAt), updatedAt: toStr(d.data().updatedAt) } as ProjectPrompt));
}

export async function addPrompt(userId: string, projectId: string, data: Omit<ProjectPrompt, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "users", userId, "projects", projectId, "prompts"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updatePrompt(userId: string, projectId: string, promptId: string, data: Partial<ProjectPrompt>): Promise<void> {
  await updateDoc(doc(db, "users", userId, "projects", projectId, "prompts", promptId), { ...data, updatedAt: serverTimestamp() });
}

export async function deletePrompt(userId: string, projectId: string, promptId: string): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "projects", projectId, "prompts", promptId));
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function getDocuments(userId: string, projectId: string): Promise<ProjectDocument[]> {
  const q = query(collection(db, "users", userId, "projects", projectId, "documents"), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id, createdAt: toStr(d.data().createdAt), updatedAt: toStr(d.data().updatedAt) } as ProjectDocument));
}

export async function addDocument(userId: string, projectId: string, data: Omit<ProjectDocument, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "users", userId, "projects", projectId, "documents"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateDocument(userId: string, projectId: string, docId: string, data: Partial<ProjectDocument>): Promise<void> {
  await updateDoc(doc(db, "users", userId, "projects", projectId, "documents", docId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteDocument(userId: string, projectId: string, docId: string): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "projects", projectId, "documents", docId));
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function getTasks(userId: string, projectId: string): Promise<ProjectTask[]> {
  const q = query(collection(db, "users", userId, "projects", projectId, "tasks"), orderBy("sortOrder", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id, createdAt: toStr(d.data().createdAt), updatedAt: toStr(d.data().updatedAt) } as ProjectTask));
}

export async function addTask(userId: string, projectId: string, data: Omit<ProjectTask, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "users", userId, "projects", projectId, "tasks"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateTask(userId: string, projectId: string, taskId: string, data: Partial<ProjectTask>): Promise<void> {
  await updateDoc(doc(db, "users", userId, "projects", projectId, "tasks", taskId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTask(userId: string, projectId: string, taskId: string): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "projects", projectId, "tasks", taskId));
}

// ── Milestones ────────────────────────────────────────────────────────────────

export async function getMilestones(userId: string, projectId: string): Promise<ProjectMilestone[]> {
  const q = query(collection(db, "users", userId, "projects", projectId, "milestones"), orderBy("sortOrder", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id, createdAt: toStr(d.data().createdAt), updatedAt: toStr(d.data().updatedAt) } as ProjectMilestone));
}

export async function addMilestone(userId: string, projectId: string, data: Omit<ProjectMilestone, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "users", userId, "projects", projectId, "milestones"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateMilestone(userId: string, projectId: string, milestoneId: string, data: Partial<ProjectMilestone>): Promise<void> {
  await updateDoc(doc(db, "users", userId, "projects", projectId, "milestones", milestoneId), { ...data, updatedAt: serverTimestamp() });
}

// ── Assets ────────────────────────────────────────────────────────────────────

export async function getAssets(userId: string, projectId: string): Promise<ProjectAsset[]> {
  const q = query(collection(db, "users", userId, "projects", projectId, "assets"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id, createdAt: toStr(d.data().createdAt), updatedAt: toStr(d.data().updatedAt) } as ProjectAsset));
}

export async function addAsset(userId: string, projectId: string, data: Omit<ProjectAsset, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "users", userId, "projects", projectId, "assets"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function deleteAsset(userId: string, projectId: string, assetId: string): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "projects", projectId, "assets", assetId));
}

// ── Checklist ─────────────────────────────────────────────────────────────────

export async function getChecklist(userId: string, projectId: string): Promise<ChecklistItem[]> {
  const q = query(collection(db, "users", userId, "projects", projectId, "checklist_items"), orderBy("sortOrder", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id, createdAt: toStr(d.data().createdAt), updatedAt: toStr(d.data().updatedAt) } as ChecklistItem));
}

export async function addChecklistItem(userId: string, projectId: string, data: Omit<ChecklistItem, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "users", userId, "projects", projectId, "checklist_items"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateChecklistItem(userId: string, projectId: string, itemId: string, data: Partial<ChecklistItem>): Promise<void> {
  await updateDoc(doc(db, "users", userId, "projects", projectId, "checklist_items", itemId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteChecklistItem(userId: string, projectId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "projects", projectId, "checklist_items", itemId));
}
