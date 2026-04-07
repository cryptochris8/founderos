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
});
