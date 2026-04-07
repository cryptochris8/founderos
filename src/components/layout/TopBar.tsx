"use client";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlobalSearch } from "./GlobalSearch";
import Link from "next/link";

interface TopBarProps {
  title: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  showNewProject?: boolean;
}

export function TopBar({ title, searchValue, onSearchChange, showNewProject }: TopBarProps) {
  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-xl font-semibold truncate">{title}</h1>
      <div className="flex items-center gap-3">
        <GlobalSearch />
        {onSearchChange && (
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter..."
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
        )}
        {showNewProject && (
          <Link href="/projects/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Project</span>
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
