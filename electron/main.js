const { app, BrowserWindow, shell, ipcMain, dialog, Notification } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const net = require("net");
const { parse: parseShell } = require("shell-quote");

const PORT = 3000;
// app.isPackaged is the reliable production signal — Electron does not set
// NODE_ENV=production in a packaged build, so relying on it alone made the
// installed app run `next dev` instead of `next start`. NODE_ENV is still
// honored so `npm run electron:start` can exercise the production path.
const DEV = !app.isPackaged && process.env.NODE_ENV !== "production";

let mainWindow;
let nextProcess;

function createWindow() {
  const iconPath = path.join(__dirname, "..", "public", "favicon.ico");
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "FounderOS",
    ...(fs.existsSync(iconPath) ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: "#09090b",
    show: false,
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Open external links in the system browser, not Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ── IPC Handlers ─────────────────────────────────────────────────────────────

// Save file with system dialog
ipcMain.handle("save-file", async (_event, filename, content) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: filename,
    filters: [
      { name: "All Files", extensions: ["*"] },
    ],
  });
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content, "utf-8");
    return { success: true, path: result.filePath };
  }
  return { success: false };
});

// Export markdown with save dialog
ipcMain.handle("export-markdown", async (_event, filename, content) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: filename,
    filters: [
      { name: "Markdown", extensions: ["md"] },
      { name: "Text", extensions: ["txt"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content, "utf-8");
    return { success: true, path: result.filePath };
  }
  return { success: false };
});

// Window controls
ipcMain.on("window-minimize", () => {
  mainWindow?.minimize();
});

ipcMain.on("window-maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on("window-close", () => {
  mainWindow?.close();
});

ipcMain.handle("window-is-maximized", () => {
  return mainWindow?.isMaximized() ?? false;
});

// OS notifications
ipcMain.on("show-notification", (_event, title, body) => {
  new Notification({ title, body }).show();
});

// Open external URLs
ipcMain.on("open-external", (_event, url) => {
  if (url && typeof url === "string" && url.startsWith("http")) {
    shell.openExternal(url);
  }
});

// App version
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

// ── FounderOS Desktop Actions ────────────────────────────────────────────────

// Pick a folder via system dialog
ipcMain.handle("select-folder", async (_event, defaultPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    defaultPath: typeof defaultPath === "string" ? defaultPath : undefined,
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true, path: null };
  }
  return { canceled: false, path: result.filePaths[0] };
});

// Open a folder in the system file explorer
ipcMain.handle("open-folder", async (_event, folderPath) => {
  if (typeof folderPath !== "string" || !folderPath) {
    return { success: false, error: "Invalid path" };
  }
  const err = await shell.openPath(folderPath);
  if (err) {
    return { success: false, error: err };
  }
  return { success: true };
});

// Open a terminal at the given folder. Defaults to Windows Terminal (wt.exe).
ipcMain.handle("open-terminal", async (_event, folderPath, terminalCommand) => {
  if (typeof folderPath !== "string" || !folderPath) {
    return { success: false, error: "Invalid path" };
  }
  const cmd = (terminalCommand && typeof terminalCommand === "string") ? terminalCommand : "wt.exe";
  let args;
  if (cmd === "wt.exe") {
    args = ["-d", folderPath];
  } else if (cmd.toLowerCase().includes("powershell")) {
    args = ["-NoExit", "-Command", `Set-Location -LiteralPath ${JSON.stringify(folderPath)}`];
  } else {
    // cmd.exe and similar
    args = ["/K", `cd /d ${JSON.stringify(folderPath)}`];
  }
  try {
    const child = spawn(cmd, args, { detached: true, stdio: "ignore" });
    child.on("error", (e) => console.warn(`open-terminal failed: ${e.message}`));
    child.unref();
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err && err.message ? err.message : err) };
  }
});

// Open the given folder in Cursor (or configured editor command)
ipcMain.handle("open-in-cursor", async (_event, folderPath, editorCommand) => {
  if (typeof folderPath !== "string" || !folderPath) {
    return { success: false, error: "Invalid path" };
  }
  const cmd = (editorCommand && typeof editorCommand === "string") ? editorCommand : "cursor";
  try {
    // shell: true is needed on Windows so .cmd shims resolve via PATH.
    // Path is passed as a separate arg, so the shell quotes it for us.
    const child = spawn(cmd, [folderPath], { detached: true, stdio: "ignore", shell: true });
    child.on("error", (e) => console.warn(`open-in-cursor failed: ${e.message}`));
    child.unref();
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err && err.message ? err.message : err) };
  }
});

