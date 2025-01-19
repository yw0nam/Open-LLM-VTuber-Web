/* eslint-disable consistent-return */
import { memo, useMemo, useEffect } from "react";
import { useLive2DConfig } from "@/context/live2d-config-context";
import { useVAD } from "@/context/vad-context";
import { useIpcHandlers } from "@/hooks/utils/use-ipc-handlers";
import { useLive2DModel } from "@/hooks/canvas/use-live2d-model";
import { useLive2DResize } from "@/hooks/canvas/use-live2d-resize";
import { useInterrupt } from "@/hooks/utils/use-interrupt";
import { useAudioTask } from "@/hooks/utils/use-audio-task";
import { useSwitchCharacter } from "@/hooks/utils/use-switch-character";

// Type definitions
interface Live2DProps {
  isPet: boolean;
}

// Main component
export const Live2D = memo(({ isPet }: Live2DProps): JSX.Element => {
  const { modelInfo, isLoading, setModelInfo } = useLive2DConfig();
  const { micOn } = useVAD();
  const { switchCharacter } = useSwitchCharacter();

  useIpcHandlers();

  const modelConfig = useMemo(
    () => ({
      isPet,
      modelInfo,
      micOn,
    }),
    [isPet, modelInfo, micOn],
  );

  const { canvasRef, appRef, modelRef, containerRef } =
    useLive2DModel(modelConfig);

  useLive2DResize(containerRef, appRef, modelRef, modelInfo, isPet);

  useEffect(() => {
    if (!isPet) return;
    const unsubscribe = (window.api as any)?.onToggleScrollToResize(() => {
      if (modelInfo) {
        setModelInfo({
          ...modelInfo,
          scrollToResize: !modelInfo.scrollToResize,
        });
      }
    });
    return () => {
      unsubscribe?.();
    };
  }, [modelInfo, setModelInfo, isPet]);

  useEffect(() => {
    if (!isPet) return;
    const unsubscribe = (window.api as any)?.onSwitchCharacter(
      (filename: string) => {
        switchCharacter(filename);
      },
    );
    return () => unsubscribe?.();
  }, [isPet, switchCharacter]);

  // Export these hooks for global use
  useInterrupt();
  useAudioTask();

  return (
    <div
      ref={containerRef}
      style={{
        width: isPet ? "100vw" : "100%",
        height: isPet ? "100vh" : "100%",
        pointerEvents: "auto",
        overflow: "hidden",
        opacity: isLoading ? 0 : 1,
        transition: "opacity 0.3s ease-in-out",
      }}
    >
      <canvas
        id="canvas"
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          pointerEvents: "auto",
          display: "block",
        }}
      />
    </div>
  );
});

Live2D.displayName = "Live2D";

export { useInterrupt, useAudioTask };
