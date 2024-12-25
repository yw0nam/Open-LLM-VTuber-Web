import { createContext, useState, ReactNode, useContext } from "react";

type AiState =
  | "idle"
  | "speaking"
  | "thinking-speaking"
  | "interrupted"
  | "loading"
  | "listening";

interface AiStateContextType {
  aiState: AiState;
  setAiState: (state: AiState) => void;
}

export const AiStateContext = createContext<AiStateContextType | null>(null);

export function AiStateProvider({ children }: { children: ReactNode }) {
  const [aiState, setAiState] = useState<AiState>("loading");

  return (
    <AiStateContext.Provider value={{ aiState, setAiState }}>
      {children}
    </AiStateContext.Provider>
  );
}

export function useAiState() {
  const context = useContext(AiStateContext);
  if (!context) {
    throw new Error("useAiState must be used within a AiStateProvider");
  }
  return context;
}
  