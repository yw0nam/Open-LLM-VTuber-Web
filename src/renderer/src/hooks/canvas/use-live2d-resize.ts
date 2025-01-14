import { useEffect, useCallback } from 'react';
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';
import * as PIXI from 'pixi.js';
import { ModelInfo } from '@/context/live2d-config-context';

const SCALE_SPEED = 0.01;
const MIN_SCALE = 0.1;

const resetModelPosition = (
  model: Live2DModel,
  width: number,
  height: number,
  modelInfo: ModelInfo | undefined,
) => {
  if (!model || !modelInfo) return;
  
  const initXshift = Number(modelInfo?.initialXshift || 0);
  const initYshift = Number(modelInfo?.initialYshift || 0);
  
  const targetX = (width - model.width) / 2 + initXshift;
  const targetY = (height - model.height) / 2 + initYshift;
  
  model.position.set(targetX, targetY);
};

const handleModelScale = (
  model: Live2DModel,
  deltaY: number,
) => {
  const delta = deltaY > 0 ? -SCALE_SPEED : SCALE_SPEED;
  const currentScale = model.scale.x;
  const newScale = Math.max(MIN_SCALE, currentScale + delta);
  
  const lerpFactor = 0.3;
  const smoothScale = currentScale + (newScale - currentScale) * lerpFactor;
  
  model.scale.set(smoothScale);
};

export const adjustModelSizeAndPosition = (
  model: Live2DModel,
  width: number,
  height: number,
  modelInfo: ModelInfo | undefined,
  isPet: boolean = false,
  shouldResetPosition: boolean = true,
) => {
  if (!model || !modelInfo) return;

  const dpr = Number(window.devicePixelRatio || 1);
  const kScale = Number(modelInfo?.kScale || 0);
  const scaleX = width * kScale * dpr;
  const scaleY = height * kScale * dpr;

  const petScaleFactor = isPet ? 0.5 : 1;
  const qualityScaleFactor = 1.2;
  const newScale = Math.min(scaleX, scaleY) * petScaleFactor * qualityScaleFactor;

  model.scale.set(newScale);

  if (shouldResetPosition) {
    resetModelPosition(model, width, height, modelInfo);
  }

  if (model.filters) {
    model.filters.forEach((filter) => {
      if ('resolution' in filter) {
        Object.defineProperty(filter, 'resolution', { value: dpr });
      }
    });
  }
};

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
        true,
      );
    }
  }, [modelInfo, isPet, appRef, modelRef, containerRef]);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!modelRef.current || !modelInfo?.scrollToResize) return;
    e.preventDefault();
    handleModelScale(modelRef.current, e.deltaY);
  }, [modelRef, modelInfo?.scrollToResize]);

  useEffect(() => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
    return undefined;
  }, [handleWheel, containerRef]);

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
  }, [handleResize, containerRef]);

  useEffect(() => {
    if (modelRef.current && modelInfo) {
      const { width, height } = isPet
        ? { width: window.innerWidth, height: window.innerHeight }
        : containerRef.current?.getBoundingClientRect() || {
          width: 0,
          height: 0,
        };
      
      resetModelPosition(modelRef.current, width, height, modelInfo);
    }
  }, [modelRef, modelInfo, containerRef, isPet]);
};
