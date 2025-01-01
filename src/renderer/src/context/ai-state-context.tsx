import {
  createContext,
  useState,
  ReactNode,
  useContext,
  useCallback,
  useMemo,
} from "react";

/**
 * Enum for all possible AI states
 * @description Defines all possible states that the AI can be in
 */
export const enum AiStateEnum {
  IDLE = "idle",
  SPEAKING = "speaking",
  THINKING_SPEAKING = "thinking-speaking",
  INTERRUPTED = "interrupted",
  LOADING = "loading",
  LISTENING = "listening",
}

export type AiState = `${AiStateEnum}`;

/**
 * Type definition for the AI state context
 */
interface AiStateContextType {
  aiState: AiState;
  setAiState: (state: AiState) => void;
  isIdle: boolean;
  isSpeaking: boolean;
  isThinkingSpeaking: boolean;
  isInterrupted: boolean;
  isLoading: boolean;
  isListening: boolean;
  resetState: () => void;
}

/**
 * Initial context value
 */
const initialState: AiState = AiStateEnum.LOADING;

/**
 * Create the AI state context
 */
export const AiStateContext = createContext<AiStateContextType | null>(null);

/**
 * AI State Provider Component
 */
export function AiStateProvider({ children }: { children: ReactNode }) {
  const [aiState, setAiState] = useState<AiState>(initialState);

  // Memoized state checks
  const stateChecks = useMemo(
    () => ({
      isIdle: aiState === AiStateEnum.IDLE,
      isSpeaking: aiState === AiStateEnum.SPEAKING,
      isThinkingSpeaking: aiState === AiStateEnum.THINKING_SPEAKING,
      isInterrupted: aiState === AiStateEnum.INTERRUPTED,
      isLoading: aiState === AiStateEnum.LOADING,
      isListening: aiState === AiStateEnum.LISTENING,
    }),
    [aiState]
  );

  // Reset state handler
  const resetState = useCallback(() => {
    setAiState(AiStateEnum.IDLE);
  }, []);

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      aiState,
      setAiState,
      ...stateChecks,
      resetState,
    }),
    [aiState, stateChecks, resetState]
  );

  return (
    <AiStateContext.Provider value={contextValue}>
      {children}
    </AiStateContext.Provider>
  );
}

/**
 * Custom hook to use the AI state context
 * @throws {Error} If used outside of AiStateProvider
 */
export function useAiState() {
  const context = useContext(AiStateContext);

  if (!context) {
    throw new Error("useAiState must be used within a AiStateProvider");
  }

  return context;
}
