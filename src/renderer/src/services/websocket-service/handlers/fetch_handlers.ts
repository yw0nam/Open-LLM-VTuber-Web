import { WSServerMessage } from "@/services/schemas/websocket";
import { MessageHandler } from "./types";

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
    deps.setAiState('loading');
    
    if (message.conf_name) {
      deps.config.setConfName(message.conf_name);
    }
    if (message.conf_uid) {
      deps.config.setConfUid(message.conf_uid);
    }
    
    // Handle model info if needed
    const modelInfo = message.model_info as any;
    
    if (modelInfo && modelInfo.url && !modelInfo.url.startsWith("http")) {
      const modelUrl = deps.baseUrl + modelInfo.url;
      modelInfo.url = modelUrl;
    }

    deps.setAiState('idle');
  },

  /**
   * Handles list of available avatar configuration files
   */
  avatar_config_files: (message, deps) => {
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
      if (message.files && deps.bgUrl) {
        deps.bgUrl.setBackgroundFiles(message.files);
      }
  }
};
