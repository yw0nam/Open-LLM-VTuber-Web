import { createContext, useState, useMemo, useContext, useCallback } from "react";

/**
 * Response context state interface
 * @interface ResponseState
 */
interface ResponseState {
  /** Full response text */
  fullResponse: string;
  
  /** Set complete response text */
  setFullResponse: (text: string) => void;
  
  /** Append text to existing response */
  appendResponse: (text: string) => void;
  
  /** Clear current response */
  clearResponse: () => void;
}

/**
 * Default values and constants
 */
const DEFAULT_RESPONSE = {
  fullResponse: "",
};

/**
 * Create the response context
 */
export const ResponseContext = createContext<ResponseState | null>(null);

/**
 * Response Provider Component
 * Manages the AI response text state and operations
 * 
 * @param {Object} props - Provider props
 * @param {React.ReactNode} props.children - Child components
 */
export function ResponseProvider({ children }: { children: React.ReactNode }) {
  // State management
  const [fullResponse, setFullResponse] = useState(DEFAULT_RESPONSE.fullResponse);

  /**
   * Append new text to existing response
   * @param text - Text to append
   */
  const appendResponse = useCallback((text: string) => {
    setFullResponse((prev) => prev + (text || ""));
  }, []);

  /**
   * Clear current response
   */
  const clearResponse = useCallback(() => {
    setFullResponse(DEFAULT_RESPONSE.fullResponse);
  }, []);

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      fullResponse,
      setFullResponse,
      appendResponse,
      clearResponse,
    }),
    [fullResponse, appendResponse, clearResponse]
  );

  return (
    <ResponseContext.Provider value={contextValue}>
      {children}
    </ResponseContext.Provider>
  );
}

/**
 * Custom hook to use the response context
 * @throws {Error} If used outside of ResponseProvider
 */
export function useResponse() {
  const context = useContext(ResponseContext);

  if (!context) {
    throw new Error("useResponse must be used within a ResponseProvider");
  }

  return context;
}
