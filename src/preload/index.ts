import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  setIgnoreMouseEvents: (ignore: boolean) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore)
  },
  showContextMenu: (x: number, y: number) => {
    ipcRenderer.send('show-context-menu', { x, y })
  },
  onModeChanged: (callback: (mode: string) => void) => {
    ipcRenderer.on('mode-changed', (_, mode) => callback(mode))
  },
  onMicToggle: (callback: () => void) => {
    const handler = (_event: any) => callback()
    ipcRenderer.on('mic-toggle', handler)
    return () => ipcRenderer.removeListener('mic-toggle', handler)
  },
  onInterrupt: (callback: () => void) => {
    const handler = (_event: any) => callback()
    ipcRenderer.on('interrupt', handler)
    return () => ipcRenderer.removeListener('interrupt', handler)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
