import { useEffect } from 'react'
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch'
import * as PIXI from 'pixi.js'
import { ModelInfo } from '@/context/l2d-context'

export const useLive2DResize = (
  containerRef: React.RefObject<HTMLDivElement>,
  appRef: React.RefObject<PIXI.Application>,
  modelRef: React.RefObject<Live2DModel>,
  modelInfo: ModelInfo | undefined,
  isPet: boolean
) => {
  useEffect(() => {
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
}

export const adjustModelSizeAndPosition = (
  model: Live2DModel,
  width: number,
  height: number,
  modelInfo: ModelInfo | undefined,
  isPet: boolean = false
) => {
  const initXshift = modelInfo?.initialXshift || 0
  const initYshift = modelInfo?.initialYshift || 0

  const scaleX = width * (modelInfo?.kScale || 0)
  const scaleY = height * (modelInfo?.kScale || 0)
  const newScale = Math.min(scaleX, scaleY) * (isPet ? 0.5 : 1)

  model.scale.set(newScale)
  model.x = (width - model.width) / 2 + initXshift
  model.y = (height - model.height) / 2 + initYshift
} 