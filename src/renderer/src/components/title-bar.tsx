import React from 'react'
import { Box, IconButton } from '@chakra-ui/react'
import { FiMinus, FiMaximize2, FiX } from 'react-icons/fi'

const TitleBar: React.FC = () => {
  const handleMinimize = () => {
    window.electron.ipcRenderer.send('window-minimize')
  }

  const handleMaximize = () => {
    window.electron.ipcRenderer.send('window-maximize')
  }

  const handleClose = () => {
    window.electron.ipcRenderer.send('window-close')
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="flex-end"
      height="30px"
      backgroundColor="gray.800"
      paddingRight="10px"
      css={{ '-webkit-app-region': 'drag' }}
    >
      <IconButton
        size="sm"
        variant="ghost"
        onClick={handleMinimize}
        css={{ '-webkit-app-region': 'no-drag' }}
      >
        <FiMinus />
      </IconButton>

      <IconButton
        size="sm"
        variant="ghost"
        onClick={handleMaximize}
        css={{ '-webkit-app-region': 'no-drag' }}
      >
        <FiMaximize2 />
      </IconButton>

      <IconButton
        size="sm"
        variant="ghost"
        onClick={handleClose}
        css={{ '-webkit-app-region': 'no-drag' }}
      >
        <FiX />
      </IconButton>
    </Box>
  )
}

export default TitleBar
