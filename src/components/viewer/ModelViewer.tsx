import { Canvas } from '@react-three/fiber'
import { Box } from 'lucide-react'
import { ModelScene } from './ModelScene'

interface ModelViewerProps {
  modelUrl: string | null
  designId: string
  color?: string
}

export function ModelViewer({ modelUrl, designId, color }: ModelViewerProps) {
  if (!modelUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground select-none">
        <Box className="h-12 w-12 mb-3 opacity-20" />
        <p className="text-xs">No 3D model available for {designId}</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [0, 1.5, 3], fov: 50 }}
        dpr={[1, 2]}
        frameloop="demand"
        gl={{ antialias: true }}
      >
        <ModelScene modelUrl={modelUrl} color={color} />
      </Canvas>
    </div>
  )
}
