import React, { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch'
import { useL2D } from '@/context/l2d-context'
import { useAiState } from '@/context/ai-state-context'
import { useSubtitle } from '@/context/subtitle-context'
import { useResponse } from '@/context/response-context'
import { audioTaskQueue } from '@/utils/task-queue'
import { useWebSocket } from '@/context/websocket-context'
import { useChatHistory } from '@/context/chat-history-context'
import { useIpcHandlers } from '@/hooks/use-ipc-handlers'
import { useVAD } from '@/context/vad-context'

function adjustModelSizeAndPosition(
  model: Live2DModel,
  width: number,
  height: number,
  modelInfo: any,
  isPet: boolean = false
) {
  const initXshift = modelInfo?.initialXshift || 0
  const initYshift = modelInfo?.initialYshift || 0

  const scaleX = width * (modelInfo?.kScale || 0)
  const scaleY = height * (modelInfo?.kScale || 0)
  const newScale = Math.min(scaleX, scaleY) * (isPet ? 0.5 : 1)

  model.scale.set(newScale)
  model.x = (width - model.width) / 2 + initXshift
  model.y = (height - model.height) / 2 + initYshift
}

let model2: Live2DModel | null = null
let dragging = false

function makeDraggable(model: Live2DModel, isPet: boolean) {
  model.interactive = true;
  model.cursor = 'pointer';

  if (isPet) {
    model.on('rightdown', (e: any) => {
      e.data.originalEvent.preventDefault()
      const position = e.data.global
      ;(window.api as any).showContextMenu(position.x, position.y)
    })
  }

  let pointerX = 0;
  let pointerY = 0;

  model.on('pointerdown', (e) => {
    if (e.data.button === 0) {
      dragging = true;
      pointerX = e.data.global.x - model.x;
      pointerY = e.data.global.y - model.y;
    }
  });

  model.on('pointermove', (e) => {
    if (dragging) {
      model.position.x = e.data.global.x - pointerX;
      model.position.y = e.data.global.y - pointerY;
    }
  });

  model.on('pointerupoutside', () => dragging = false);
  model.on('pointerup', () => dragging = false);
}

export const Live2D: React.FC<{ isPet: boolean }> = ({ isPet }) => {
  const { modelInfo } = useL2D()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const modelRef = useRef<Live2DModel | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { micOn } = useVAD()

  useIpcHandlers()

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
        powerPreference: 'high-performance'
      })

      app.ticker.add(() => {
        app.renderer.clear()
        app.stage.children.forEach(child => {
          if (child instanceof Live2DModel) {
            child.update(app.ticker.deltaMS)
          }
        })
      })

      appRef.current = app
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (appRef.current && modelRef.current) {
          const { width, height } = isPet ? 
            { width: window.innerWidth, height: window.innerHeight } : 
            entry.contentRect
          
          appRef.current.renderer.resize(width, height)
          appRef.current.renderer.clear()
          adjustModelSizeAndPosition(modelRef.current, width, height, modelInfo, isPet)
        }
      }
    })

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [modelInfo, isPet])

  // Register ticker (only once)
  useEffect(() => {
    if (!appRef.current) return
    Live2DModel.registerTicker(PIXI.Ticker)
  }, [])

  // Resize Pixi application based on parent container size
  const resizeApp = () => {
    if (!appRef.current || !canvasRef.current) return
    
    const width = isPet ? window.innerWidth : canvasRef.current.parentElement?.getBoundingClientRect().width || 0
    const height = isPet ? window.innerHeight : canvasRef.current.parentElement?.getBoundingClientRect().height || 0
    
    appRef.current.renderer.resize(width, height)
    appRef.current.renderer.clear()
  }

  useEffect(() => {
    const handleResize = () => {
      if (isPet) return
      resizeApp()
      if (appRef.current && modelRef.current) {
        adjustModelSizeAndPosition(
          modelRef.current,
          appRef.current.screen.width,
          appRef.current.screen.height,
          modelInfo,
          isPet
        )
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [modelInfo, isPet])

  // Load model
  useEffect(() => {
    const loadModel = async () => {
      console.log('Loading model: ' + modelInfo?.url)
      if (!modelInfo) return
      if (!appRef.current || !modelInfo.url) return

      const app = appRef.current

      if (modelRef.current) {
        const oldModel = modelRef.current
        oldModel.removeAllListeners()
        app.stage.removeChild(oldModel)
        oldModel.destroy({
          children: true,
          texture: true,
          baseTexture: true
        })
        PIXI.utils.clearTextureCache()
        modelRef.current = null
      }

      try {
        const options = {
          autoInteract: !isPet,
          autoHitTest: true,
          autoUpdate: true
        }

        const models = await Promise.all([Live2DModel.from(modelInfo.url, options)])

        model2 = models[0]
        modelRef.current = model2
        app.stage.addChild(model2)

        model2.interactive = true;
        model2.cursor = 'pointer'

        adjustModelSizeAndPosition(model2, app.screen.width, app.screen.height, modelInfo, isPet)

        makeDraggable(model2, isPet)

        if (isPet) {
          model2.on('pointerenter', () => {
            window.api?.setIgnoreMouseEvents(false);
          });

          model2.on('pointerleave', () => {
            if (!dragging) {
              window.api?.setIgnoreMouseEvents(true);
            }
          });
        }

        model2.on('added', () => {
          model2?.update(PIXI.Ticker.shared.deltaTime)
        })

        const initXshift = modelInfo.initialXshift || 0
        const initYshift = modelInfo.initialYshift || 0
        model2.x = app.screen.width / 2 - model2.width / 2 + initXshift
        model2.y = app.screen.height / 2 - model2.height / 2 + initYshift
      } catch (error) {
        console.error('Failed to load Live2D model:', error)
      }
    }

    // resizeApp()
    loadModel()
  }, [modelInfo, isPet])

  useEffect(() => {
    return () => {
      if (appRef.current) {
        if (modelRef.current) {
          modelRef.current.removeAllListeners()
          modelRef.current.destroy({
            children: true,
            texture: true,
            baseTexture: true
          })
        }
        appRef.current.stage.removeChildren()
        PIXI.utils.clearTextureCache()
        
        appRef.current.renderer.clear()
        appRef.current.destroy(true, {
          children: true,
          texture: true,
          baseTexture: true,
        })
        
        PIXI.utils.destroyTextureCache()
        appRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!modelRef.current || !isPet) return;

    const model = modelRef.current;

    const handleModelPointerEnter = () => {
      window.api?.setIgnoreMouseEvents(false);
    };

    const handleModelPointerLeave = () => {
      if (!dragging) {
        window.api?.setIgnoreMouseEvents(true);
      }
    };

    model.on('pointerenter', handleModelPointerEnter);
    model.on('pointerleave', handleModelPointerLeave);

    if (isPet) {
      window.api?.setIgnoreMouseEvents(true);
    }

    return () => {
      model.off('pointerenter', handleModelPointerEnter);
      model.off('pointerleave', handleModelPointerLeave);
      window.api?.setIgnoreMouseEvents(false);
    };
  }, [isPet]);

  useEffect(() => {
    if (!modelRef.current || !isPet) return

    const model = modelRef.current

    const handleContextMenu = (e: any) => {
      const position = e.data.global
      e.data.originalEvent.preventDefault()
      ;(window.api as any).showContextMenu({ micOn })
    }

    model.on('rightclick', handleContextMenu)

    return () => {
      model.off('rightclick', handleContextMenu)
    }
  }, [isPet])

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: isPet ? '100vw' : '100%', 
        height: isPet ? '100vh' : '100%', 
        pointerEvents: 'auto',
        overflow: 'hidden'
      }}
    >
      <canvas
        id="canvas"
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'auto',
          display: 'block'
        }}
      />
    </div>
  )
}

