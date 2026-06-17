"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User, onAuthStateChanged, signInWithEmailAndPassword, signOut,
  createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    // In Electron, use the system-browser loopback OAuth flow. Google blocks
    // signInWithPopup in embedded browsers ("this browser may not be secure")
    // regardless of user-agent spoofing.
    if (typeof window !== "undefined" && window.electronAPI?.googleOAuth) {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
      const clientSecret = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET;
      if (!clientId) {
        throw new Error(
          "NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID is not set. Create a Desktop OAuth client in Google Cloud Console and add its client ID to .env.local, then rebuild.",
        );
      }
      const res = await window.electronAPI.googleOAuth(clientId, clientSecret);
      if (!res.success || !res.idToken) {
        throw new Error(res.error || "Google sign-in failed");
      }
      const credential = GoogleAuthProvider.credential(res.idToken, res.accessToken || undefined);
      await signInWithCredential(auth, credential);
      return;
    }
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
