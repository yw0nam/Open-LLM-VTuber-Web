import { createContext, useState, PropsWithChildren } from 'react';

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
  pointerInteractive?: boolean; // 新增字段
}
interface L2DContextType {
  modelInfo?: ModelInfo;
  setModelInfo: (info: L2DContextType['modelInfo']) => void;
  // l2dModel: Live2DModel | null;
  // setL2dModel: (model: Live2DModel | null) => void;
}

export const L2DContext = createContext<L2DContextType | null>(null);

export const L2DProvider = ({ children }: PropsWithChildren) => {
  const [modelInfo, setModelInfo] = useState<L2DContextType['modelInfo']>();
  // const [l2dModel, setL2dModel] = useState<Live2DModel | null>(null);

  return (
    <L2DContext.Provider value={{ modelInfo, setModelInfo}}>
      {children}
    </L2DContext.Provider>
  );
};

export default L2DProvider;