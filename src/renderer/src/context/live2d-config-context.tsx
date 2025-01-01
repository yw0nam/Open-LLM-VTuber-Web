import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { useLocalStorage } from '@/hooks/utils/use-local-storage';

// import { Live2DModel } from "pixi-live2d-display-lipsyncpatch";
export interface ModelInfo {
  name?: string;                  // Model name
  description?: string;           // Model description
  url: string;                    // Model URL
  kScale: number;                 // Scale factor
  initialXshift: number;          // Initial X position shift
  initialYshift: number;          // Initial Y position shift
  kXOffset?: number;             // X-axis offset coefficient
  idleMotionGroupName?: string;   // Idle motion group name
  emotionMap: {
    [key: string]: number | string;
  };
  pointerInteractive?: boolean;
}
interface Live2DConfigContextType {
  modelInfo?: ModelInfo;
  setModelInfo: (info: Live2DConfigContextType['modelInfo']) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const Live2DConfigContext = createContext<Live2DConfigContextType | null>(null);

export const Live2DConfigProvider = ({ children }: PropsWithChildren) => {
  const [modelInfo, setModelInfo] = useLocalStorage<ModelInfo | undefined>('modelInfo', undefined);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Live2DConfigContext.Provider value={{ 
      modelInfo, 
      setModelInfo,
      isLoading,
      setIsLoading
    }}>
      {children}
    </Live2DConfigContext.Provider>
  );
};

export function useLive2DConfig() {
  const context = useContext(Live2DConfigContext);
  if (!context) {
    throw new Error('useLive2DConfig must be used within a Live2DConfigProvider');
  }
  return context;
}

export default Live2DConfigProvider;
