import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./config";
import type { ToolchainDefaults } from "@/types";
import { DEFAULT_TOOLCHAIN, mergeToolchain } from "@/lib/defaults/toolchain";

const LOCAL_KEY = "founderos.toolchain";

function tsToStr(ts: unknown): string | undefined {
  if (!ts) return undefined;
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === "string") return ts;
  return undefined;
}

function readLocal(): Partial<ToolchainDefaults> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Partial<ToolchainDefaults>) : null;
  } catch {
    return null;
  }
}

function writeLocal(settings: Partial<ToolchainDefaults>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota / privacy errors
  }
}

export async function getToolchain(userId: string): Promise<ToolchainDefaults> {
  try {
    const snap = await getDoc(doc(db, "users", userId, "settings", "toolchain"));
    if (snap.exists()) {
      const data = snap.data() as Partial<ToolchainDefaults> & { updatedAt?: unknown };
      const merged = mergeToolchain({ ...data, updatedAt: tsToStr(data.updatedAt) });
      writeLocal(merged);
      return merged;
    }
  } catch {
    // network / permission errors — fall through to local
  }
  const local = readLocal();
  return mergeToolchain(local ?? undefined);
}

export async function setToolchain(
  userId: string,
  settings: Partial<ToolchainDefaults>,
): Promise<void> {
  writeLocal(settings);
  try {
    await setDoc(
      doc(db, "users", userId, "settings", "toolchain"),
      { ...settings, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch (err) {
    // localStorage already updated; surface error so caller can toast
    throw err;
  }
}

export { DEFAULT_TOOLCHAIN };
