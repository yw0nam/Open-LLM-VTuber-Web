import { useEffect, useState } from 'react'
import { Box, IconButton } from '@chakra-ui/react'
import { FiMinus, FiMaximize2, FiMinimize2, FiX } from 'react-icons/fi'
import { layoutStyles } from '../layout'

const TitleBar = (): JSX.Element => {
  const [isMaximized, setIsMaximized] = useState(false)
  const isMac = window.electron?.process.platform === 'darwin'

  useEffect(() => {
    const handleMaximizeChange = (_event: any, maximized: boolean) => {
      setIsMaximized(maximized)
    }

    window.electron?.ipcRenderer.on('window-maximized-change', handleMaximizeChange)

    return () => {
      window.electron?.ipcRenderer.removeAllListeners('window-maximized-change')
    }
  }, [])

  if (isMac) {
    return (
      <Box {...layoutStyles.macTitleBar}>
        <Box {...layoutStyles.titleBarTitle}>
          Open LLM VTuber
        </Box>
      </Box>
    )
  }

  return (
    <Box {...layoutStyles.windowsTitleBar}>
      <Box {...layoutStyles.titleBarTitle}>
        Open LLM VTuber
      </Box>
      <Box {...layoutStyles.titleBarButtons}>
        <IconButton
          {...layoutStyles.titleBarButton}
          onClick={() => window.electron?.ipcRenderer.send('window-minimize')}
          aria-label="Minimize"
        >
          <FiMinus />
        </IconButton>
        <IconButton
          {...layoutStyles.titleBarButton}
          onClick={() => window.electron?.ipcRenderer.send('window-maximize')}
          aria-label="Maximize"
        >
          {isMaximized ? <FiMinimize2 /> : <FiMaximize2 />}
        </IconButton>
        <IconButton
          {...layoutStyles.closeButton}
          onClick={() => window.electron?.ipcRenderer.send('window-close')}
          aria-label="Close"
        >
          <FiX />
        </IconButton>
      </Box>
    </Box>
  )
}

export default TitleBar
