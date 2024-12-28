"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const icon = path.join(__dirname, "../../resources/icon.png");
const isMac = process.platform === "darwin";
let mainWindow = null;
let tray = null;
let isQuitting = false;
let currentMode = "window";
function createTray() {
  const icon2 = electron.nativeImage.createFromPath(icon);
  const trayIconResized = icon2.resize({
    width: process.platform === "win32" ? 16 : 18,
    height: process.platform === "win32" ? 16 : 18
  });
  tray = new electron.Tray(trayIconResized);
  const contextMenu = electron.Menu.buildFromTemplate([
    {
      label: "Window Mode",
      type: "radio",
      checked: currentMode === "window",
      click: () => {
        setWindowMode("window");
      }
    },
    {
      label: "Pet Mode",
      type: "radio",
      checked: currentMode === "pet",
      click: () => {
        setWindowMode("pet");
      }
    },
    { type: "separator" },
    {
      label: "Exit",
      click: () => {
        electron.app.quit();
      }
    }
  ]);
  tray.setToolTip("Open LLM VTuber");
  tray.setContextMenu(contextMenu);
}
function setWindowMode(mode) {
  if (!mainWindow) return;
  mainWindow.setOpacity(0);
  currentMode = mode;
  if (mode === "window") {
    mainWindow.setSize(900, 670);
    mainWindow.center();
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setIgnoreMouseEvents(false);
    mainWindow.setSkipTaskbar(false);
    mainWindow.setResizable(true);
    mainWindow.setFocusable(true);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setBackgroundColor("#ffffff");
    if (isMac) {
      mainWindow.setWindowButtonVisibility(true);
      mainWindow.setVisibleOnAllWorkspaces(false, { visibleOnFullScreen: false });
    }
    mainWindow?.webContents.send("mode-changed", mode);
    setTimeout(() => {
      mainWindow?.setOpacity(1);
    }, 300);
  } else {
    const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setBackgroundColor("#00000000");
    mainWindow.setAlwaysOnTop(true, "screen-saver");
    mainWindow.setPosition(0, 0);
    setTimeout(() => {
      mainWindow?.setSize(width, height);
    }, 100);
    if (isMac) mainWindow.setWindowButtonVisibility(false);
    mainWindow.setResizable(false);
    mainWindow.setSkipTaskbar(true);
    mainWindow.setFocusable(false);
    if (isMac) {
      mainWindow.setIgnoreMouseEvents(true);
      mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    } else {
      mainWindow.setIgnoreMouseEvents(true, { forward: true });
    }
    setTimeout(() => {
      mainWindow?.webContents.send("mode-changed", mode);
    }, 200);
    setTimeout(() => {
      mainWindow?.setOpacity(1);
    }, 300);
  }
}
function createMainWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    transparent: true,
    backgroundColor: "#ffffff",
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: "hiddenInset",
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: true
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
    return false;
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  electron.globalShortcut.register("F12", () => {
    if (!mainWindow) return;
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools();
    }
  });
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("activate", () => {
    if (mainWindow) {
      mainWindow.show();
    } else if (electron.BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  createMainWindow();
  createTray();
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.ipcMain.on("set-ignore-mouse-events", (_event, ignore) => {
  if (mainWindow && currentMode === "pet") {
    if (isMac) {
      mainWindow.setIgnoreMouseEvents(ignore);
    } else {
      mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
    }
  }
});
electron.app.on("before-quit", () => {
  isQuitting = true;
  tray?.destroy();
  electron.globalShortcut.unregisterAll();
});
electron.ipcMain.on("window-minimize", () => {
  mainWindow?.minimize();
});
electron.ipcMain.on("window-maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
electron.ipcMain.on("window-close", () => {
  if (mainWindow) {
    if (isMac) {
      mainWindow.hide();
    } else {
      mainWindow.close();
    }
  }
});
