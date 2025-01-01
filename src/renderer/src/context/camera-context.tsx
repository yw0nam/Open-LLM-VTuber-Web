import {
  createContext,
  useContext,
  useRef,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from "react";

/**
 * Camera configuration interface
 * @interface CameraConfig
 */
interface CameraConfig {
  width: number;
  height: number;
}

/**
 * Camera context state interface
 * @interface CameraContextState
 */
interface CameraContextState {
  isStreaming: boolean;
  stream: MediaStream | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  cameraConfig: CameraConfig;
  setCameraConfig: (config: CameraConfig) => void;
}

/**
 * Default values and constants
 */
const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  width: 320,
  height: 240,
};

/**
 * Create the camera context
 */
const CameraContext = createContext<CameraContextState | null>(null);

/**
 * Camera Provider Component
 * @param {Object} props - Provider props
 * @param {React.ReactNode} props.children - Child components
 */
export function CameraProvider({ children }: { children: ReactNode }) {
  // State management
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraConfig, setCameraConfig] = useState<CameraConfig>(
    DEFAULT_CAMERA_CONFIG
  );
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: cameraConfig.width },
          height: { ideal: cameraConfig.height },
        },
      });

      streamRef.current = stream;
      setIsStreaming(true);
      // startStreamingToBackend(stream);
    } catch (err) {
      console.error("Failed to start camera:", err);
      throw err;
    }
  }, [cameraConfig]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsStreaming(false);
      // stopStreamingToBackend();
    }
  }, []);

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      isStreaming,
      stream: streamRef.current,
      startCamera,
      stopCamera,
      cameraConfig,
      setCameraConfig,
    }),
    [isStreaming, startCamera, stopCamera, cameraConfig]
  );

  return (
    <CameraContext.Provider value={contextValue}>
      {children}
    </CameraContext.Provider>
  );
}

/**
 * Custom hook to use the camera context
 * @throws {Error} If used outside of CameraProvider
 */
export function useCamera() {
  const context = useContext(CameraContext);

  if (!context) {
    throw new Error("useCamera must be used within a CameraProvider");
  }

  return context;
}
