import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  setIgnoreMouseEvents: (ignore: boolean) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore)
  },
  showContextMenu: () => {
    console.log('Preload showContextMenu')
    ipcRenderer.send('show-context-menu')
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
  },
  updateComponentHover: (componentId: string, isHovering: boolean) => {
    ipcRenderer.send('update-component-hover', componentId, isHovering)
  },
  onToggleInputSubtitle: (callback: () => void) => {
    const handler = (_event: any) => callback()
    ipcRenderer.on('toggle-input-subtitle', handler)
    return () => ipcRenderer.removeListener('toggle-input-subtitle', handler)
  },
  onToggleScrollToResize: (callback: () => void) => {
    const handler = (_event: any) => callback()
    ipcRenderer.on('toggle-scroll-to-resize', handler)
    return () => ipcRenderer.removeListener('toggle-scroll-to-resize', handler)
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
