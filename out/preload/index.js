"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {
  setIgnoreMouseEvents: (ignore) => {
    electron.ipcRenderer.send("set-ignore-mouse-events", ignore);
  },
  showContextMenu: () => {
    electron.ipcRenderer.send("show-context-menu");
  },
  onModeChanged: (callback) => {
    electron.ipcRenderer.on("mode-changed", (_, mode) => callback(mode));
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
