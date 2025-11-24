import { WSServerMessage } from "@/services/schemas/websocket";
import { MessageHandler } from "./types";

// Note: We cannot use hooks like useAiState or useConfig here directly.
// They are injected via the 'deps' argument.

export const configHandlers: Partial<{
  [K in WSServerMessage["type"]]: MessageHandler<K>;
}> = {
  /**
   * Handles setting model and configuration details from server.
   */
  set_model_and_config: (message, deps) => {
    deps.setAiState('loading');
    
    if (message.conf_name) {
      deps.config.setConfName(message.conf_name);
    }
    if (message.conf_uid) {
      deps.config.setConfUid(message.conf_uid);
      console.log('confUid', message.conf_uid);
    }

    // Note: pendingModelInfo logic from original code is simplified here
    // as we don't have local state in this handler function.
    // If you need to persist state, it should be moved to a Context.
    
    const modelInfo = message.model_info;
    
    if (modelInfo && !modelInfo.url.startsWith("http")) {
      const modelUrl = deps.baseUrl + modelInfo.url;
      // eslint-disable-next-line no-param-reassign
      modelInfo.url = modelUrl;
    }

    deps.setAiState('idle');
  },

  background_files : (message, deps) => {
      if (message.files && deps.bgUrl) {
        deps.bgUrl.setBackgroundFiles(message.files);
      }
  }
};
