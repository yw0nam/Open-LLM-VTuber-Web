import { createContext, useContext } from 'react';
import { useLocalStorage } from '@/hooks/utils/use-local-storage';

export interface ConfigFile {
  filename: string;
  name: string;
}

interface ConfigContextProps {
  confName: string;
  confUid: string;
  configFiles: ConfigFile[];
  setConfName: (name: string) => void;
  setConfUid: (uid: string) => void;
  setConfigFiles: (files: ConfigFile[]) => void;
}

export const ConfigContext = createContext<ConfigContextProps | null>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [confName, setConfName] = useLocalStorage<string>('confName', '');
  const [confUid, setConfUid] = useLocalStorage<string>('confUid', '');
  const [configFiles, setConfigFiles] = useLocalStorage<ConfigFile[]>('configFiles', []);

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
