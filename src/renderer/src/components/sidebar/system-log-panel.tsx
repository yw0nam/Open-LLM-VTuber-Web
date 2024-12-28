import { Box, Text } from '@chakra-ui/react'
import { SystemLogEntry } from '@/types/system-log'
import SystemLogEntryComponent from './system-log-entry'
import { sidebarStyles } from './sidebar-styles'

const EXAMPLE_LOGS: SystemLogEntry[] = [
  {
    id: '1',
    content: 'lingo-ho@z440-ubuntu:~$ ollama serve',
    timestamp: new Date()
  },
  {
    id: '2',
    content: 'Error: listen tcp 0.0.0.0:11434: bind: address already in use',
    timestamp: new Date()
  },
  {
    id: '3',
    content: 'lingo-ho@z440-ubuntu:~$ ollama pull qwen2.5:7b-instruct-q5_K_M',
    timestamp: new Date()
  },
  {
    id: '4',
    content: 'pulling manifest',
    timestamp: new Date()
  }
]

function SystemLogPanel(): JSX.Element {
  return (
    <Box {...sidebarStyles.systemLogPanel.container}>
      <Text {...sidebarStyles.systemLogPanel.title}>System Log</Text>
      <Box {...sidebarStyles.systemLogPanel.logList}>
        {EXAMPLE_LOGS.map((log) => (
          <SystemLogEntryComponent key={log.id} entry={log} />
        ))}
      </Box>
    </Box>
  )
}

export default SystemLogPanel
