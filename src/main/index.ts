import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  screen,
  Menu,
  Tray,
  nativeImage,
  globalShortcut
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import trayIcon from '../../resources/icon.png?asset'

const isMac = process.platform === 'darwin'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let currentMode = 'window'

type Mode = 'window' | 'pet'

function createTray() {
  const icon = nativeImage.createFromPath(trayIcon)
  const trayIconResized = icon.resize({
    width: process.platform === 'win32' ? 16 : 18,
    height: process.platform === 'win32' ? 16 : 18
  })
  tray = new Tray(trayIconResized)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Window Mode',
      type: 'radio',
      checked: currentMode === 'window',
      click: () => {
        setWindowMode('window')
      }
    },
    {
      label: 'Pet Mode',
      type: 'radio',
      checked: currentMode === 'pet',
      click: () => {
        setWindowMode('pet')
      }
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('Open LLM VTuber')
  tray.setContextMenu(contextMenu)
}

function setWindowMode(mode: Mode) {
  if (!mainWindow) return
  mainWindow.setOpacity(0)
  currentMode = mode
  if (mode === 'window') {
    mainWindow.setSize(900, 670)
    mainWindow.center()
    mainWindow.setAlwaysOnTop(false)
    mainWindow.setIgnoreMouseEvents(false)
    mainWindow.setSkipTaskbar(false)
    mainWindow.setResizable(true)
    mainWindow.setFocusable(true)
    mainWindow.setAlwaysOnTop(false)
    mainWindow.setBackgroundColor('#ffffff')
    if (isMac) {
      mainWindow.setWindowButtonVisibility(true)
      mainWindow.setVisibleOnAllWorkspaces(false, { visibleOnFullScreen: false })
    }

    mainWindow?.webContents.send('mode-changed', mode)

    setTimeout(() => {
      mainWindow?.setOpacity(1)
    }, 300)
  } else {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize

    mainWindow.setBackgroundColor('#00000000')
    mainWindow.setAlwaysOnTop(true, 'screen-saver')

    mainWindow.setPosition(0, 0)

    setTimeout(() => {
      mainWindow?.setSize(width, height)
    }, 100)

    if (isMac) mainWindow.setWindowButtonVisibility(false)
    mainWindow.setResizable(false)
    mainWindow.setSkipTaskbar(true)
    mainWindow.setFocusable(false)

    if (isMac) {
      mainWindow.setIgnoreMouseEvents(true)
      mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    } else {
      mainWindow.setIgnoreMouseEvents(true, { forward: true })
    }

    setTimeout(() => {
      mainWindow?.webContents.send('mode-changed', mode)
    }, 200)

    setTimeout(() => {
      mainWindow?.setOpacity(1)
    }, 300)
  }


}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    transparent: true,
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hiddenInset',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
    return false
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  globalShortcut.register('F12', () => {
    if (!mainWindow) return

    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools()
    } else {
      mainWindow.webContents.openDevTools()
    }
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show()
    } else if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createMainWindow()
  createTray()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('set-ignore-mouse-events', (_event: Electron.IpcMainEvent, ignore: boolean) => {
  if (mainWindow && currentMode === 'pet') {
    if (isMac) {
      mainWindow.setIgnoreMouseEvents(ignore)
    } else {
      mainWindow.setIgnoreMouseEvents(ignore, { forward: true })
    }
  }
})

app.on('before-quit', () => {
  isQuitting = true
  tray?.destroy()
  globalShortcut.unregisterAll()
})

ipcMain.on('window-minimize', () => {
  mainWindow?.minimize()
})

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.on('window-close', () => {
  if (mainWindow) {
    if (isMac) {
      mainWindow.hide()
    } else {
      mainWindow.close()
    }
  }
})
