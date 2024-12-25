import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';
import { useL2D } from '@/context/l2d-context';
import { useAiState } from '@/context/ai-state-context';
import { useSubtitle } from '@/context/subtitle-context';
import { useResponse } from '@/context/response-context';
import { audioTaskQueue } from '@/utils/task-queue';
import { useWebSocket } from '@/context/websocket-context';
import { useChatHistory } from '@/context/chat-history-context';

// function setExpression(model: Live2DModel, expressionIndex: number) {
//   expressionIndex = parseInt(expressionIndex.toString());
//   if (
//     model &&
//     model.internalModel &&
//     model.internalModel.motionManager &&
//     model.internalModel.motionManager.expressionManager
//   ) {
//     model.internalModel.motionManager.expressionManager.setExpression(expressionIndex);
//     console.info(`>> [x] -> Expression set to: (${expressionIndex})`);
//   }
// }

function makeDraggable(model: Live2DModel) {
  model.interactive = true;
  // model.buttonMode = true;
  model.cursor = 'pointer';

  let isDragging = false;
  let startX = 0;
  let startY = 0;

  model.on('pointerdown', (event) => {
    isDragging = true;
    startX = event.data.global.x - model.x;
    startY = event.data.global.y - model.y;
  });

  model.on('pointermove', (event) => {
    if (isDragging) {
      model.x = event.data.global.x - startX;
      model.y = event.data.global.y - startY;
    }
  });

  model.on('pointerup', () => {
    isDragging = false;
  });

  model.on('pointerupoutside', () => {
    isDragging = false;
  });
}

let model2: Live2DModel | null = null;

export const Live2D: React.FC = () => {
  const { modelInfo } = useL2D();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const modelRef = useRef<Live2DModel | null>(null);

  // Initialize Pixi application
  useEffect(() => {
    if (!appRef.current && canvasRef.current) {
      const app = new PIXI.Application({
        view: canvasRef.current,
        autoStart: true,
        backgroundAlpha: 0,
      });
      appRef.current = app;
    }
  }, []);

  // Register ticker (only once)
  useEffect(() => {
    if (!appRef.current) return;
    Live2DModel.registerTicker(PIXI.Ticker);
  }, []);

  // Resize Pixi application based on parent container size
  const resizeApp = () => {
    if (!appRef.current || !canvasRef.current) return;
    const parent = canvasRef.current.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      appRef.current.renderer.resize(rect.width, rect.height);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      resizeApp();
      if (appRef.current && modelRef.current) {
        const app = appRef.current;
        const model2 = modelRef.current;
        const initXshift = modelInfo?.initialXshift || 0;
        const initYshift = modelInfo?.initialYshift || 0;
        model2.x = app.screen.width / 2 - model2.width / 2 + initXshift;
        model2.y = app.screen.height / 2 - model2.height / 2 + initYshift;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [modelInfo]);

  // Load model
  useEffect(() => {
    const loadModel = async () => {
      console.log("Loading model: " + modelInfo?.url);
      if (!modelInfo) return;
      if (!appRef.current || !modelInfo.url) return;

      const app = appRef.current;

      if (modelRef.current) {
        app.stage.removeChild(modelRef.current);
        modelRef.current.destroy({
          children: true,
          texture: true,
          baseTexture: true
        });
        app.stage.removeChildren();
        PIXI.utils.clearTextureCache();
        modelRef.current = null;
      }

      try {
        const options = {
          autoHitTest: modelInfo.pointerInteractive ?? false,
          autoFocus: modelInfo.pointerInteractive ?? false,
          autoUpdate: true,
        };

        const models = await Promise.all([
          Live2DModel.from(modelInfo.url, options),
        ]);

        model2 = models[0];
        modelRef.current = model2;
        app.stage.addChild(model2);
        
        const scaleX = app.screen.width * modelInfo.kScale;
        const scaleY = app.screen.height * modelInfo.kScale;
        model2.scale.set(Math.min(scaleX, scaleY));

        makeDraggable(model2);

        model2.on('added', () => {
          model2?.update(PIXI.Ticker.shared.deltaTime);
        });

        const initXshift = modelInfo.initialXshift || 0;
        const initYshift = modelInfo.initialYshift || 0;
        model2.x = app.screen.width / 2 - model2.width / 2 + initXshift;
        model2.y = app.screen.height / 2 - model2.height / 2 + initYshift;
        
      } catch (error) {
        console.error("Failed to load Live2D model:", error);
      }
      
    };


    resizeApp();
    loadModel();
  }, [modelInfo]);

  useEffect(() => {
    return () => {
      if (appRef.current) {
        appRef.current.stage.removeChildren();
        PIXI.utils.clearTextureCache();
        if (modelRef.current) {
          modelRef.current.destroy({
            children: true,
            texture: true,
            baseTexture: true
          });
        }
        appRef.current.destroy(true, {
          children: true,
          texture: true,
          baseTexture: true
        });
      }
    };
  }, []);

  return (
    <canvas 
      id="canvas" 
      ref={canvasRef} 
    />
  );
};


interface AudioTaskOptions {
  audio_base64: string;
  volumes: number[];
  slice_length: number;
  text?: string | null;
  expression_list?: string[] | null;
}

export function useInterrupt() {
  const { setAiState } = useAiState();
  const { sendMessage } = useWebSocket();
  const { fullResponse } = useResponse();
  
  const interrupt = () => {
    console.log("Interrupting conversation chain");
    sendMessage({ 
      type: "interrupt-signal", 
      text: fullResponse 
    });
    setAiState('interrupted');
    if(model2) {
      model2.stopSpeaking();
    }
    audioTaskQueue.clearQueue();
    console.log("Interrupted!");
  };

  return { interrupt };
}

export function useAudioTask() {
  const { aiState } = useAiState();
  const { setSubtitleText } = useSubtitle();
  const { appendResponse } = useResponse();
  const { appendAIMessage } = useChatHistory();

  const handleAudioPlayback = (options: AudioTaskOptions, onComplete: () => void) => {
    if (aiState === 'interrupted') {
      console.error('Audio playback blocked. State:', aiState);
      onComplete();
      return;
    }

    const { audio_base64, text, expression_list } = options;

    if (text) {
      appendResponse(text);
      appendAIMessage(text);
      setSubtitleText(text);
    }

    if (model2 == null) {
      console.error('Model not initialized');
      onComplete();
      return;
    }

    try {
      model2.speak('data:audio/wav;base64,' + audio_base64, {
        expression: expression_list?.[0] || undefined,
        resetExpression: true,
        onFinish: () => {
          console.log('Voiceline is over');
          onComplete();
        },
        onError: (error) => {
          console.error('Audio playback error:', error);
          onComplete();
        }
      });
    } catch (error) {
      console.error('Speak function error:', error);
      onComplete();
    }
  };

  const addAudioTask = async (options: AudioTaskOptions) => {
    if (aiState === 'interrupted') {
      console.log('Skipping audio task due to interrupted state');
      return;
    }

    console.log(`Adding audio task ${options.text} to queue`);
    
    audioTaskQueue.addTask(() => 
      new Promise<void>((resolve) => {
        handleAudioPlayback(options, resolve);
      }).catch(error => {
        console.log('Audio task error:', error);
      })
    );
  };

  return {
    addAudioTask,
    appendResponse
  };
} 