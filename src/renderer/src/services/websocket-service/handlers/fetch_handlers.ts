import { WSServerMessage } from "@/services/schemas/websocket";
import { MessageHandler } from "./types";
import type { ModelInfo } from "@/context/live2d-config-context";
import type { BackgroundFile } from "@/context/bgurl-context";

const buildAbsoluteUrl = (baseUrl: string, pathOrUrl: string): string => {
  if (!pathOrUrl) {
    return pathOrUrl;
  }

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedPath = pathOrUrl.startsWith("/")
    ? pathOrUrl
    : `/${pathOrUrl}`;

  return `${normalizedBase}${normalizedPath}`;
};

/**
 * Handlers for fetching and managing avatar configs and backgrounds
 */
export const fetchHandlers: Partial<{
  [K in WSServerMessage["type"]]: MessageHandler<K>;
}> = {
  /**
   * Handles setting model and configuration details from server.
   */
  set_model_and_conf: (message, deps) => {
    console.log("[fetch_handlers] Received set_model_and_conf:", message);
    deps.setAiState("loading");
    deps.live2d.setIsLoading(true);

    if (message.conf_name) {
      deps.config.setConfName(message.conf_name);
    }
    if (message.conf_uid) {
      deps.config.setConfUid(message.conf_uid);
    }
    // Set persona prompt from character config
    deps.config.setPersonaPrompt(message.persona_prompt || "");

    const incomingModelInfo = (message.model_info || {}) as Partial<ModelInfo>;
    console.log("[fetch_handlers] Incoming model info:", incomingModelInfo);

    if (!incomingModelInfo.url) {
      console.warn("[fetch_handlers] No model URL provided, clearing model");
      deps.live2d.setModelInfo(undefined);
      deps.live2d.setIsLoading(false);
      deps.setAiState("idle");
      return;
    }

    const resolvedUrl = buildAbsoluteUrl(deps.baseUrl, incomingModelInfo.url);
    console.log("[fetch_handlers] Resolved model URL:", resolvedUrl);

    const finalModelInfo = {
      ...incomingModelInfo,
      url: resolvedUrl,
    } as ModelInfo;

    console.log("[fetch_handlers] Setting model info:", finalModelInfo);
    deps.live2d.setModelInfo(finalModelInfo);

    deps.live2d.setIsLoading(false);
    deps.setAiState("idle");
  },

  /**
   * Handles list of available avatar configuration files
   */
  avatar_config_files: (message, deps) => {
      console.log("[fetch_handlers] Received avatar_config_files:", message.configs);
      deps.config.setConfigFiles(message.configs);
  },

  /**
   * Handles confirmation that avatar config switch is complete
   */
  avatar_config_switched: (message, deps) => {
      if (deps.toaster) {
          deps.toaster.create({
              title: deps.t("Config Switched"),
              description: message.file,
              type: "success",
              duration: 3000,
          });
      }
  },

  /**
   * Handles list of available background files
   */
  background_files: (message, deps) => {
      console.log("[fetch_handlers] Received background_files:", message.files);
      if (message.files && deps.bgUrl) {
        const backgroundFiles: BackgroundFile[] = message.files.map((entry) => {
          const normalizedPath = /^https?:\/\//i.test(entry)
            ? entry
            : entry.startsWith("/")
              ? entry
              : `/bg/${entry}`;
          const displayName = normalizedPath.split("/").pop() ?? entry;

          return {
            name: displayName,
            path: normalizedPath,
            url: buildAbsoluteUrl(deps.baseUrl, normalizedPath),
          };
        });

        console.log("[fetch_handlers] Setting background files:", backgroundFiles);
        deps.bgUrl.setBackgroundFiles(backgroundFiles);
      }
  }
};
