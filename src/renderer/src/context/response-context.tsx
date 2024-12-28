import React, { createContext, useState, useMemo, useContext } from 'react';

interface ResponseContextState {
  fullResponse: string;
  setFullResponse: (text: string) => void;
  appendResponse: (text: string) => void;
  clearResponse: () => void;
}

export const ResponseContext = createContext<ResponseContextState | null>(null);

export const ResponseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fullResponse, setFullResponse] = useState('');

  const value = useMemo(() => ({
    fullResponse,
    setFullResponse,
    appendResponse: (text: string) => setFullResponse(prev => prev + (text || '')),
    clearResponse: () => setFullResponse('')
  }), [fullResponse]);

  return (
    <ResponseContext.Provider value={value}>
      {children}
    </ResponseContext.Provider>
  );
};

export const useResponse = () => {
  const context = useContext(ResponseContext);
  if (!context) {
    throw new Error('useResponse must be used within a ResponseProvider');
  }
  return context;
};
