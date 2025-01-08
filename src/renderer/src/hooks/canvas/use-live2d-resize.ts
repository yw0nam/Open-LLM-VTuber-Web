import { useEffect, useCallback } from 'react';
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';
import * as PIXI from 'pixi.js';
import { ModelInfo } from '@/context/live2d-config-context';

export const useLive2DResize = (
  containerRef: React.RefObject<HTMLDivElement>,
  appRef: React.RefObject<PIXI.Application>,
  modelRef: React.RefObject<Live2DModel>,
  modelInfo: ModelInfo | undefined,
  isPet: boolean,
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
        isPet,
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
  isPet: boolean = false,
) => {
  if (!model || !modelInfo) return;

  const initXshift = Number(modelInfo?.initialXshift || 0);
  const initYshift = Number(modelInfo?.initialYshift || 0);

  const dpr = Number(window.devicePixelRatio || 1);
  const kScale = Number(modelInfo?.kScale || 0);
  const scaleX = width * kScale * dpr;
  const scaleY = height * kScale * dpr;

  const petScaleFactor = isPet ? 0.5 : 1;
  const qualityScaleFactor = 1.2;
  const newScale = Math.min(scaleX, scaleY) * petScaleFactor * qualityScaleFactor;

  model.scale.set(newScale);

  const targetX = (width - model.width) / 2 + initXshift;
  const targetY = (height - model.height) / 2 + initYshift;

  model.position.set(targetX, targetY);

  if (model.filters) {
    model.filters.forEach((filter) => {
      if (filter.resolution !== undefined) {
        filter.resolution = dpr;
      }
    });
  }
};
