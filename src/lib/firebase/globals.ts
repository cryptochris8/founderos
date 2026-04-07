import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, orderBy, query, serverTimestamp, Timestamp
} from "firebase/firestore";
import { db } from "./config";
import type { GlobalPrompt, ProjectDocument } from "@/types";

function toStr(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === "string") return ts;
  return new Date().toISOString();
}

// ── Global Prompts ───────────────────────────────────────────────────────────

export async function getGlobalPrompts(userId: string): Promise<GlobalPrompt[]> {
  const q = query(collection(db, "users", userId, "global_prompts"), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id, createdAt: toStr(d.data().createdAt), updatedAt: toStr(d.data().updatedAt) } as GlobalPrompt));
}

export async function addGlobalPrompt(userId: string, data: Omit<GlobalPrompt, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "users", userId, "global_prompts"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateGlobalPrompt(userId: string, promptId: string, data: Partial<GlobalPrompt>): Promise<void> {
  await updateDoc(doc(db, "users", userId, "global_prompts", promptId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteGlobalPrompt(userId: string, promptId: string): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "global_prompts", promptId));
}

// ── Global Documents ─────────────────────────────────────────────────────────

export async function getGlobalDocuments(userId: string): Promise<ProjectDocument[]> {
  const q = query(collection(db, "users", userId, "global_documents"), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id, createdAt: toStr(d.data().createdAt), updatedAt: toStr(d.data().updatedAt) } as ProjectDocument));
}

export async function addGlobalDocument(userId: string, data: Omit<ProjectDocument, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "users", userId, "global_documents"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateGlobalDocument(userId: string, docId: string, data: Partial<ProjectDocument>): Promise<void> {
  await updateDoc(doc(db, "users", userId, "global_documents", docId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteGlobalDocument(userId: string, docId: string): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "global_documents", docId));
}
