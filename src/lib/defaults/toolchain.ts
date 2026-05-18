import type { ToolchainDefaults } from "@/types";

export const DEFAULT_TOOLCHAIN: ToolchainDefaults = {
  ai: {
    defaultAI: "Claude Code",
    defaultEditor: "Cursor",
    fallbackEditor: "VS Code",
    implementationStyle:
      "Use Claude Code for implementation unless explicitly overridden. Use Cursor for editing and inspection.",
  },
  hosting: {
    websiteHosting: "Netlify",
    domainRegistrar: "Namecheap",
    dnsNotes:
      "Use Namecheap for domain purchase and DNS unless a project specifies otherwise. Use Netlify for website deployment.",
  },
  audio: {
    voiceProvider: "ElevenLabs",
    sfxProvider: "ElevenLabs and in-game sound libraries",
    audioProcessing: "FFmpeg 8.1",
    notes:
      "Use ElevenLabs for voiceovers and generated SFX. Use FFmpeg for trimming, converting, mixing, and exporting audio.",
  },
  images: {
    artProvider: "Recraft",
    imageAutomation: "Python 3.13 + Pillow/PIL",
    notes:
      "Use Recraft for polished art images. Use Pillow for thumbnails, per-frame renders, overlays, resizing, and batch image processing.",
  },
  video: {
    videoAutomation: "Python 3.13 + Pillow + FFmpeg 8.1",
    sourceFootage: "iPhone screen recordings for live gameplay videos",
    voiceovers: "ElevenLabs API",
    rendering: "Pillow renders per-frame RGBA PNGs; FFmpeg assembles final MP4 videos",
    formats: [
      "TikTok/Reels/Shorts 1080x1920",
      "YouTube 1920x1080",
      "App preview helper exports",
    ],
  },
  dictation: {
    dictation: "Wispr Flow",
    notes:
      "Use Wispr Flow for fast voice-to-text notes, tasks, app ideas, and long prompt drafting.",
  },
  terminal: {
    defaultCommand: "wt.exe",
  },
  paths: {
    globalAssetLibrary: "C:/FounderOS_Assets",
    globalExports: "C:/FounderOS_Assets/exports",
  },
  executables: {
    claudeCode: "claude",
    cursor: "cursor",
  },
};

export function mergeToolchain(
  partial: Partial<ToolchainDefaults> | undefined,
): ToolchainDefaults {
  if (!partial) return DEFAULT_TOOLCHAIN;
  return {
    ai: { ...DEFAULT_TOOLCHAIN.ai, ...(partial.ai ?? {}) },
    hosting: { ...DEFAULT_TOOLCHAIN.hosting, ...(partial.hosting ?? {}) },
    audio: { ...DEFAULT_TOOLCHAIN.audio, ...(partial.audio ?? {}) },
    images: { ...DEFAULT_TOOLCHAIN.images, ...(partial.images ?? {}) },
    video: { ...DEFAULT_TOOLCHAIN.video, ...(partial.video ?? {}) },
    dictation: { ...DEFAULT_TOOLCHAIN.dictation, ...(partial.dictation ?? {}) },
    terminal: { ...DEFAULT_TOOLCHAIN.terminal, ...(partial.terminal ?? {}) },
    paths: { ...DEFAULT_TOOLCHAIN.paths, ...(partial.paths ?? {}) },
    executables: { ...DEFAULT_TOOLCHAIN.executables, ...(partial.executables ?? {}) },
    updatedAt: partial.updatedAt,
  };
}
