import React, { createContext, useState, useMemo, useContext } from 'react';

interface BackgroundFile {
  name: string;
  url: string;
}

interface BgUrlContextState {
  backgroundUrl: string;
  setBackgroundUrl: (url: string) => void;
  backgroundFiles: BackgroundFile[];
  setBackgroundFiles: (files: BackgroundFile[]) => void;
}

export const BgUrlContext = createContext<BgUrlContextState | null>(null);

export const BgUrlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [backgroundUrl, setBackgroundUrl] = useState<string>('/bg/ceiling-window-room-night.jpeg');
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
};

export const useBgUrl = () => {
  const context = useContext(BgUrlContext);
  if (!context) {
    throw new Error('useBgUrl must be used within a BgUrlProvider');
  }
  return context;
};