const { app, BrowserWindow, shell, ipcMain, dialog, Notification } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const net = require("net");

const PORT = 3000;
const DEV = process.env.NODE_ENV !== "production";

let mainWindow;
let nextProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "FounderOS",
    icon: path.join(__dirname, "..", "public", "favicon.ico"),
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
    nextProcess = spawn("npx", ["next", "start", "--port", String(PORT)], {
      cwd: projectRoot,
      shell: true,
      stdio: "pipe",
      env: { ...process.env, BROWSER: "none" },
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

// ── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  startNextServer();

  try {
    console.log("Waiting for Next.js server to start...");
    await waitForServer(PORT);
    console.log("Next.js server is ready!");
    createWindow();
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
