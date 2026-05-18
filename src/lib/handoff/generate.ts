import type { Project, ToolchainDefaults } from "@/types";

export const HANDOFF_TASK_TYPES = [
  "New feature",
  "Bug fix",
  "UI improvement",
  "App Store/TestFlight update",
  "Website/Netlify deployment",
  "Firebase/Firestore update",
  "Asset organization",
  "Marketing video pipeline",
  "Social content plan",
  "VEO3 prompt pack",
  "Game mechanic implementation",
  "Refactor/cleanup",
  "Documentation",
] as const;

export type HandoffTaskType = (typeof HANDOFF_TASK_TYPES)[number];

export interface HandoffInput {
  taskTitle: string;
  taskType: HandoffTaskType | "";
  objective: string;
  importantFiles: string; // newline-separated list
  constraints: string; // newline-separated extra constraints (in addition to defaults)
  acceptanceCriteria: string; // newline-separated list
  includeToolchain: boolean;
  includeProjectContext: boolean;
  includeAssetPaths: boolean;
  includeCommandPresets: boolean;
}

const DEFAULT_CONSTRAINTS = [
  "Do not rebuild from scratch unless explicitly instructed.",
  "Preserve existing architecture.",
  "Make incremental safe changes.",
  "Add tests where useful.",
];

const DEFAULT_IMPLEMENTATION_STEPS = [
  "Inspect existing structure.",
  "Identify relevant files.",
  "Implement changes.",
  "Run checks/build.",
  "Report changed files and next steps.",
];

function bulletLines(input: string, prefix = "- "): string {
  return input
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `${prefix}${l}`)
    .join("\n");
}

function checkboxLines(input: string): string {
  return input
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `- [ ] ${l}`)
    .join("\n");
}

export function slugifyForFilename(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "untitled"
  );
}

