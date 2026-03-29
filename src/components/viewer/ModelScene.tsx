import { Suspense } from 'react'
import { OrbitControls, Environment } from '@react-three/drei'
import { DesignModel } from './DesignModel'

interface ModelSceneProps {
  modelUrl: string
  color?: string
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#6b7280" wireframe />
    </mesh>
  )
}

export function ModelScene({ modelUrl, color }: ModelSceneProps) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-3, 3, -3]} intensity={0.3} />
      <Environment preset="studio" />
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableRotate
        minDistance={0.5}
        maxDistance={20}
      />
      <Suspense fallback={<LoadingFallback />}>
        <DesignModel modelUrl={modelUrl} color={color} />
      </Suspense>
    </>
  )
}
