import { useEffect, useCallback, useRef } from 'react';
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';
import * as PIXI from 'pixi.js';
import { ModelInfo, useLive2DConfig } from '@/context/live2d-config-context';

const SCALE_SPEED = 0.01;
// const MIN_SCALE = 0.1;
// const MAX_SCALE = 2.0;

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
  // const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale + delta));
  const newScale = currentScale + delta;

  const lerpFactor = 0.3;
  const smoothScale = currentScale + (newScale - currentScale) * lerpFactor;

  model.scale.set(smoothScale);
  return smoothScale;
};

export const adjustModelSizeAndPosition = (
  model: Live2DModel,
  width: number,
  height: number,
  modelInfo: ModelInfo | undefined,
  isPet: boolean = false,
  shouldResetPosition: boolean = false,
) => {
  if (!model || !modelInfo) return;

  const dpr = Number(window.devicePixelRatio || 1);
  const kScale = Number(modelInfo?.kScale || 0);
  // const petScaleFactor = isPet ? 0.5 : 1;
  const newScale = kScale; //  * petScaleFactor

  console.log("newScale", newScale);
  model.scale.set(newScale);

  if (shouldResetPosition) {
    resetModelPosition(model, width, height, modelInfo);
  }

  if (model.filters) {
    model.filters.forEach((filter) => {
      if ("resolution" in filter) {
        Object.defineProperty(filter, "resolution", { value: dpr });
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
  const { updateModelScale } = useLive2DConfig();
  const scaleUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastScaleRef = useRef<number | null>(null);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!modelRef.current || !modelInfo?.scrollToResize) return;
    e.preventDefault();
    const smoothScale = handleModelScale(modelRef.current, e.deltaY);

    const hasSignificantChange = !lastScaleRef.current ||
      Math.abs(smoothScale - lastScaleRef.current) > 0.0001;

    if (hasSignificantChange) {
      if (scaleUpdateTimeout.current) {
        clearTimeout(scaleUpdateTimeout.current);
      }

      scaleUpdateTimeout.current = setTimeout(() => {
        updateModelScale(smoothScale);
        lastScaleRef.current = smoothScale;
      }, 500);
    }
  }, [modelRef, modelInfo?.scrollToResize, updateModelScale]);

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
      if (modelRef.current && appRef.current) {
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
          false,
        );
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [modelRef, modelInfo, containerRef, isPet, appRef]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (modelRef.current && appRef.current) {
        const { width, height } = isPet
          ? { width: window.innerWidth, height: window.innerHeight }
          : containerRef.current?.getBoundingClientRect() || {
            width: 0,
            height: 0,
          };

        appRef.current.renderer.resize(width, height);
        appRef.current.renderer.clear();

        resetModelPosition(modelRef.current, width, height, modelInfo);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [modelRef, containerRef, isPet, appRef]);

  useEffect(() => () => {
    if (scaleUpdateTimeout.current) {
      clearTimeout(scaleUpdateTimeout.current);
    }
  }, []);
};