export function defaultHandoffFilename(input: HandoffInput, today = new Date()): string {
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}-${slugifyForFilename(input.taskTitle)}.md`;
}

export function generateHandoff(
  toolchain: ToolchainDefaults,
  project: Project,
  input: HandoffInput,
): string {
  const lines: string[] = [];

  lines.push(`# Claude Code Handoff: ${input.taskTitle || "(untitled)"}`);
  if (input.taskType) {
    lines.push("");
    lines.push(`**Task type:** ${input.taskType}`);
  }
  lines.push("");

  lines.push("## Project");
  lines.push(`- Name: ${project.title}`);
  lines.push(`- Stage: ${project.stage}`);
  lines.push(`- Local path: ${project.localPath || "(not set)"}`);
  lines.push(`- Asset path: ${project.assetPath || "(not set)"}`);
  if (project.githubUrl) lines.push(`- GitHub: ${project.githubUrl}`);
  if (project.netlifyUrl) lines.push(`- Netlify: ${project.netlifyUrl}`);
  if (project.firebaseUrl) lines.push(`- Firebase: ${project.firebaseUrl}`);
  if (project.appStoreConnectUrl) lines.push(`- App Store Connect: ${project.appStoreConnectUrl}`);
  if (project.testFlightUrl) lines.push(`- TestFlight: ${project.testFlightUrl}`);
  if (project.websiteUrl) lines.push(`- Website: ${project.websiteUrl}`);
  lines.push("");

  if (input.includeToolchain) {
    lines.push("## Global Toolchain Rules");
    lines.push(`- ${toolchain.ai.implementationStyle}`);
    lines.push(`- Use ${toolchain.hosting.websiteHosting} for websites.`);
    lines.push(`- Use ${toolchain.hosting.domainRegistrar} for domains.`);
    lines.push(`- Use ${toolchain.audio.voiceProvider} for voice/SFX.`);
    lines.push(`- Use ${toolchain.images.artProvider} for art.`);
    lines.push(`- Use ${toolchain.video.videoAutomation} for automated video/image/audio generation.`);
    lines.push(`- Use ${toolchain.dictation.dictation} for dictation workflow notes.`);
    // Surface per-project tool overrides if set
    const overrides = project.toolOverrides;
    if (overrides && Object.values(overrides).some(Boolean)) {
      lines.push("");
      lines.push("### Project tool overrides");
      if (overrides.aiTool) lines.push(`- AI tool: ${overrides.aiTool}`);
      if (overrides.editor) lines.push(`- Editor: ${overrides.editor}`);
      if (overrides.hosting) lines.push(`- Hosting: ${overrides.hosting}`);
      if (overrides.domainRegistrar) lines.push(`- Domain registrar: ${overrides.domainRegistrar}`);
      if (overrides.voiceProvider) lines.push(`- Voice provider: ${overrides.voiceProvider}`);
      if (overrides.artProvider) lines.push(`- Art provider: ${overrides.artProvider}`);
      if (overrides.videoPipeline) lines.push(`- Video pipeline: ${overrides.videoPipeline}`);
    }
    lines.push("");
  }

  if (input.includeProjectContext) {
    lines.push("## Project Context");
    if (project.longDescription) {
      lines.push(project.longDescription);
    } else if (project.shortDescription) {
      lines.push(project.shortDescription);
    }
    if (project.claudeContext) {
      lines.push("");
      lines.push("### Claude-specific context");
      lines.push(project.claudeContext);
    }
    if (project.brandNotes) {
      lines.push("");
      lines.push("### Brand notes");
      lines.push(project.brandNotes);
    }
    if (project.currentFocus) {
      lines.push("");
      lines.push(`**Current focus:** ${project.currentFocus}`);
    }
    if (project.nextAction) {
      lines.push(`**Next action:** ${project.nextAction}`);
    }
    lines.push("");
  }

  lines.push("## Objective");
  lines.push(input.objective || "(none provided)");
  lines.push("");

  lines.push("## Constraints");
  const extraConstraints = input.constraints
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  for (const c of [...DEFAULT_CONSTRAINTS, ...extraConstraints]) {
    lines.push(`- ${c}`);
  }
  lines.push("");

  lines.push("## Implementation Steps");
  DEFAULT_IMPLEMENTATION_STEPS.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  lines.push("");

  const filesBlock = bulletLines(input.importantFiles);
  lines.push("## Important Files/Folders");
  lines.push(filesBlock || "- (none specified)");
  lines.push("");

  lines.push("## Acceptance Criteria");
  const ac = checkboxLines(input.acceptanceCriteria);
  lines.push(ac || "- [ ] (none specified)");
  lines.push("");

  if (input.includeAssetPaths && project.assetFolders) {
    const af = project.assetFolders;
    const rows: string[] = [
      af.root && `- Root: ${af.root}`,
      af.logos && `- Logos: ${af.logos}`,
      af.screenshots && `- Screenshots: ${af.screenshots}`,
      af.gameplayRecordings && `- Gameplay recordings: ${af.gameplayRecordings}`,
      af.voiceovers && `- Voiceovers: ${af.voiceovers}`,
      af.sfx && `- SFX: ${af.sfx}`,
      af.music && `- Music: ${af.music}`,
      af.art && `- Art: ${af.art}`,
      af.videoExports && `- Video exports: ${af.videoExports}`,
      af.socialExports && `- Social exports: ${af.socialExports}`,
      af.prompts && `- Prompts: ${af.prompts}`,
    ].filter((r): r is string => typeof r === "string" && r.length > 0);
    if (rows.length > 0) {
      lines.push("## Asset Paths");
      lines.push(...rows);
      lines.push("");
    }
  }

  if (input.includeCommandPresets && project.commandPresets && project.commandPresets.length > 0) {
    lines.push("## Commands to Run");
    for (const c of project.commandPresets) {
      const cwd = c.workingDirectory ? ` (cwd: ${c.workingDirectory})` : "";
      lines.push(`- **${c.label}**: \`${c.command}\`${cwd}`);
      if (c.description) lines.push(`  - ${c.description}`);
    }
    lines.push("");
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}
