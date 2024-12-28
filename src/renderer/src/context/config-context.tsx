import React, { createContext, useContext, useState } from 'react';

export interface ConfigFile {
  [confName: string]: string;  // confName -> fileName mapping
}

interface ConfigContextProps {
  confName: string;
  confUid: string;
  configFiles: ConfigFile;
  setConfName: (name: string) => void;
  setConfUid: (uid: string) => void;
  setConfigFiles: (files: ConfigFile) => void;
}

export const ConfigContext = createContext<ConfigContextProps | null>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [confName, setConfName] = useState<string>('');
  const [confUid, setConfUid] = useState<string>('');
  const [configFiles, setConfigFiles] = useState<ConfigFile>({});

  return (
    <ConfigContext.Provider value={{
      confName,
      confUid,
      configFiles,
      setConfName,
      setConfUid,
      setConfigFiles
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
