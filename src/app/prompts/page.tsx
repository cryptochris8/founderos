"use client";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { Zap } from "lucide-react";

export default function PromptsPage() {
  return (
    <AppLayout>
      <TopBar title="Prompts" />
      <div className="p-6 flex flex-col items-center justify-center py-20 text-center">
        <Zap className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Global Prompts</h2>
        <p className="text-muted-foreground">Global prompt library coming in Phase 2.</p>
      </div>
    </AppLayout>
  );
}
