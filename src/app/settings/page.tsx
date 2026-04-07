"use client";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const { user } = useAuth();
  return (
    <AppLayout>
      <TopBar title="Settings" />
      <div className="p-6 max-w-2xl space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Signed in as: <span className="text-foreground">{user?.email}</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">About FounderOS</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Version 1.0.0 — Personal AI Project Command Center</p>
            <p className="text-sm text-muted-foreground">Built for Chris Campbell / Athlete Domains LLC</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