interface AudioTaskOptions {
  audio_base64: string
  volumes: number[]
  slice_length: number
  text?: string | null
  expression_list?: string[] | null
}

export function useInterrupt() {
  const { setAiState } = useAiState()
  const { sendMessage } = useWebSocket()
  const { fullResponse } = useResponse()

  const interrupt = () => {
    console.log('Interrupting conversation chain')
    sendMessage({
      type: 'interrupt-signal',
      text: fullResponse
    })
    setAiState('interrupted')
    if (model2) {
      model2.stopSpeaking()
    }
    audioTaskQueue.clearQueue()
    console.log('Interrupted!')
  }

  return { interrupt }
}

export function useAudioTask() {
  const { aiState } = useAiState()
  const { setSubtitleText } = useSubtitle()
  const { appendResponse } = useResponse()
  const { appendAIMessage } = useChatHistory()

  const handleAudioPlayback = (options: AudioTaskOptions, onComplete: () => void) => {
    if (aiState === 'interrupted') {
      console.error('Audio playback blocked. State:', aiState)
      onComplete()
      return
    }

    const { audio_base64, text, expression_list } = options

    if (text) {
      appendResponse(text)
      appendAIMessage(text)
      setSubtitleText(text)
    }

    if (model2 == null) {
      console.error('Model not initialized')
      onComplete()
      return
    }

    try {
      model2.speak('data:audio/wav;base64,' + audio_base64, {
        expression: expression_list?.[0] || undefined,
        resetExpression: true,
        onFinish: () => {
          console.log('Voiceline is over')
          onComplete()
        },
        onError: (error) => {
          console.error('Audio playback error:', error)
          onComplete()
        }
      })
    } catch (error) {
      console.error('Speak function error:', error)
      onComplete()
    }
  }

  const addAudioTask = async (options: AudioTaskOptions) => {
    if (aiState === 'interrupted') {
      console.log('Skipping audio task due to interrupted state')
      return
    }

    console.log(`Adding audio task ${options.text} to queue`)

    audioTaskQueue.addTask(() =>
      new Promise<void>((resolve) => {
        handleAudioPlayback(options, resolve)
      }).catch((error) => {
        console.log('Audio task error:', error)
      })
    )
  }

  return {
    addAudioTask,
    appendResponse
  }
}
