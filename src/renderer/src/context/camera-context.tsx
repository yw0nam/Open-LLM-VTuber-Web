import { createContext, useContext, useRef, useState, ReactNode } from 'react';

interface CameraContextType {
  isStreaming: boolean;
  stream: MediaStream | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

const CameraContext = createContext<CameraContextType | null>(null);

export function CameraProvider({ children }: { children: ReactNode }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 320 },
          height: { ideal: 240 }
        } 
      });
      
      streamRef.current = stream;
      setIsStreaming(true);
      // startStreamingToBackend(stream);
      
    } catch (err) {
      console.error('Camera error:', err);
      throw err;
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsStreaming(false);
      // stopStreamingToBackend();
    }
  };

  return (
    <CameraContext.Provider 
      value={{
        isStreaming,
        stream: streamRef.current,
        startCamera,
        stopCamera,
      }}
    >
      {children}
    </CameraContext.Provider>
  );
}

export const useCamera = () => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
}; 