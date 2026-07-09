import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import type { Group } from 'three'

const INK = '#1c1b18'
const BONE = '#f5f1e9'
const OCHRE = '#b87333'

type Slab = {
  position: [number, number, number]
  size: [number, number, number]
  rotation: [number, number, number]
  color: string
  floatSpeed: number
}

const SLABS: Slab[] = [
  { position: [0, 0.6, 0], size: [2.6, 0.35, 1.7], rotation: [0.1, 0.5, 0.05], color: BONE, floatSpeed: 1.1 },
  { position: [0.6, -0.1, 0.4], size: [2.1, 0.35, 1.4], rotation: [-0.05, 0.35, -0.03], color: INK, floatSpeed: 1.4 },
  { position: [-0.5, -0.7, -0.3], size: [1.8, 0.35, 1.2], rotation: [0.06, 0.7, 0.04], color: OCHRE, floatSpeed: 0.9 },
  { position: [0.2, -1.3, 0.2], size: [1.4, 0.3, 1.0], rotation: [-0.08, 0.2, 0.02], color: BONE, floatSpeed: 1.2 },
]

function Slabs() {
  const group = useRef<Group>(null)
  const pointer = useRef({ x: 0, y: 0 })

  useFrame((state) => {
    pointer.current.x = state.pointer.x
    pointer.current.y = state.pointer.y
    if (!group.current) return
    group.current.rotation.y += (pointer.current.x * 0.4 - group.current.rotation.y) * 0.03
    group.current.rotation.x += (-pointer.current.y * 0.2 - group.current.rotation.x) * 0.03
  })

  return (
    <group ref={group}>
      {SLABS.map((slab, i) => (
        <Float key={i} speed={slab.floatSpeed} rotationIntensity={0.25} floatIntensity={0.6}>
          <mesh position={slab.position} rotation={slab.rotation} castShadow receiveShadow>
            <boxGeometry args={slab.size} />
            <meshStandardMaterial color={slab.color} roughness={0.55} metalness={0.08} />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

/** Abstract stacked architectural slabs — the brand's blueprint motif rendered in 3D. */
export default function Hero3D() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.5, 6], fov: 40 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <directionalLight position={[-4, -2, -3]} intensity={0.3} color={OCHRE} />
      <Slabs />
    </Canvas>
  )
}
