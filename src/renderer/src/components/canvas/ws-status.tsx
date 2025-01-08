import { Box } from '@chakra-ui/react';
import { memo } from 'react';
import { canvasStyles } from './canvas-styles';
import { useWSStatus } from '@/hooks/canvas/use-ws-status';

// Type definitions
interface StatusContentProps {
  text: string
}

// Reusable components
const StatusContent = memo(({ text }: StatusContentProps) => (
  <>{text}</>
));

StatusContent.displayName = 'StatusContent';

// Main component
const WebSocketStatus = memo((): JSX.Element => {
  const {
    color, text, handleClick, isDisconnected,
  } = useWSStatus();

  return (
    <Box
      {...canvasStyles.wsStatus.container}
      backgroundColor={color}
      onClick={handleClick}
      cursor={isDisconnected ? 'pointer' : 'default'}
      _hover={{
        opacity: isDisconnected ? 0.8 : 1,
      }}
    >
      <StatusContent text={text} />
    </Box>
  );
});

WebSocketStatus.displayName = 'WebSocketStatus';

export default WebSocketStatus;
