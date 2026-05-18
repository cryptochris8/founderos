import type { ProjectCommand } from "./index";

export interface ElectronAPI {
  isElectron: true;

  // File operations
  saveFile: (filename: string, content: string) => Promise<{ success: boolean; path?: string }>;
  exportMarkdown: (filename: string, content: string) => Promise<{ success: boolean; path?: string }>;

  // Window controls
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isMaximized: () => Promise<boolean>;

  // OS notifications
  showNotification: (title: string, body: string) => void;

  // Shell
  openExternal: (url: string) => void;

  // App info
  getAppVersion: () => Promise<string>;

  // FounderOS desktop actions
  selectFolder: (defaultPath?: string) => Promise<{ canceled: boolean; path: string | null }>;
  openFolder: (folderPath: string) => Promise<{ success: boolean; error?: string }>;
  openTerminal: (
    folderPath: string,
    terminalCommand?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  openInCursor: (
    folderPath: string,
    editorCommand?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  runClaudeCode: (
    folderPath: string,
    claudeCommand?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  runCommand: (
    preset: ProjectCommand,
  ) => Promise<{ success: boolean; error?: string; canceled?: boolean }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
