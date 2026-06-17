const { app, BrowserWindow, shell, ipcMain, dialog, Notification } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const fs = require("fs");
const http = require("http");
const crypto = require("crypto");
const { spawn } = require("child_process");
const net = require("net");
const { parse: parseShell } = require("shell-quote");

const PORT = 3000;
// app.isPackaged is the reliable production signal — Electron does not set
// NODE_ENV=production in a packaged build, so relying on it alone made the
// installed app run `next dev` instead of `next start`. NODE_ENV is still
// honored so `npm run electron:start` can exercise the production path.
const DEV = !app.isPackaged && process.env.NODE_ENV !== "production";

// Hide "Electron" / "FounderOS" from the user agent so Google OAuth doesn't
// reject the popup as a non-standard browser (disallowed_useragent). Matches
// Electron's bundled Chromium version so the UA is still authentic.
const CLEAN_CHROME_UA = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`;
app.userAgentFallback = CLEAN_CHROME_UA;

// userAgentFallback alone is not enough — Electron applies a session-level
// default UA (containing "Electron" + the app name) that wins for new
// webContents. setUserAgent on the contents directly overrides it, and
// firing on web-contents-created catches the main window AND every popup
// (including the Google OAuth popup) before its first navigation.
app.on("web-contents-created", (_event, contents) => {
  contents.setUserAgent(CLEAN_CHROME_UA);
});

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

  // Open external links in the system browser, not Electron. Google OAuth
  // uses the dedicated google-oauth IPC handler below, not window.open.
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

// ── Google OAuth (system-browser loopback flow) ──────────────────────────────
// Google blocks signInWithPopup in Electron with "this browser may not be
// secure" regardless of user-agent spoofing. The official desktop pattern is
// to open the OAuth URL in the user's real browser and capture the redirect
// on a loopback HTTP server. PKCE means no client secret is required.

function base64urlEncode(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );
}

ipcMain.handle("google-oauth", async (_event, clientId, clientSecret) => {
  if (!clientId || typeof clientId !== "string") {
    return {
      success: false,
      error: "Google OAuth client ID missing. Set NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID in .env.local and rebuild.",
    };
  }
  if (!clientSecret || typeof clientSecret !== "string") {
    return {
      success: false,
      error:
        "Google OAuth client secret missing. Open your Desktop-app OAuth client in Google Cloud Console, copy its client secret into NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET in .env.local, then rebuild.",
    };
  }

  const server = http.createServer();
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const port = server.address().port;
    const redirectUri = `http://127.0.0.1:${port}/`;

    const codeVerifier = base64urlEncode(crypto.randomBytes(32));
    const codeChallenge = base64urlEncode(
      crypto.createHash("sha256").update(codeVerifier).digest(),
    );
    const state = base64urlEncode(crypto.randomBytes(16));

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("prompt", "select_account");

    const codePromise = new Promise((resolve, reject) => {
      let settled = false;
      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fn(value);
      };
      const timer = setTimeout(
        () => finish(reject, new Error("Google sign-in timed out — please try again.")),
        5 * 60 * 1000,
      );
      server.on("request", (req, res) => {
        const url = new URL(req.url, redirectUri);
        if (url.pathname !== "/") {
          res.writeHead(404);
          res.end();
          return;
        }
        const recvState = url.searchParams.get("state");
        const recvCode = url.searchParams.get("code");
        const recvError = url.searchParams.get("error");
        const body = recvError
          ? `<h2>Sign-in failed</h2><p>${escapeHtml(recvError)}</p><p>You can close this tab and try again in FounderOS.</p>`
          : `<h2>Sign-in complete</h2><p>You can close this tab and return to FounderOS.</p>`;
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          `<!doctype html><html><body style="font-family:system-ui,sans-serif;padding:48px;text-align:center;background:#09090b;color:#fafafa">${body}</body></html>`,
        );
        if (recvError) finish(reject, new Error(`Google returned error: ${recvError}`));
        else if (recvState !== state)
          finish(reject, new Error("OAuth state mismatch — please try again."));
        else if (!recvCode) finish(reject, new Error("Google did not return an authorization code."));
        else finish(resolve, recvCode);
      });
    });

    await shell.openExternal(authUrl.toString());
    const code = await codePromise;

    // Google's Desktop-app OAuth clients require the (non-confidential) client
    // secret in the token exchange even with PKCE — omitting it returns
    // "client_secret is missing".
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        code_verifier: codeVerifier,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      throw new Error(`Token exchange failed (${tokenRes.status}): ${text}`);
    }
    const tokens = await tokenRes.json();
    if (!tokens.id_token) {
      throw new Error("Google did not return an ID token. Check OAuth client configuration.");
    }
    return { success: true, idToken: tokens.id_token, accessToken: tokens.access_token || null };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  } finally {
    try { server.close(); } catch {}
  }
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
