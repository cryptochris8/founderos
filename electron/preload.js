const { contextBridge, ipcRenderer } = require("electron");

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,

  // File operations
  saveFile: (filename, content) => ipcRenderer.invoke("save-file", filename, content),
  exportMarkdown: (filename, content) => ipcRenderer.invoke("export-markdown", filename, content),

  // Window controls
  minimizeWindow: () => ipcRenderer.send("window-minimize"),
  maximizeWindow: () => ipcRenderer.send("window-maximize"),
  closeWindow: () => ipcRenderer.send("window-close"),
  isMaximized: () => ipcRenderer.invoke("window-is-maximized"),

  // OS notifications
  showNotification: (title, body) => ipcRenderer.send("show-notification", title, body),

  // Shell
  openExternal: (url) => ipcRenderer.send("open-external", url),

  // App info
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),

  // FounderOS desktop actions
  selectFolder: (defaultPath) => ipcRenderer.invoke("select-folder", defaultPath),
  openFolder: (folderPath) => ipcRenderer.invoke("open-folder", folderPath),
  openTerminal: (folderPath, terminalCommand) =>
    ipcRenderer.invoke("open-terminal", folderPath, terminalCommand),
  openInCursor: (folderPath, editorCommand) =>
    ipcRenderer.invoke("open-in-cursor", folderPath, editorCommand),
  runClaudeCode: (folderPath, claudeCommand) =>
    ipcRenderer.invoke("run-claude-code", folderPath, claudeCommand),
  runCommand: (preset) => ipcRenderer.invoke("run-command", preset),
});
