import { Box } from '@chakra-ui/react';
import { useWebSocket } from '@/context/websocket-context';
import { canvasStyles } from './canvas-styles';

function WebSocketStatus() {
  const { wsState } = useWebSocket();
  
  const getStatusColor = () => {
    switch(wsState) {
      case 'OPEN':
        return 'green.500';
      case 'CONNECTING':
        return 'yellow.500';
      default:
        return 'red.500';
    }
  };

  const getStatusText = () => {
    switch(wsState) {
      case 'OPEN':
        return 'Connected';
      case 'CONNECTING':
        return 'Connecting';
      default:
        return 'Disconnected';
    }
  };

  return (
    <Box 
      {...canvasStyles.wsStatus.container}
      backgroundColor={getStatusColor()}
    >
      {getStatusText()}
    </Box>
  );
}

export default WebSocketStatus;