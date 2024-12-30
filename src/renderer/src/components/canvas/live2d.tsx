import { memo } from 'react'
import { useL2D } from '@/context/l2d-context'
import { useVAD } from '@/context/vad-context'
import { useIpcHandlers } from '@/hooks/utils/use-ipc-handlers'
import { useLive2DModel } from '@/hooks/canvas/use-live2d-model'
import { useLive2DResize } from '@/hooks/canvas/use-live2d-resize'
import { useInterrupt } from '@/hooks/utils/use-interrupt'
import { useAudioTask } from '@/hooks/utils/use-audio-task'

// Type definitions
interface Live2DProps {
  isPet: boolean
}

// Main component
export const Live2D = memo(({ isPet }: Live2DProps): JSX.Element => {
  const { modelInfo } = useL2D()
  const { micOn } = useVAD()

  useIpcHandlers()

  const {
    canvasRef,
    appRef,
    modelRef,
    containerRef
  } = useLive2DModel({
    isPet,
    modelInfo,
    micOn
  })

  useLive2DResize(containerRef, appRef, modelRef, modelInfo, isPet)

  // Export these hooks for global use
  useInterrupt()
  useAudioTask()

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
})

Live2D.displayName = 'Live2D'

export { useInterrupt, useAudioTask }

