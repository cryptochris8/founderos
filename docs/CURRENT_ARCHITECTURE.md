# FounderOS Architecture (Phase 1)

A snapshot for future agents and contributors. Updated after Phase 1 of the upgrade brief.

## Stack

- **Next.js 16.2** App Router, all pages opt into client rendering (`"use client"`)
- **React 19**
- **TypeScript** strict mode
- **Tailwind 4** + **shadcn/ui** components in `src/components/ui/`
- **Firebase** v12 — Auth (email/password + Google), Firestore, Storage
- **Electron 41** desktop shell. Production serves a **static export** (`out/`) via a tiny in-process file server on a random loopback port — no Next.js server, no fixed port. Dev runs `next dev` for hot reload.
- **electron-updater** for auto-updates
- Node 22 LTS (electron-rebuild requires ≥22.12)

## Packaging — static export (Phase 2)

The web app builds with `output: "export"` to a self-contained `out/` (~3.3 MB; the OAuth secret + Firebase config are inlined). Electron serves it directly in production, so the installer ships only the Electron runtime + `out/` + the two real runtime deps (`electron-updater`, `shell-quote`); the rest of the toolchain (next/react/firebase/…) is in `devDependencies` and compiled into `out/`. `asar` is enabled. Result: ~96 MB installer (down from ~834 MB), near-instant startup, no port-3000 dependency. Because static export can't prerender unknown dynamic ids, project detail/handoff use query-param routes (`/projects/view?id=`, `/projects/view/handoff?id=`) read via `useSearchParams`.

## Repository layout

```
electron/
  main.js              CommonJS main process — IPC handlers, server boot, auto-update
  preload.js           CommonJS preload — exposes window.electronAPI
src/
  app/                 Next.js App Router pages (all client components)
    dashboard/         Stat cards, focus projects, demo seed
    login/             Email/password + Google sign-in
    projects/
      page.tsx         Grid/table list with filters
      new/             Create form
      view/            Detail + handoff as static query-param routes (?id=)
        page.tsx       Project detail with 10 tabs
        handoff/       Claude Code handoff generator
    documents/         Global docs CRUD
    prompts/           Global prompts CRUD
    templates/         Project template browser
    settings/          Profile, password, toolchain, asset library
  components/
    layout/            AppLayout, Sidebar, TopBar, GlobalSearch
    projects/          ProjectCard, QuickActions (extended Phase 1), tabs/
    settings/          ToolchainSettings (Phase 1)
    shared/            ErrorBoundary, skeletons, StatCard
    ui/                shadcn primitives
  data/
    seed.ts            Demo categories + 8 seed projects (3 added Phase 1)
    templates.ts       Project templates
  hooks/
    useAuth.tsx        Firebase Auth context
  lib/
    firebase/
      config.ts        SDK init
      projects.ts      Projects CRUD
      subcollections.ts  Per-project: tasks, milestones, assets, notes, checklist, prompts, documents
      globals.ts       User-scoped global prompts and documents
      settings.ts      NEW (Phase 1): toolchain settings with localStorage fallback
      seed.ts          Demo data seeding
    defaults/
      toolchain.ts     NEW (Phase 1): DEFAULT_TOOLCHAIN + mergeToolchain()
    handoff/
      generate.ts      NEW (Phase 1): pure Markdown generator
    markdown/
      export.ts        buildClaudeHandoffPrompt, buildMvpPlanPrompt
    scoring/
      index.ts         enrichProjectWithScore, calculateHealth
    utils/             cn() etc.
  types/
    index.ts           Project (extended Phase 1), all subdocument types, ToolchainDefaults
    electron.d.ts      NEW (Phase 1): window.electronAPI type augmentation
docs/
  CURRENT_ARCHITECTURE.md  This file
firestore.rules        Strict user-scoped rules (settings/ added Phase 1)
firestore.indexes.json Composite index for projects (isArchived + updatedAt)
firebase.json          Points to rules + indexes
electron-builder.yml   Desktop packaging config
```

## Firestore data model

All data is scoped under `users/{uid}/`:

- `projects/{projectId}` — full Project document with subcollections:
  - `tasks/`, `milestones/`, `assets/`, `notes/`, `checklists/`, `prompts/`, `documents/`
- `global_prompts/{promptId}`
- `global_documents/{docId}`
- `settings/toolchain` — NEW (Phase 1): single ToolchainDefaults document

## Electron IPC surface (`window.electronAPI`)

Pre-existing:
- `saveFile`, `exportMarkdown` — file save dialogs
- `minimizeWindow`, `maximizeWindow`, `closeWindow`, `isMaximized`
- `showNotification`, `openExternal`, `getAppVersion`

Added in Phase 1:
- `selectFolder(defaultPath?)` — system folder picker
- `openFolder(path)` — open in Explorer
- `openTerminal(path, terminalCmd?)` — Windows Terminal by default, configurable
- `openInCursor(path, editorCmd?)` — uses `shell: true` for .cmd shim resolution
- `runClaudeCode(path, claudeCmd?)` — opens new terminal running `claude`
- `runCommand(preset)` — runs a ProjectCommand after a confirm dialog; parses with `shell-quote`

All Phase 1 IPC handlers use `spawn(cmd, [args])` array form to avoid shell injection. `shell: true` is used only where Windows requires it for `.cmd` shim resolution, and the confirm dialog in `runCommand` is the user-facing safety mechanism.

## Phase 1 additions (summary)

1. Extended `Project` with workspace/links/social/tools/marketing fields (all optional, backwards-compatible).
2. New types: `ProjectSocialLinks`, `ProjectToolOverrides`, `ProjectAssetFolders`, `ProjectCommand`, `ToolchainDefaults`.
3. 3 new seed projects (Squishy Smash, Rage Smash, Athlete Domains) with placeholder paths.
4. Global toolchain defaults stored at `users/{uid}/settings/toolchain` with localStorage fallback.
5. New Electron IPC actions for folder/terminal/editor/Claude/command operations.
6. Quick-action buttons on project detail (folder, terminal, editor, Claude, GitHub, Netlify, Firebase, Handoff).
7. Claude Code handoff generator: pure function + form UI at `/projects/[id]/handoff`.
8. Workspace tab on project detail: edit localPath/assetPath, links, social, tool overrides, run command presets.
9. Settings page extended with Toolchain Defaults, Executables, and Asset Library cards.

## Conventions

- All pages are client components — server-side rendering is not used.
- Firestore writes go through `lib/firebase/*` modules — pages should not call SDK directly.
- Settings persistence (`lib/firebase/settings.ts`) gracefully falls back to localStorage if Firestore is unreachable.
- Electron-gated UI uses `typeof window !== "undefined" && window.electronAPI` checks and toasts an error if invoked in browser.
- Path strings on Windows use forward slashes in seed data for portability; native Windows backslashes also work.

## What's NOT yet built (Phase 2+ candidates)

- Compact quick actions on project cards (requires UX work — current cards wrap everything in a `<Link>`)
- UI for creating/editing command presets (only displayed/runnable in Phase 1; data must be added via seed or Firestore directly)
- Asset library file browsing / thumbnails
- Video factory orchestration
- Social command center
- Voice + Claude Code integration (planned future phase per Chris's roadmap)
- Project schema migration for existing Firestore documents (Phase 1 adds optional fields only — no migration needed, but existing projects won't have `localPath` etc. until edited)
