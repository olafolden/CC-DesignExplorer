import { useEffect, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface DesignModelProps {
  modelUrl: string
  color?: string
}

export function DesignModel({ modelUrl, color }: DesignModelProps) {
  const { scene } = useGLTF(modelUrl)
  const groupRef = useRef<THREE.Group>(null)

  // Apply color override to all meshes
  useEffect(() => {
    if (!color) return

    const threeColor = new THREE.Color(color)
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial
        if (mat.color) {
          mat.color.copy(threeColor)
          mat.needsUpdate = true
        }
      }
    })
  }, [scene, color])

  // Auto-center and scale the model
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = maxDim > 0 ? 2 / maxDim : 1

    scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
    if (groupRef.current) {
      groupRef.current.scale.setScalar(scale)
    }
  }, [scene])

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  )
}
