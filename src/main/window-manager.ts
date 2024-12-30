import { BrowserWindow, screen, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

const isMac = process.platform === 'darwin'

export class WindowManager {
  private window: BrowserWindow | null = null

  constructor() {}

  createWindow(): BrowserWindow {
    this.window = new BrowserWindow({
      width: 900,
      height: 670,
      show: false,
      transparent: true,
      backgroundColor: '#ffffff',
      autoHideMenuBar: true,
      frame: false,
      ...(isMac ? { titleBarStyle: 'hiddenInset' } : {}),
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: true
      },
      hasShadow: false,
      paintWhenInitiallyHidden: true
    })

    this.setupWindowEvents()
    this.loadContent()

    return this.window
  }

  private setupWindowEvents(): void {
    if (!this.window) return

    this.window.on('ready-to-show', () => {
      this.window?.show()
    })

    this.window.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })
  }

  private loadContent(): void {
    if (!this.window) return

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this.window.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      this.window.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }

  setWindowMode(mode: 'window' | 'pet'): void {
    if (!this.window) return
    
    this.window.setOpacity(0)
    
    if (mode === 'window') {
      this.setWindowModeWindow()
    } else {
      this.setWindowModePet()
    }

    setTimeout(() => {
      this.window?.setOpacity(1)
    }, 800)
  }

  private setWindowModeWindow(): void {
    if (!this.window) return    

    this.window.setSize(900, 670)
    this.window.center()
    this.window.setAlwaysOnTop(false)
    this.window.setIgnoreMouseEvents(false)
    this.window.setSkipTaskbar(false)
    this.window.setResizable(true)
    this.window.setFocusable(true)
    this.window.setAlwaysOnTop(false)
    
    this.window.setBackgroundColor('#ffffff')
    
    if (isMac) {
      this.window.setWindowButtonVisibility(true)
      this.window.setVisibleOnAllWorkspaces(false, { visibleOnFullScreen: false })
    }

    this.window.webContents.send('mode-changed', 'window')
  }

  private setWindowModePet(): void {
    if (!this.window) return;

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    if (this.window.isFullScreen()) {
      this.window.setFullScreen(false);
    }

    this.window.setBackgroundColor("#00000000");

    this.window.setAlwaysOnTop(true, "screen-saver");
    this.window.setPosition(0, 0);

    setTimeout(() => {
      this.window?.setSize(width, height);

      if (isMac) this.window?.setWindowButtonVisibility(false);
      this.window?.setResizable(false);
      this.window?.setSkipTaskbar(true);
      this.window?.setFocusable(false);

      if (isMac) {
        this.window?.setIgnoreMouseEvents(true);
        this.window?.setVisibleOnAllWorkspaces(true, {
          visibleOnFullScreen: true,
        });
      } else {
        this.window?.setIgnoreMouseEvents(true, { forward: true });
      }

      setTimeout(() => {
        this.window?.setBackgroundColor("#00000000");
        this.window?.webContents.send("mode-changed", "pet");
      }, 400);
    }, 200);
  }

  getWindow(): BrowserWindow | null {
    return this.window
  }

  setIgnoreMouseEvents(ignore: boolean): void {
    if (!this.window) return
    
    if (isMac) {
      this.window.setIgnoreMouseEvents(ignore)
    } else {
      this.window.setIgnoreMouseEvents(ignore, { forward: true })
    }
  }
} 