// Launch Claude Code in a project folder. Opens a new terminal running `claude`.
ipcMain.handle("run-claude-code", async (_event, folderPath, claudeCommand) => {
  if (typeof folderPath !== "string" || !folderPath) {
    return { success: false, error: "Invalid path" };
  }
  const claude = (claudeCommand && typeof claudeCommand === "string") ? claudeCommand : "claude";
  // Open Windows Terminal at the project folder running the claude command.
  // wt.exe accepts `-d <path>` then the command to run after the path.
  try {
    const child = spawn("wt.exe", ["-d", folderPath, claude], { detached: true, stdio: "ignore" });
    child.on("error", (e) => console.warn(`run-claude-code failed: ${e.message}`));
    child.unref();
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err && err.message ? err.message : err) };
  }
});

// Run a user-defined command preset. Always shows a confirmation dialog.
ipcMain.handle("run-command", async (_event, preset) => {
  if (!preset || typeof preset.command !== "string" || !preset.command.trim()) {
    return { success: false, error: "Invalid command preset" };
  }
  const cwd = (preset.workingDirectory && typeof preset.workingDirectory === "string")
    ? preset.workingDirectory
    : undefined;

  const confirm = await dialog.showMessageBox(mainWindow, {
    type: "question",
    title: "Run command?",
    message: `Run "${preset.label || preset.command}"?`,
    detail: `Command: ${preset.command}\nDirectory: ${cwd || "(default)"}`,
    buttons: ["Run", "Cancel"],
    defaultId: 0,
    cancelId: 1,
  });
  if (confirm.response !== 0) return { success: false, canceled: true };

  // Parse the command safely with shell-quote (no string interpolation into shell).
  const tokens = parseShell(preset.command).filter((t) => typeof t === "string");
  if (tokens.length === 0) return { success: false, error: "Empty command after parsing" };
  const [head, ...args] = tokens;

  try {
    const child = spawn(head, args, {
      cwd,
      detached: true,
      stdio: "ignore",
      shell: true, // resolve .cmd shims on Windows
    });
    child.on("error", (e) => console.warn(`run-command failed: ${e.message}`));
    child.unref();
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err && err.message ? err.message : err) };
  }
});

// ── Server Management ────────────────────────────────────────────────────────

function waitForServer(port, retries = 60) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    function tryConnect() {
      const socket = new net.Socket();
      socket.setTimeout(500);

      socket.on("connect", () => {
        socket.destroy();
        resolve();
      });

      socket.on("timeout", () => {
        socket.destroy();
        retry();
      });

      socket.on("error", () => {
        retry();
      });

      socket.connect(port, "127.0.0.1");
    }

    function retry() {
      attempts++;
      if (attempts >= retries) {
        reject(new Error(`Server did not start after ${retries} attempts`));
      } else {
        setTimeout(tryConnect, 500);
      }
    }

    tryConnect();
  });
}

function startNextServer() {
  const projectRoot = path.join(__dirname, "..");

  if (DEV) {
    nextProcess = spawn("npx", ["next", "dev", "--port", String(PORT)], {
      cwd: projectRoot,
      shell: true,
      stdio: "pipe",
      env: { ...process.env, BROWSER: "none" },
    });
  } else {
    // Production: run the next binary directly under Electron's bundled
    // Node (ELECTRON_RUN_AS_NODE=1) so the installer doesn't depend on
    // the user having Node/npx on PATH, and so we avoid shell parsing.
    const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
    nextProcess = spawn(process.execPath, [nextBin, "start", "--port", String(PORT)], {
      cwd: projectRoot,
      stdio: "pipe",
      env: {
        ...process.env,
        BROWSER: "none",
        ELECTRON_RUN_AS_NODE: "1",
      },
    });
  }

  nextProcess.stdout.on("data", (data) => {
    console.log(`[Next.js] ${data.toString().trim()}`);
  });

  nextProcess.stderr.on("data", (data) => {
    console.error(`[Next.js] ${data.toString().trim()}`);
  });

  nextProcess.on("error", (err) => {
    console.error("Failed to start Next.js server:", err);
  });
}

// ── Auto Updater ─────────────────────────────────────────────────────────────

autoUpdater.autoDownload = false;
autoUpdater.logger = console;

autoUpdater.on("update-available", (info) => {
  dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "Update Available",
    message: `FounderOS ${info.version} is available. Download now?`,
    buttons: ["Download", "Later"],
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on("update-downloaded", () => {
  dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "Update Ready",
    message: "Update downloaded. Restart to apply?",
    buttons: ["Restart", "Later"],
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

// ── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  startNextServer();

  try {
    console.log("Waiting for Next.js server to start...");
    await waitForServer(PORT);
    console.log("Next.js server is ready!");
    createWindow();

    // Check for updates in production
    if (!DEV) {
      autoUpdater.checkForUpdates().catch(() => {});
    }
  } catch (err) {
    console.error(err.message);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (nextProcess) {
    nextProcess.kill();
  }
  app.quit();
});

app.on("before-quit", () => {
  if (nextProcess) {
    nextProcess.kill();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
