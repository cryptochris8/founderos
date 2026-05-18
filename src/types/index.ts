export type ProjectStage =
  | "Idea"
  | "Researching"
  | "Planning"
  | "Designing"
  | "Ready for Build"
  | "Building"
  | "Testing"
  | "Launch Prep"
  | "Live"
  | "Paused"
  | "Archived";

export type ProjectPriority = "Low" | "Medium" | "High" | "Critical";

export type TaskStatus = "todo" | "in-progress" | "blocked" | "done";
export type MilestoneStatus = "upcoming" | "active" | "completed";

export interface ProjectSocialLinks {
  tiktok?: string;
  reddit?: string;
  instagram?: string;
  x?: string;
  youtube?: string;
  facebook?: string;
  website?: string;
}

export interface ProjectToolOverrides {
  aiTool?: string;
  editor?: string;
  hosting?: string;
  domainRegistrar?: string;
  voiceProvider?: string;
  artProvider?: string;
  videoPipeline?: string;
}

export interface ProjectAssetFolders {
  root?: string;
  logos?: string;
  screenshots?: string;
  gameplayRecordings?: string;
  voiceovers?: string;
  sfx?: string;
  music?: string;
  art?: string;
  videoExports?: string;
  socialExports?: string;
  prompts?: string;
}

export interface ProjectCommand {
  id: string;
  label: string;
  command: string;
  workingDirectory?: string;
  description?: string;
}

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  slug: string;
  shortDescription: string;
  longDescription?: string;
  categoryId: string;
  tags: string[];
  stage: ProjectStage;
  priority: ProjectPriority;
  percentComplete: number;
  currentFocus?: string;
  nextAction?: string;
  targetAudience?: string;
  problemSolved?: string;
  valueProposition?: string;
  monetizationModel?: string;
  revenuePotential?: number;
  strategicImportance?: number;
  techStack?: string[];
  platformTargets?: string[];
  dependencies?: string[];
  blockers?: string[];
  repoLinks?: string[];
  deploymentLinks?: string[];
  externalToolLinks?: string[];
  designDirection?: string;
  researchSummary?: string;
  mvpDefinition?: string;
  featureRoadmap?: string;
  masterPrompt?: string;
  claudeBuildPrompt?: string;
  effortScore?: number;
  revenueScore?: number;
  excitementScore?: number;
  launchReadinessScore?: number;
  focusScore?: number;
  // FounderOS desktop command-center fields
  localPath?: string;
  assetPath?: string;
  githubUrl?: string;
  netlifyUrl?: string;
  firebaseUrl?: string;
  appStoreConnectUrl?: string;
  testFlightUrl?: string;
  websiteUrl?: string;
  socialLinks?: ProjectSocialLinks;
  toolOverrides?: ProjectToolOverrides;
  assetFolders?: ProjectAssetFolders;
  commandPresets?: ProjectCommand[];
  claudeContext?: string;
  brandNotes?: string;
  marketingNotes?: string;
  launchChecklist?: string[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  lastViewedAt?: string;
}

export interface ProjectDocument {
  id: string;
  title: string;
  slug: string;
  docType: string;
  content: string;
  summary?: string;
  version?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPrompt {
  id: string;
  title: string;
  promptType: string;
  body: string;
  intendedUse?: string;
  version?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: ProjectPriority;
  dueDate?: string;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  targetDate?: string;
  completedDate?: string;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAsset {
  id: string;
  title: string;
  assetType: string;
  url?: string;
  storagePath?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectNote {
  id: string;
  title: string;
  content: string;
  category?: string;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  group?: string;
  isComplete: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  colorToken?: string;
  sortOrder?: number;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  description?: string;
  templateType?: string;
  defaultStage?: ProjectStage;
  defaultPriority?: ProjectPriority;
  defaultTags?: string[];
  starterOverview?: string;
  starterRoadmap?: string;
  starterMilestones?: string[];
  starterChecklist?: string[];
  starterPromptPack?: string[];
  starterTechStack?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GlobalPrompt {
  id: string;
  title: string;
  promptType: string;
  body: string;
  tags?: string[];
  intendedUse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  defaultTheme?: "light" | "dark" | "system";
  defaultView?: "grid" | "table";
  defaultProjectSort?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolchainDefaults {
  ai: {
    defaultAI: string;
    defaultEditor: string;
    fallbackEditor: string;
    implementationStyle: string;
  };
  hosting: {
    websiteHosting: string;
    domainRegistrar: string;
    dnsNotes: string;
  };
  audio: {
    voiceProvider: string;
    sfxProvider: string;
    audioProcessing: string;
    notes: string;
  };
  images: {
    artProvider: string;
    imageAutomation: string;
    notes: string;
  };
  video: {
    videoAutomation: string;
    sourceFootage: string;
    voiceovers: string;
    rendering: string;
    formats: string[];
  };
  dictation: {
    dictation: string;
    notes: string;
  };
  terminal: {
    defaultCommand: string;
  };
  paths: {
    globalAssetLibrary: string;
    globalExports: string;
  };
  executables: {
    claudeCode: string;
    cursor: string;
  };
  updatedAt?: string;
}

export const PROJECT_STAGES: ProjectStage[] = [
  "Idea", "Researching", "Planning", "Designing",
  "Ready for Build", "Building", "Testing",
  "Launch Prep", "Live", "Paused", "Archived"
];

export const PROJECT_PRIORITIES: ProjectPriority[] = ["Low", "Medium", "High", "Critical"];

export const STAGE_COLORS: Record<ProjectStage, string> = {
  "Idea": "bg-slate-500",
  "Researching": "bg-blue-500",
  "Planning": "bg-indigo-500",
  "Designing": "bg-purple-500",
  "Ready for Build": "bg-cyan-500",
  "Building": "bg-yellow-500",
  "Testing": "bg-orange-500",
  "Launch Prep": "bg-pink-500",
  "Live": "bg-green-500",
  "Paused": "bg-gray-500",
  "Archived": "bg-stone-600",
};

export const PRIORITY_COLORS: Record<ProjectPriority, string> = {
  "Low": "bg-slate-500",
  "Medium": "bg-blue-500",
  "High": "bg-orange-500",
  "Critical": "bg-red-500",
};
