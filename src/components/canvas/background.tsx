import React from 'react';
import { Box, Image } from '@chakra-ui/react';
import { canvasStyles } from './canvas-styles';
import { useBgUrl } from '@/context/bgurl-context';

const Background: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const context = useBgUrl();
  
  if (!context) return null;
  const { backgroundUrl } = context;

  return (
    <Box {...canvasStyles.background.container}>
      {backgroundUrl && (
        <Image
          src={backgroundUrl}
          alt="Background"
          {...canvasStyles.background.image}
        />
      )}
      {children}
    </Box>
  );
};

export default Background;
