"use client";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { updatePassword, updateProfile, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { toast } from "sonner";
import { User, Shield, Info, Database } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateName = async () => {
    if (!auth.currentUser || !displayName.trim()) return;
    setSavingName(true);
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      toast.success("Display name updated");
    } catch {
      toast.error("Failed to update display name");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!auth.currentUser || !currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    } catch {
      toast.error("Failed to update password. Check your current password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <AppLayout>
      <TopBar title="Settings" />
      <div className="p-6 max-w-2xl space-y-4">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="text-sm">{user?.email}</p>
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display Name</Label>
              <div className="flex gap-2">
                <Input id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" className="max-w-xs" />
                <Button size="sm" onClick={handleUpdateName} disabled={savingName}>
                  {savingName ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="currentPw">Current Password</Label>
              <Input id="currentPw" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="max-w-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPw">New Password</Label>
              <Input id="newPw" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="max-w-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPw">Confirm New Password</Label>
              <Input id="confirmPw" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="max-w-xs" />
            </div>
            <Button size="sm" onClick={handleChangePassword} disabled={savingPassword || !currentPassword || !newPassword}>
              {savingPassword ? "Updating..." : "Update Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" />Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Your data is stored in Firebase Firestore and scoped to your account.</p>
            <p className="text-sm text-muted-foreground">Project ID: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">founderos-17c28</code></p>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4" />About FounderOS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Version 0.1.0 — Personal AI Project Command Center</p>
            <p className="text-sm text-muted-foreground">Built for Chris Campbell / Athlete Domains LLC</p>
            <p className="text-sm text-muted-foreground">Stack: Next.js 16 + React 19 + TypeScript + Firebase + Electron</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
