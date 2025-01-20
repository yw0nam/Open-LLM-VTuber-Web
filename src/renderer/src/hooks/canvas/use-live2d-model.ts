/* eslint-disable no-param-reassign */
import { useEffect, useRef, useCallback } from "react";
import * as PIXI from "pixi.js";
import {
  Live2DModel,
  MotionPreloadStrategy,
  MotionPriority,
} from "pixi-live2d-display-lipsyncpatch";
import {
  ModelInfo,
  useLive2DConfig,
  MotionWeightMap,
  TapMotionMap,
} from "@/context/live2d-config-context";
import { useLive2DModel as useModelContext } from "@/context/live2d-model-context";
import { adjustModelSize } from "./use-live2d-resize";
import { audioTaskQueue } from "@/utils/task-queue";

interface UseLive2DModelProps {
  isPet: boolean;
  modelInfo: ModelInfo | undefined;
}

export const useLive2DModel = ({
  isPet,
  modelInfo,
}: UseLive2DModelProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const modelRef = useRef<Live2DModel | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { setCurrentModel } = useModelContext();
  const { setIsLoading } = useLive2DConfig();
  const loadingRef = useRef(false);

  const cleanupModel = useCallback(() => {
    if (modelRef.current) {
      modelRef.current.removeAllListeners();
      setCurrentModel(null);
      if (appRef.current) {
        appRef.current.stage.removeChild(modelRef.current);
        modelRef.current.destroy({
          children: true,
          texture: true,
          baseTexture: true,
        });
        PIXI.utils.clearTextureCache();
        modelRef.current = null;
      }
    }
  }, [setCurrentModel]);

  const cleanupApp = useCallback(() => {
    if (appRef.current) {
      if (modelRef.current) {
        cleanupModel();
      }
      appRef.current.stage.removeChildren();
      PIXI.utils.clearTextureCache();
      appRef.current.renderer.clear();
      appRef.current.destroy(true, {
        children: true,
        texture: true,
        baseTexture: true,
      });
      PIXI.utils.destroyTextureCache();
      appRef.current = null;
    }
  }, [cleanupModel]);

  // Initialize Pixi application
  useEffect(() => {
    if (!appRef.current && canvasRef.current) {
      const app = new PIXI.Application({
        view: canvasRef.current,
        autoStart: true,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundAlpha: 0,
        antialias: true,
        clearBeforeRender: true,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance",
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      app.ticker.add(() => {
        if (app.renderer) {
          app.renderer.render(app.stage);
        }
      });

      appRef.current = app;
    }

    return () => {
      cleanupApp();
    };
  }, [cleanupApp]);

  const setupModel = useCallback(
    async (model: Live2DModel) => {
      if (!appRef.current) return;

      if (modelRef.current) {
        modelRef.current.removeAllListeners();
        appRef.current.stage.removeChild(modelRef.current);
        modelRef.current.destroy({
          children: true,
          texture: true,
          baseTexture: true,
        });
        PIXI.utils.clearTextureCache();
      }

      modelRef.current = model;
      setCurrentModel(model);
      appRef.current.stage.addChild(model);

      console.log("modelInfo", modelInfo);

      adjustModelSize(model, modelInfo);

      model.interactive = true;
      model.cursor = "pointer";

      let dragging = false;
      let pointerX = 0;
      let pointerY = 0;
      let isTap = false;
      const dragThreshold = 5;

      if (isPet) {
        model.on('pointerenter', () => {
          (window.api as any)?.updateComponentHover('live2d-model', true);
        });

        model.on('pointerleave', () => {
          if (!dragging) {
            (window.api as any)?.updateComponentHover('live2d-model', false);
          }
        });

        model.on('rightdown', (e: any) => {
          e.data.originalEvent.preventDefault();
          (window.api as any).showContextMenu();
        });
      }

      model.on('pointerdown', (e) => {
        if (e.button === 0) {
          dragging = true;
          isTap = true;
          pointerX = e.global.x - model.x;
          pointerY = e.global.y - model.y;
        }
      });

      model.on('pointermove', (e) => {
        if (dragging) {
          const newX = e.global.x - pointerX;
          const newY = e.global.y - pointerY;
          const dx = newX - model.x;
          const dy = newY - model.y;

          if (Math.hypot(dx, dy) > dragThreshold) {
            isTap = false;
          }

          model.position.x = newX;
          model.position.y = newY;
        }
      });

      const playRandomMotion = (motionGroup: MotionWeightMap) => {
        if (!motionGroup || Object.keys(motionGroup).length === 0) return;

        const totalWeight = Object.values(motionGroup).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;

        Object.entries(motionGroup).find(([motion, weight]) => {
          // eslint-disable-next-line no-param-reassign
          random -= weight;
          if (random <= 0) {
            const priority = audioTaskQueue.hasTask()
              ? MotionPriority.NORMAL
              : MotionPriority.FORCE;

            console.log(
              `Playing weighted motion: ${motion} (weight: ${weight}/${totalWeight}, priority: ${priority})`,
            );
            model.motion(motion, undefined, priority);
            return true;
          }
          return false;
        });
      };

      const getMergedMotionGroup = (
        tapMotions: TapMotionMap,
      ): MotionWeightMap => {
        const mergedMotions: {
          [key: string]: { total: number; count: number };
        } = {};

        Object.values(tapMotions)
          .flatMap((motionGroup) => Object.entries(motionGroup))
          .reduce((acc, [motion, weight]) => {
            if (!acc[motion]) {
              acc[motion] = { total: 0, count: 0 };
            }
            acc[motion].total += weight;
            acc[motion].count += 1;
            return acc;
          }, mergedMotions);

        return Object.entries(mergedMotions).reduce(
          (acc, [motion, { total, count }]) => ({
            ...acc,
            [motion]: total / count,
          }),
          {} as MotionWeightMap,
        );
      };

      model.on("pointerup", (e) => {
        if (dragging) {
          dragging = false;
          if (!model.containsPoint(new PIXI.Point(e.global.x, e.global.y))) {
            // (window.api as any)?.updateComponentHover('live2d-model', false)
          }
          if (isTap) {
            const hitAreas = model.hitTest(e.global.x, e.global.y);

            const foundMotion = hitAreas.find((area) => {
              const motionGroup = modelInfo?.tapMotions?.[area];
              if (motionGroup) {
                console.log(
                  `Found motion group for area ${area}:`,
                  motionGroup,
                );
                playRandomMotion(motionGroup);
                return true;
              }
              return false;
            });

            if (
              !foundMotion
              && modelInfo?.tapMotions
              && Object.keys(modelInfo.tapMotions).length > 0
            ) {
              console.log(
                "No specific hit area found, using merged motion groups",
              );
              const mergedMotions = getMergedMotionGroup(modelInfo.tapMotions);
              console.log("Merged motion groups:", mergedMotions);
              playRandomMotion(mergedMotions);
            }
          }
        }
      });

      model.on("pointerupoutside", () => {
        dragging = false;
        // (window.api as any)?.updateComponentHover('live2d-model', false)
      });
    },
    [isPet, modelInfo?.url, setCurrentModel],
  );

  const loadModel = useCallback(async () => {
    if (!modelInfo?.url || !appRef.current) return;
    if (loadingRef.current) return;

    console.log("Loading model:", modelInfo.url);

    try {
      loadingRef.current = true;
      setIsLoading(true);

      const model = await Live2DModel.from(modelInfo.url, {
        autoHitTest: true,
        autoFocus: modelInfo.pointerInteractive ?? false,
        autoUpdate: true,
        ticker: PIXI.Ticker.shared,
        motionPreload: MotionPreloadStrategy.IDLE,
        idleMotionGroup: modelInfo.idleMotionGroupName,
      });

      await setupModel(model);
    } catch (error) {
      console.error("Failed to load Live2D model:", error);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [modelInfo?.url, setIsLoading, setupModel, isPet]);

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.interactive = modelInfo?.pointerInteractive ?? false;
    }
  }, [modelInfo?.pointerInteractive, loadModel]);

  useEffect(() => {
    if (modelInfo?.url) {
      loadModel();
    }
    return () => {
      cleanupModel();
    };
  }, [modelInfo?.url, loadModel, cleanupModel]);

  return {
    canvasRef,
    appRef,
    modelRef,
    containerRef,
  };
};
