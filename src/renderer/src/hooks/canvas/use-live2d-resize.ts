import { useEffect, useCallback } from "react";
import { Live2DModel } from "pixi-live2d-display-lipsyncpatch";
import * as PIXI from "pixi.js";
import { ModelInfo } from "@/context/live2d-config-context";

export const useLive2DResize = (
  containerRef: React.RefObject<HTMLDivElement>,
  appRef: React.RefObject<PIXI.Application>,
  modelRef: React.RefObject<Live2DModel>,
  modelInfo: ModelInfo | undefined,
  isPet: boolean
) => {
  const handleResize = useCallback(() => {
    if (appRef.current && modelRef.current) {
      const { width, height } = isPet
        ? { width: window.innerWidth, height: window.innerHeight }
        : containerRef.current?.getBoundingClientRect() || {
            width: 0,
            height: 0,
          };

      appRef.current.renderer.resize(width, height);
      appRef.current.renderer.clear();
      adjustModelSizeAndPosition(
        modelRef.current,
        width,
        height,
        modelInfo,
        isPet
      );
    }
  }, [modelInfo, isPet, appRef, modelRef, containerRef]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      handleResize();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
      handleResize();
    }

    return () => {
      observer.disconnect();
    };
  }, [handleResize]);

  useEffect(() => {
    if (modelRef.current) {
      handleResize();
    }
  }, [modelRef.current, handleResize]);
};

export const adjustModelSizeAndPosition = (
  model: Live2DModel,
  width: number,
  height: number,
  modelInfo: ModelInfo | undefined,
  isPet: boolean = false
) => {
  if (!model || !modelInfo) return

  const initXshift = modelInfo?.initialXshift || 0
  const initYshift = modelInfo?.initialYshift || 0

  const scaleX = width * (modelInfo?.kScale || 0)
  const scaleY = height * (modelInfo?.kScale || 0)
  const newScale = Math.min(scaleX, scaleY) * (isPet ? 0.5 : 1)

  model.scale.set(newScale)
  
  const targetX = (width - model.width) / 2 + initXshift
  const targetY = (height - model.height) / 2 + initYshift
  
  model.position.set(targetX, targetY)
}
