import { useWebSocket } from '@/context/websocket-context'
import { useMemo } from 'react'

interface WSStatusInfo {
  color: string
  text: string
}

export const useWSStatus = () => {
  const { wsState } = useWebSocket()

  const statusInfo = useMemo((): WSStatusInfo => {
    switch (wsState) {
      case 'OPEN':
        return {
          color: 'green.500',
          text: 'Connected'
        }
      case 'CONNECTING':
        return {
          color: 'yellow.500',
          text: 'Connecting'
        }
      default:
        return {
          color: 'red.500',
          text: 'Disconnected'
        }
    }
  }, [wsState])

  return statusInfo
} 