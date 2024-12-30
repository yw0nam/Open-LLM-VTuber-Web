import { app, ipcMain, globalShortcut } from "electron";
import { electronApp, optimizer } from "@electron-toolkit/utils";
import { WindowManager } from "./window-manager";
import { TrayManager } from "./tray-manager";
import { setupContextMenu } from "./context-menu";

let windowManager: WindowManager;
let trayManager: TrayManager;
let isQuitting = false;

function setupIPC(): void {
  ipcMain.handle("get-platform", () => {
    return process.platform;
  });

  ipcMain.on("set-ignore-mouse-events", (_event, ignore: boolean) => {
    const window = windowManager.getWindow();
    if (window) {
      windowManager.setIgnoreMouseEvents(ignore);
    }
  });

  ipcMain.on("window-minimize", () => {
    windowManager.getWindow()?.minimize();
  });

  ipcMain.on("window-maximize", () => {
    const window = windowManager.getWindow();
    if (window) {
      windowManager.maximizeWindow();
    }
  });

  ipcMain.on("window-close", () => {
    const window = windowManager.getWindow();
    if (window) {
      if (process.platform === "darwin") {
        window.hide();
      } else {
        window.close();
      }
    }
  });
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");

  windowManager = new WindowManager();
  trayManager = new TrayManager((mode) => windowManager.setWindowMode(mode));

  const window = windowManager.createWindow();
  trayManager.createTray();

  setupContextMenu((mode) => windowManager.setWindowMode(mode));

  window.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      window.hide();
    }
    return false;
  });

  globalShortcut.register("F12", () => {
    const window = windowManager.getWindow();
    if (!window) return;

    if (window.webContents.isDevToolsOpened()) {
      window.webContents.closeDevTools();
    } else {
      window.webContents.openDevTools();
    }
  });

  setupIPC();

  app.on("activate", () => {
    const window = windowManager.getWindow();
    if (window) {
      window.show();
    }
  });

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
  trayManager.destroy();
  globalShortcut.unregisterAll();
});
