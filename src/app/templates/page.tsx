"use client";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { BookTemplate } from "lucide-react";

export default function TemplatesPage() {
  return (
    <AppLayout>
      <TopBar title="Templates" />
      <div className="p-6 flex flex-col items-center justify-center py-20 text-center">
        <BookTemplate className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Templates</h2>
        <p className="text-muted-foreground">Project templates coming in Phase 2.</p>
      </div>
    </AppLayout>
  );
}
