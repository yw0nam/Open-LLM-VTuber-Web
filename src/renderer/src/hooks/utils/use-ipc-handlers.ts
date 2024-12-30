import { useEffect, useCallback } from 'react'
import { useInterrupt } from '@/components/canvas/live2d'
import { useMicToggle } from './use-mic-toggle'

export function useIpcHandlers() {
  const { handleMicToggle } = useMicToggle()
  const { interrupt } = useInterrupt()

  const micToggleHandler = useCallback(() => {
    handleMicToggle()
  }, [handleMicToggle])

  const interruptHandler = useCallback(() => {
    interrupt()
  }, [interrupt])

  useEffect(() => {
    if (!window.electron?.ipcRenderer) return

    window.electron.ipcRenderer.removeAllListeners('mic-toggle')
    window.electron.ipcRenderer.removeAllListeners('interrupt')

    window.electron.ipcRenderer.on('mic-toggle', micToggleHandler)
    window.electron.ipcRenderer.on('interrupt', interruptHandler)

    return () => {
      window.electron?.ipcRenderer.removeAllListeners('mic-toggle')
      window.electron?.ipcRenderer.removeAllListeners('interrupt')
    }
  }, [micToggleHandler, interruptHandler])
} 