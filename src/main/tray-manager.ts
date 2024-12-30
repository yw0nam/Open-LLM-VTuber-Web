import { Tray, nativeImage, Menu, BrowserWindow } from 'electron'
import trayIcon from '../../resources/icon.png?asset'

export class TrayManager {
  private tray: Tray | null = null
  private currentMode: 'window' | 'pet' = 'window'

  constructor(private onModeChange: (mode: 'window' | 'pet') => void) {}

  createTray(): void {
    const icon = nativeImage.createFromPath(trayIcon)
    const trayIconResized = icon.resize({
      width: process.platform === 'win32' ? 16 : 18,
      height: process.platform === 'win32' ? 16 : 18
    })
    
    this.tray = new Tray(trayIconResized)
    this.updateContextMenu()
  }

  private updateContextMenu(): void {
    if (!this.tray) return

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Window Mode',
        type: 'radio',
        checked: this.currentMode === 'window',
        click: () => {
          this.setMode('window')
        }
      },
      {
        label: 'Pet Mode',
        type: 'radio',
        checked: this.currentMode === 'pet',
        click: () => {
          this.setMode('pet')
        }
      },
      { type: 'separator' },
      {
        label: 'Show',
        click: () => {
          const windows = BrowserWindow.getAllWindows()
          windows.forEach(window => {
            window.show()
          })
        }
      },
      {
        label: 'Hide',
        click: () => {
          const windows = BrowserWindow.getAllWindows()
          windows.forEach(window => {
            window.hide()
          })
        }
      },
      {
        label: 'Exit',
        click: () => {
          require('electron').app.quit()
        }
      }
    ])

    this.tray.setToolTip('Open LLM VTuber')
    this.tray.setContextMenu(contextMenu)
  }

  setMode(mode: 'window' | 'pet'): void {
    this.currentMode = mode
    this.updateContextMenu()
    this.onModeChange(mode)
  }

  destroy(): void {
    this.tray?.destroy()
    this.tray = null
  }
} 