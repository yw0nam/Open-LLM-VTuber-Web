import React, { createContext, useState, useMemo, useContext } from 'react';

interface SubtitleContextState {
  subtitleText: string;
  setSubtitleText: (text: string) => void;
}

export const SubtitleContext = createContext<SubtitleContextState | null>(null);

export const SubtitleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subtitleText, setSubtitleText] = useState<string>(
    "Hi, I'm some random AI VTuber. Who the hell are ya? Ahh, you must be amazed by my awesomeness, right? right?"
  );

  const value = useMemo(() => ({
    subtitleText,
    setSubtitleText,
  }), [subtitleText]);

  return (
    <SubtitleContext.Provider value={value}>
      {children}
    </SubtitleContext.Provider>
  );
};

export const useSubtitle = () => {
  const context = useContext(SubtitleContext);
  if (!context) {
    throw new Error('useSubtitle must be used within a SubtitleProvider');
  }
  return context;
};
