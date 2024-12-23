import {
  Box, Input, IconButton, HStack,
} from '@chakra-ui/react';
import { BsMicFill, BsMicMuteFill, BsPaperclip } from 'react-icons/bs';
import { IoHandRightSharp } from 'react-icons/io5';
import { FiChevronDown } from 'react-icons/fi';
import { InputGroup } from '@/components/ui/input-group';
import { footerStyles } from './footer-styles';
import AIStateIndicator from './ai-state-indicator';
import { useTextInput } from '@/hooks/use-text-input';
import { useInterrupt } from '@/components/canvas/live2d';
import { useVAD } from '@/context/vad-context';

interface FooterProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

function Footer({ isCollapsed = false, onToggle }: FooterProps) {
  const styles = footerStyles.footer;
  const {
    inputValue,
    handleInputChange,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
  } = useTextInput();
  const { interrupt } = useInterrupt();
  const { startMic, stopMic, micOn } = useVAD();

  const handleMicToggle = async () => {
    if (micOn) {
      stopMic();
    } else {
      await startMic();
    }
  };

  return (
    <Box {...styles.container(isCollapsed)}>
      <Box
        {...styles.toggleButton}
        onClick={onToggle}
        color='whiteAlpha.500'
        style={{
          transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
      >
        <FiChevronDown />
      </Box>

      <Box pt="0" px="4">
        <HStack width="100%" gap={4}>
          <Box>
            <Box mb="1.5">
              <AIStateIndicator />
            </Box>
            <HStack gap={2}>
              <IconButton
                bg={micOn ? "green.500" : "red.500"}
                {...styles.actionButton}
                onClick={handleMicToggle}
              >
                {micOn ? <BsMicFill /> : <BsMicMuteFill />}
              </IconButton>
              <IconButton
                aria-label="Raise hand"
                bg="yellow.500"
                {...styles.actionButton}
                onClick={interrupt}
              >
                <IoHandRightSharp size="24" />
              </IconButton>
            </HStack>
          </Box>

          <InputGroup flex={1}>
            <Box position="relative" width="100%">
              <IconButton
                aria-label="Attach file"
                variant="ghost"
                {...styles.attachButton}
              >
                <BsPaperclip size="24" />
              </IconButton>
              <Input
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                placeholder="Type your message..."
                {...styles.input}
              />
            </Box>
          </InputGroup>
        </HStack>
      </Box>
    </Box>
  );
}

export default Footer;
