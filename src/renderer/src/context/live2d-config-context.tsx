import {
  createContext, useContext, useState, useMemo, useEffect,
} from 'react';
import { useLocalStorage } from '@/hooks/utils/use-local-storage';
// import { useConfig } from '@/context/character-config-context'; // Not used currently

/**
 * Model emotion mapping interface
 * @interface EmotionMap
 */
interface EmotionMap {
  [key: string]: number | string;
}

/**
 * Motion weight mapping interface
 * @interface MotionWeightMap
 */
export interface MotionWeightMap {
  [key: string]: number;
}

/**
 * Tap motion mapping interface
 * @interface TapMotionMap
 */
export interface TapMotionMap {
  [key: string]: MotionWeightMap;
}

/**
 * Live2D model information interface
 * @interface ModelInfo
 */
export interface ModelInfo {
  /** Model name */
  name?: string;

  /** Model description */
  description?: string;

  /** Model URL */
  url: string;

  /** Scale factor */
  kScale: number;

  /** Initial X position shift */
  initialXshift: number;

  /** Initial Y position shift */
  initialYshift: number;

  /** Idle motion group name */
  idleMotionGroupName?: string;

  /** Default emotion */
  defaultEmotion?: number | string;

  /** Emotion mapping configuration */
  emotionMap: EmotionMap;

  /** Enable pointer interactivity */
  pointerInteractive?: boolean;

  /** Tap motion mapping configuration */
  tapMotions?: TapMotionMap;

  /** Enable scroll to resize */
  scrollToResize?: boolean;

  /** Initial scale */
  initialScale?: number;
}

/**
 * Live2D configuration context state interface
 * @interface Live2DConfigState
 */
interface Live2DConfigState {
  modelInfo?: ModelInfo;
  setModelInfo: (info: ModelInfo | undefined) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

/**
 * Default values and constants
 */
const DEFAULT_CONFIG = {
  modelInfo: {
    scrollToResize: true,
  } as ModelInfo | undefined,
  isLoading: false,
};

/**
 * Create the Live2D configuration context
 */
export const Live2DConfigContext = createContext<Live2DConfigState | null>(null);

/**
 * Live2D Configuration Provider Component
 * @param {Object} props - Provider props
 * @param {React.ReactNode} props.children - Child components
 */
export function Live2DConfigProvider({ children }: { children: React.ReactNode }) {
  // const { confUid } = useConfig(); // Not used currently

  const [isLoading, setIsLoading] = useState(DEFAULT_CONFIG.isLoading);
  const [hasLoadedDefault, setHasLoadedDefault] = useState(false);

  const [modelInfo, setModelInfoState] = useLocalStorage<ModelInfo | undefined>(
    "modelInfo",
    DEFAULT_CONFIG.modelInfo,
    {
      filter: (value) => (value ? { ...value, url: "" } : value),
    },
  );

  // const [modelInfo, setModelInfoState] = useState<ModelInfo | undefined>(DEFAULT_CONFIG.modelInfo);

  const setModelInfo = (info: ModelInfo | undefined) => {
    if (!info?.url) {
      setModelInfoState(undefined);
      return;
    }

    // Always use the scale defined in the incoming info object (from config)
    const finalScale = Number(info.kScale || 0.5) * 2;
    console.log("Setting model info with default scale:", finalScale);

    setModelInfoState({
      ...info,
      kScale: finalScale,
      pointerInteractive:
        "pointerInteractive" in info
          ? info.pointerInteractive
          : (modelInfo?.pointerInteractive ?? true),
      scrollToResize:
        "scrollToResize" in info
          ? info.scrollToResize
          : (modelInfo?.scrollToResize ?? true),
    });
  };

  // Load default model on startup if no model is configured
  useEffect(() => {
    const loadDefaultModel = async () => {
      // Only load default if no model is currently set and we haven't loaded it yet
      if ((!modelInfo?.url || modelInfo.url === '') && !hasLoadedDefault) {
        console.log('No model configured, loading default model...');
        setHasLoadedDefault(true);
        
        try {
          // Fetch the default model config
          const response = await fetch('/live2d-models/mao_config.json');
          const config = await response.json();
          
          console.log('Loaded default model config:', config);
          
          // Set the model info with the config data
          const defaultModelInfo: ModelInfo = {
            name: config.name,
            description: config.description,
            url: config.model, // This will be '/live2d-models/mao_pro_jp/runtime/mao_pro.model3.json'
            kScale: config.scale || 0.15,
            initialXshift: config.x || 0,
            initialYshift: config.y || 0,
            emotionMap: {},
            pointerInteractive: true,
            scrollToResize: true,
          };
          
          setModelInfo(defaultModelInfo);
        } catch (error) {
          console.error('Failed to load default model config:', error);
        }
      }
    };

    loadDefaultModel();
  }, [modelInfo, hasLoadedDefault, setModelInfo]); // Add dependencies

  const contextValue = useMemo(
    () => ({
      modelInfo,
      setModelInfo,
      isLoading,
      setIsLoading,
    }),
    [modelInfo, isLoading, setIsLoading],
  );

  return (
    <Live2DConfigContext.Provider value={contextValue}>
      {children}
    </Live2DConfigContext.Provider>
  );
}

/**
 * Custom hook to use the Live2D configuration context
 * @throws {Error} If used outside of Live2DConfigProvider
 */
export function useLive2DConfig() {
  const context = useContext(Live2DConfigContext);

  if (!context) {
    throw new Error('useLive2DConfig must be used within a Live2DConfigProvider');
  }

  return context;
}

// Export the provider as default
export default Live2DConfigProvider;
