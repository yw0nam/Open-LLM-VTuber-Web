import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch'
import { ModelInfo } from '@/context/setting/live2d-context'
import { useLive2DModel as useModelContext } from '@/context/live2d-model-context'
import { adjustModelSizeAndPosition } from './use-live2d-resize'
import { useL2D } from '@/context/setting/live2d-context'

interface UseLive2DModelProps {
  isPet: boolean
  modelInfo: ModelInfo | undefined
  micOn: boolean
  onModelLoad?: (model: Live2DModel) => void
}

export const useLive2DModel = ({ isPet, modelInfo, micOn, onModelLoad }: UseLive2DModelProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const modelRef = useRef<Live2DModel | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { setCurrentModel } = useModelContext()
  const { setIsLoading } = useL2D();
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
        powerPreference: 'high-performance'
      })

      app.ticker.add(() => {
        if (app.renderer) {
          app.renderer.render(app.stage)
        }
      })

      appRef.current = app
      
      Live2DModel.registerTicker(PIXI.Ticker)
    }

    return () => {
      cleanupApp()
    }
  }, [])

  useEffect(() => {
    if (modelInfo?.url) {
      loadModel();
    }
    return () => {
      cleanupModel();
    }
  }, [modelInfo?.url]);

  const loadModel = async () => {
    if (!modelInfo?.url || !appRef.current) return;
    if (loadingRef.current) return;

    console.log('Loading model:', modelInfo.url)
    
    if (modelRef.current?.internalModel.settings.url === modelInfo.url) {
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);

      const model = await Live2DModel.from(modelInfo.url, {
        autoHitTest: true,
        autoFocus: !isPet,
        autoUpdate: true
      });
      
      setupModel(model);
      onModelLoad?.(model);
      
    } catch (error) {
      console.error('Failed to load Live2D model:', error);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  };

  const setupModel = (model: Live2DModel) => {
    if (!appRef.current) return

    if (modelRef.current) {
      modelRef.current.removeAllListeners()
      appRef.current.stage.removeChild(modelRef.current)
      modelRef.current.destroy({
        children: true,
        texture: true,
        baseTexture: true
      })
      PIXI.utils.clearTextureCache()
    }

    modelRef.current = model
    setCurrentModel(model)  
    appRef.current.stage.addChild(model)

    model.interactive = true
    model.cursor = 'pointer'

    if (isPet) {
      model.on('pointerenter', () => {
        window.api?.setIgnoreMouseEvents(false)
      })

      model.on('pointerleave', () => {
        if (!dragging) {
          window.api?.setIgnoreMouseEvents(true)
        }
      })

      model.on('rightdown', (e: any) => {
        e.data.originalEvent.preventDefault()
        ;(window.api as any).showContextMenu({ micOn })
      })
    }

    let dragging = false
    let pointerX = 0
    let pointerY = 0

    model.on('pointerdown', (e) => {
      if (e.data.button === 0) {
        dragging = true
        pointerX = e.data.global.x - model.x
        pointerY = e.data.global.y - model.y
      }
    })

    model.on('pointermove', (e) => {
      if (dragging) {
        model.position.x = e.data.global.x - pointerX
        model.position.y = e.data.global.y - pointerY
      }
    })

    model.on('pointerupoutside', () => dragging = false)
    model.on('pointerup', () => dragging = false)

    const { width, height } = appRef.current.screen
    adjustModelSizeAndPosition(model, width, height, modelInfo, isPet)

    onModelLoad?.(model)
  }

  const cleanupModel = () => {
    if (modelRef.current) {
      modelRef.current.removeAllListeners()
      setCurrentModel(null)
      if (appRef.current) {
        appRef.current.stage.removeChild(modelRef.current)
        modelRef.current.destroy({
          children: true,
          texture: true,
          baseTexture: true
        })
        PIXI.utils.clearTextureCache()
        modelRef.current = null
      }
    }
  }

  const cleanupApp = () => {
    if (appRef.current) {
      if (modelRef.current) {
        cleanupModel()
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

  return {
    canvasRef,
    appRef,
    modelRef,
    containerRef
  }
} 