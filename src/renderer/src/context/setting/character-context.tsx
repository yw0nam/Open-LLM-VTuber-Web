import { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/utils/use-local-storage";

export interface ConfigFile {
  filename: string;
  name: string;
}

interface ASRConfig {
  asr_model: string;
  whisper: {
    name: string;
    download_root: string;
    device: string;
  };
}

const DEFAULT_ASR_CONFIG: ASRConfig = {
  asr_model: "whisper",
  whisper: {
    name: "",
    download_root: "",
    device: "cpu",
  },
};

interface CharacterContextProps {
  confName: string;
  confUid: string;
  configFiles: ConfigFile[];
  systemSchema: any;
  characterSchema: any;
  llmSchema: any;
  asrSchema: any;
  ttsSchema: any;
  translatorSchema: any;
  systemValues: any;
  characterValues: any;
  llmValues: any;
  asrValues: any;
  ttsValues: any;
  translatorValues: any;
  asrConfig: ASRConfig;
  setConfName: (name: string) => void;
  setConfUid: (uid: string) => void;
  setConfigFiles: (files: ConfigFile[]) => void;
  setSystemSchema: (schema: any) => void;
  setCharacterSchema: (schema: any) => void;
  setLlmSchema: (schema: any) => void;
  setAsrSchema: (schema: any) => void;
  setTtsSchema: (schema: any) => void;
  setTranslatorSchema: (schema: any) => void;
  setSystemValues: (values: any) => void;
  setCharacterValues: (values: any) => void;
  setLlmValues: (values: any) => void;
  setAsrValues: (values: any) => void;
  setTtsValues: (values: any) => void;
  setTranslatorValues: (values: any) => void;
  setAsrConfig: (config: ASRConfig) => void;
}

export const CharacterContext = createContext<CharacterContextProps | null>(
  null
);

export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const [confName, setConfName] = useLocalStorage<string>("confName", "");
  const [confUid, setConfUid] = useLocalStorage<string>("confUid", "");
  const [configFiles, setConfigFiles] = useLocalStorage<ConfigFile[]>(
    "configFiles",
    []
  );
  const [systemSchema, setSystemSchema] = useState<any>({});
  const [characterSchema, setCharacterSchema] = useState<any>({});
  const [llmSchema, setLlmSchema] = useState<any>({});
  const [asrSchema, setAsrSchema] = useState<any>({});
  const [ttsSchema, setTtsSchema] = useState<any>({});
  const [translatorSchema, setTranslatorSchema] = useState<any>({});
  const [systemValues, setSystemValues] = useState<any>({});
  const [characterValues, setCharacterValues] = useState<any>({});
  const [llmValues, setLlmValues] = useState<any>({});
  const [asrValues, setAsrValues] = useState<any>({});
  const [ttsValues, setTtsValues] = useState<any>({});
  const [translatorValues, setTranslatorValues] = useState<any>({});
  const [asrConfig, setAsrConfig] = useLocalStorage<ASRConfig>(
    "asr-config",
    DEFAULT_ASR_CONFIG
  );

  useEffect(() => {
    console.log("CharacterProvider", {
      // confName,
      // confUid,
      // configFiles,
      // systemSchema,
      // characterSchema,
      // llmSchema,
      asrSchema,
      // ttsSchema,
      // translatorSchema,
      asrConfig,
    });
  }, [
    confName,
    confUid,
    configFiles,
    systemSchema,
    characterSchema,
    llmSchema,
    asrSchema,
    ttsSchema,
    translatorSchema,
    asrConfig,
  ]);

  return (
    <CharacterContext.Provider
      value={{
        confName,
        confUid,
        configFiles,
        systemSchema,
        characterSchema,
        llmSchema,
        asrSchema,
        ttsSchema,
        translatorSchema,
        systemValues,
        characterValues,
        llmValues,
        asrValues,
        ttsValues,
        translatorValues,
        asrConfig,
        setConfName,
        setConfUid,
        setConfigFiles,
        setSystemSchema,
        setCharacterSchema,
        setLlmSchema,
        setAsrSchema,
        setTtsSchema,
        setTranslatorSchema,
        setSystemValues,
        setCharacterValues,
        setLlmValues,
        setAsrValues,
        setTtsValues,
        setTranslatorValues,
        setAsrConfig,
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
}

export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error("useCharacter must be used within a CharacterProvider");
  }
  return context;
};
