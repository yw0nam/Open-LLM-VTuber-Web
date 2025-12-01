import { useMemo, useCallback } from "react";
import { useWebSocket } from "@/context/websocket-context";

interface WSStatusInfo {
  color: string;
  textKey: string;
  isDisconnected: boolean;
  handleClick: () => void;
}

export const useWSStatus = () => {
  const { wsState, reconnect } = useWebSocket();

  const handleClick = useCallback(() => {
    if (wsState !== "OPEN" && wsState !== "CONNECTING" && wsState !== "AUTHORIZING") {
      reconnect();
    }
  }, [wsState, reconnect]);

  const statusInfo = useMemo((): WSStatusInfo => {
    switch (wsState) {
      case "OPEN":
      case "READY":
        return {
          color: "green.500",
          textKey: "wsStatus.connected",
          isDisconnected: false,
          handleClick,
        };
      case "CONNECTING":
      case "AUTHORIZING":
        return {
          color: "yellow.500",
          textKey: "wsStatus.connecting",
          isDisconnected: false,
          handleClick,
        };
      default:
        return {
          color: "red.500",
          textKey: "wsStatus.clickToReconnect",
          isDisconnected: true,
          handleClick,
        };
    }
  }, [wsState, handleClick]);

  return statusInfo;
};
