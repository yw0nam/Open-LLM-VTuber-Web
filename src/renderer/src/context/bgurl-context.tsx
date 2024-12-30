import { createContext, useMemo, useContext, useState, memo } from 'react';
import { baseUrl } from '@/context/websocket-context';
import { useLocalStorage } from '@/hooks/utils/use-local-storage';

// Type definitions
interface BackgroundFile {
  name: string;
  url: string;
}

export interface BgUrlContextState {
  backgroundUrl: string;
  setBackgroundUrl: (url: string) => void;
  backgroundFiles: BackgroundFile[];
  setBackgroundFiles: (files: BackgroundFile[]) => void;
}

// Context
const BgUrlContext = createContext<BgUrlContextState | null>(null);

// Default values
const DEFAULT_BACKGROUND = `${baseUrl}/bg/ceiling-window-room-night.jpeg`;

// Provider component
export const BgUrlProvider = memo(({ children }: { children: React.ReactNode }) => {
  const [backgroundUrl, setBackgroundUrl] = useLocalStorage<string>(
    'backgroundUrl',
    DEFAULT_BACKGROUND
  );
  const [backgroundFiles, setBackgroundFiles] = useState<BackgroundFile[]>([]);

  const value = useMemo(() => ({
    backgroundUrl,
    setBackgroundUrl,
    backgroundFiles,
    setBackgroundFiles,
  }), [backgroundUrl, backgroundFiles]);

  return (
    <BgUrlContext.Provider value={value}>
      {children}
    </BgUrlContext.Provider>
  );
});

BgUrlProvider.displayName = 'BgUrlProvider';

// Hook
export const useBgUrl = () => {
  const context = useContext(BgUrlContext);
  if (!context) {
    throw new Error('useBgUrl must be used within a BgUrlProvider');
  }
  return context;
};
