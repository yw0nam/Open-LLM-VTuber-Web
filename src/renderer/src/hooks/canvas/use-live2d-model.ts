import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display-lipsyncpatch";
import { ModelInfo, useLive2DConfig, MotionWeightMap, TapMotionMap } from "@/context/live2d-config-context";
import { useLive2DModel as useModelContext } from "@/context/live2d-model-context";
import { adjustModelSizeAndPosition } from "./use-live2d-resize";
import {
  MotionPreloadStrategy,
  MotionPriority,
} from "pixi-live2d-display-lipsyncpatch";
import { audioTaskQueue } from "@/utils/task-queue";

interface UseLive2DModelProps {
  isPet: boolean;
  modelInfo: ModelInfo | undefined;
  micOn: boolean;
  onModelLoad?: (model: Live2DModel) => void;
}

export const useLive2DModel = ({
  isPet,
  modelInfo,
  onModelLoad,
}: UseLive2DModelProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const modelRef = useRef<Live2DModel | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { setCurrentModel } = useModelContext();
  const { setIsLoading } = useLive2DConfig();
  const loadingRef = useRef(false);

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
  }, []);

  useEffect(() => {
    if (modelInfo?.url) {
      loadModel();
    }
    return () => {
      cleanupModel();
    };
  }, [modelInfo?.url, modelInfo?.pointerInteractive]);

  const loadModel = async () => {
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

      setupModel(model);
      onModelLoad?.(model);
    } catch (error) {
      console.error("Failed to load Live2D model:", error);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  };

  const setupModel = (model: Live2DModel) => {
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

    model.interactive = true;
    model.cursor = "pointer";

    if (isPet) {
      model.on("pointerenter", () => {
        (window.api as any)?.updateComponentHover('live2d-model', true)
      });

      model.on("pointerleave", () => {
        if (!dragging) {
          (window.api as any)?.updateComponentHover('live2d-model', false)
        }
      });

      model.on("rightdown", (e: any) => {
        e.data.originalEvent.preventDefault();
        (window.api as any).showContextMenu();
      });
    }

    let dragging = false;
    let pointerX = 0;
    let pointerY = 0;
    let isTap = false;
    const dragThreshold = 5; 

    model.on("pointerdown", (e) => {
      if (e.button === 0) {
        dragging = true;
        isTap = true;
        pointerX = e.global.x - model.x;
        pointerY = e.global.y - model.y;
      }
    });

    model.on("pointermove", (e) => {
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
      
      for (const [motion, weight] of Object.entries(motionGroup)) {
        random -= weight;
        if (random <= 0) {
          const priority = audioTaskQueue.hasTask() ? 
            MotionPriority.NORMAL : 
            MotionPriority.FORCE;
          
          console.log(
            `Playing weighted motion: ${motion} (weight: ${weight}/${totalWeight}, priority: ${priority})`
          );
          model.motion(motion, undefined, priority);
          break;
        }
      }
    };

    const getMergedMotionGroup = (tapMotions: TapMotionMap): MotionWeightMap => {
      const mergedMotions: { [key: string]: { total: number; count: number } } = {};
      
      Object.values(tapMotions).forEach(motionGroup => {
        Object.entries(motionGroup).forEach(([motion, weight]) => {
          if (!mergedMotions[motion]) {
            mergedMotions[motion] = { total: 0, count: 0 };
          }
          mergedMotions[motion].total += weight;
          mergedMotions[motion].count += 1;
        });
      });
      
      return Object.entries(mergedMotions).reduce((acc, [motion, { total, count }]) => {
        acc[motion] = total / count;
        return acc;
      }, {} as MotionWeightMap);
    };

    model.on("pointerup", (e) => {
      if (dragging) {
        dragging = false;
        if (!model.containsPoint(new PIXI.Point(e.global.x, e.global.y))) {
          // (window.api as any)?.updateComponentHover('live2d-model', false)
        }
        if (isTap) {
          const hitAreas = model.hitTest(e.global.x, e.global.y);
          
          for (const area of hitAreas) {
            const motionGroup = modelInfo?.tapMotions?.[area];
            if (motionGroup) {
              console.log(`Found motion group for area ${area}:`, motionGroup);
              playRandomMotion(motionGroup);
              return;
            }
          }

          if (modelInfo?.tapMotions && Object.keys(modelInfo.tapMotions).length > 0) {
            console.log("No specific hit area found, using merged motion groups");
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

    const { width, height } = appRef.current.screen;
    adjustModelSizeAndPosition(model, width, height, modelInfo, isPet);

    onModelLoad?.(model);
  };

  const cleanupModel = () => {
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
  };

  const cleanupApp = () => {
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
  };

  return {
    canvasRef,
    appRef,
    modelRef,
    containerRef,
  };
};
