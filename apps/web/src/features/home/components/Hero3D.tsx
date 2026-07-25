import { useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import type { Group } from 'three'

// Standard brand color variables
const INK = '#122325'
const BONE = '#fbfaf7'
const OCHRE = '#d5a96a' // Warm brass / Teak wood
const WATER = '#319795' // Deep turquoise pool water
const LEAF = '#2e5a44'  // Sage architectural green

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

function mapRange(val: number, inMin: number, inMax: number, outMin: number, outMax: number, ease = true) {
  const t = clamp((val - inMin) / (inMax - inMin), 0, 1)
  const factor = ease ? easeInOutCubic(t) : t
  return outMin + factor * (outMax - outMin)
}

/** 
 * Procedural Luxury Cantilever Villa Model.
 * Replicates high-end architectural features: a swimming pool with tiles, pool steps,
 * a timber deck with lounge chairs, patio umbrella, wood-paneled ceilings, floor-to-ceiling glass,
 * interior furniture silhouettes, and low-poly landscaping palm trees.
 */
function LuxuryVillaReplica() {
  const sceneGroup = useRef<Group>(null)
  
  // Animation groups
  const blueprintGroup = useRef<Group>(null)
  const frameworkGroup = useRef<Group>(null)
  const solidGroup = useRef<Group>(null)
  
  // Component references for construction animations
  const baseRef = useRef<Group>(null)
  const poolRef = useRef<Group>(null)
  const houseGroundRef = useRef<Group>(null)
  const houseCantileverRef = useRef<Group>(null)
  const roofSlabRef = useRef<Group>(null)
  const detailsRef = useRef<Group>(null)

  const pointer = useRef({ x: 0, y: 0 })

  useFrame((state) => {
    // 1. Parallax rotation linked to cursor/pointer
    pointer.current.x = state.pointer.x
    pointer.current.y = state.pointer.y
    if (sceneGroup.current) {
      sceneGroup.current.rotation.y += (pointer.current.x * 0.45 - sceneGroup.current.rotation.y) * 0.05
      sceneGroup.current.rotation.x += (-pointer.current.y * 0.15 - sceneGroup.current.rotation.x) * 0.05
    }

    // 2. Assembly timeline logic (9s cycle)
    const cycleLength = 9
    const t = state.clock.getElapsedTime() % cycleLength

    // Step 1: Blueprint outline fades in & rises
    if (blueprintGroup.current) {
      const scaleY = mapRange(t, 0, 1.2, 0.001, 1)
      const opacity = mapRange(t, 0, 0.5, 0, 0.75) * mapRange(t, 4.5, 5.2, 1, 0)
      blueprintGroup.current.scale.set(1, scaleY, 1)
      blueprintGroup.current.traverse((child: any) => {
        const meshChild = child as { material?: any }
        if (meshChild.material) {
          meshChild.material.opacity = opacity
          meshChild.material.transparent = true
        }
      })
    }

    // Step 2: Skeleton metal beams scale up
    if (frameworkGroup.current) {
      const scaleY = mapRange(t, 1.3, 2.8, 0.001, 1)
      const opacity = mapRange(t, 1.3, 1.8, 0, 1) * mapRange(t, 5.5, 6.2, 1, 0)
      frameworkGroup.current.scale.set(1, scaleY, 1)
      frameworkGroup.current.traverse((child: any) => {
        const meshChild = child as { material?: any }
        if (meshChild.material) {
          meshChild.material.opacity = opacity
          meshChild.material.transparent = true
        }
      })
    }

    // Step 3: Main structural components slide in
    
    // Main deck base slides from below
    if (baseRef.current) {
      baseRef.current.position.y = mapRange(t, 3.0, 4.0, -4, -1.05)
      baseRef.current.scale.setScalar(mapRange(t, 3.0, 4.0, 0.7, 1))
    }
    // Swimming pool descends and lights up
    if (poolRef.current) {
      poolRef.current.position.z = mapRange(t, 3.3, 4.3, 5, 0.6)
      poolRef.current.traverse((child: any) => {
        const meshChild = child as { material?: any; name?: string }
        if (meshChild.material && meshChild.name === 'pool-water') {
          meshChild.material.emissiveIntensity = mapRange(t, 4.3, 5.8, 0, 1.4)
        }
      })
    }
    // Glass living room volume slides from left
    if (houseGroundRef.current) {
      houseGroundRef.current.position.x = mapRange(t, 3.6, 4.8, -5, -0.5)
    }
    // Cantilever master suite slides from the right
    if (houseCantileverRef.current) {
      houseCantileverRef.current.position.x = mapRange(t, 4.0, 5.2, 5, 0.3)
      houseCantileverRef.current.position.z = mapRange(t, 4.0, 5.2, -3, 0.1)
    }
    // Projected roof slab drops from top
    if (roofSlabRef.current) {
      roofSlabRef.current.position.y = mapRange(t, 4.3, 5.5, 4, 1.4)
    }
    // Lounge chairs, umbrella, and palms scale up at the end
    if (detailsRef.current) {
      const scale = mapRange(t, 4.6, 5.8, 0.001, 1)
      detailsRef.current.scale.setScalar(scale)
    }

    // Step 4: Solid opacity and lights setup
    if (solidGroup.current) {
      const solidOpacity = mapRange(t, 3.0, 4.0, 0, 1) * mapRange(t, 8.0, 8.8, 1, 0)
      const scale = mapRange(t, 8.0, 8.8, 1, 0.95)
      solidGroup.current.scale.setScalar(scale)
      solidGroup.current.traverse((child: any) => {
        const meshChild = child as { material?: any; name?: string }
        if (meshChild.material) {
          if (meshChild.name !== 'window-glass' && meshChild.name !== 'pool-water') {
            meshChild.material.opacity = solidOpacity
            meshChild.material.transparent = true
          }
          if (meshChild.name === 'interior-light') {
            meshChild.material.emissiveIntensity = mapRange(t, 5.0, 6.5, 0, 2.0) * mapRange(t, 8.0, 8.8, 1, 0)
          }
        }
      })
    }
  })

  return (
    <group ref={sceneGroup} rotation={[0.08, -0.4, 0]}>
      {/* ── STAGE 1: BLUEPRINT WIREFRAME ── */}
      <group ref={blueprintGroup}>
        <gridHelper args={[7, 10, OCHRE, OCHRE]} position={[0, -1.1, 0]} />
        <mesh position={[0, -1.05, 0]}>
          <boxGeometry args={[4.8, 0.1, 3.2]} />
          <meshBasicMaterial color={OCHRE} wireframe />
        </mesh>
        <mesh position={[-0.5, -0.5, 0]}>
          <boxGeometry args={[2.4, 1.0, 2.0]} />
          <meshBasicMaterial color={OCHRE} wireframe />
        </mesh>
        <mesh position={[0.3, 0.4, 0.1]}>
          <boxGeometry args={[2.2, 0.8, 1.8]} />
          <meshBasicMaterial color={OCHRE} wireframe />
        </mesh>
      </group>

      {/* ── STAGE 2: FRAMEWORK / COLUMNS ── */}
      <group ref={frameworkGroup}>
        {/* Support columns */}
        <mesh position={[-1.6, -0.5, 0.9]}>
          <cylinderGeometry args={[0.02, 0.02, 1.0]} />
          <meshStandardMaterial color={INK} />
        </mesh>
        <mesh position={[-1.6, -0.5, -0.9]}>
          <cylinderGeometry args={[0.02, 0.02, 1.0]} />
          <meshStandardMaterial color={INK} />
        </mesh>
        <mesh position={[1.3, 0.4, 0.9]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8]} />
          <meshStandardMaterial color={INK} />
        </mesh>
      </group>

      {/* ── STAGE 3: SOLID LUXURY VILLA GEOMETRY ── */}
      <group ref={solidGroup}>
        {/* Base and Landscaping Deck */}
        <group ref={baseRef} position={[0, -1.05, 0]}>
          {/* Main foundation slab */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[4.8, 0.1, 3.2]} />
            <meshStandardMaterial color={INK} roughness={0.6} />
          </mesh>
          {/* Wooden deck boards */}
          <mesh position={[0.6, 0.06, 0.7]} castShadow receiveShadow>
            <boxGeometry args={[3.2, 0.03, 1.4]} />
            <meshStandardMaterial color={OCHRE} roughness={0.5} />
          </mesh>
        </group>

        {/* Swimming Pool Water & Steps */}
        <group ref={poolRef} position={[0.6, -0.95, 0.7]}>
          {/* Tiled floor outline helper inside pool */}
          <gridHelper args={[2.8, 6, '#133538', '#133538']} position={[0, -0.06, 0]} />
          {/* Water body */}
          <mesh name="pool-water" castShadow>
            <boxGeometry args={[2.8, 0.08, 1.1]} />
            <meshStandardMaterial 
              color={WATER} 
              transparent 
              opacity={0.65} 
              emissive={WATER}
              emissiveIntensity={1.2}
              roughness={0.01} 
              metalness={0.8}
            />
          </mesh>
        </group>

        {/* Ground Floor Villa */}
        <group ref={houseGroundRef} position={[-0.5, -0.5, 0]}>
          {/* Left concrete boundary wall */}
          <mesh position={[-1.15, 0, -0.3]} castShadow>
            <boxGeometry args={[0.15, 1.0, 1.4]} />
            <meshStandardMaterial color={BONE} roughness={0.8} />
          </mesh>
          {/* Right concrete dividing wall */}
          <mesh position={[1.15, 0, -0.3]} castShadow>
            <boxGeometry args={[0.15, 1.0, 1.4]} />
            <meshStandardMaterial color={BONE} roughness={0.8} />
          </mesh>
          {/* Louvered wood screen panel (facade detailing) */}
          <mesh position={[-0.8, 0, 0.72]} castShadow>
            <boxGeometry args={[0.4, 1.0, 0.05]} />
            <meshStandardMaterial color={OCHRE} roughness={0.45} />
          </mesh>
          {/* Glass window sheets */}
          <mesh position={[0.2, 0, 0.72]} name="window-glass">
            <boxGeometry args={[1.5, 1.0, 0.02]} />
            <meshStandardMaterial 
              color="#d9f2f7" 
              transparent 
              opacity={0.25} 
              roughness={0.02} 
              metalness={0.95} 
            />
          </mesh>
          {/* Interior Living Room Furniture (Silhouette Sofa & Table) */}
          <mesh position={[0, -0.35, 0.1]}>
            <boxGeometry args={[1.0, 0.25, 0.4]} />
            <meshStandardMaterial color={INK} roughness={0.9} />
          </mesh>
          {/* Living room ceiling glowing light box */}
          <mesh position={[0, 0.05, 0.1]} name="interior-light">
            <boxGeometry args={[1.2, 0.5, 0.8]} />
            <meshStandardMaterial 
              color={OCHRE} 
              emissive={OCHRE}
              emissiveIntensity={1.5}
              roughness={0.9} 
            />
          </mesh>
          {/* Floor 1 roof concrete slab */}
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.5, 0.08, 2.0]} />
            <meshStandardMaterial color={INK} roughness={0.5} />
          </mesh>
        </group>

        {/* First Floor Cantilevered Master Suite */}
        <group ref={houseCantileverRef} position={[0.3, 0.38, 0.1]}>
          {/* Cantilever concrete room box projecting over pool */}
          <mesh castShadow>
            <boxGeometry args={[2.2, 0.8, 1.7]} />
            <meshStandardMaterial color={BONE} roughness={0.7} />
          </mesh>
          {/* Warm Teakwood underhang ceiling (the bottom face) */}
          <mesh position={[0, -0.41, 0]} receiveShadow>
            <boxGeometry args={[2.18, 0.02, 1.68]} />
            <meshStandardMaterial color={OCHRE} roughness={0.3} />
          </mesh>
          {/* Master Bedroom glass window */}
          <mesh position={[0.2, 0, 0.86]} name="window-glass">
            <boxGeometry args={[1.4, 0.6, 0.02]} />
            <meshStandardMaterial 
              color="#d9f2f7" 
              transparent 
              opacity={0.3} 
              roughness={0.02} 
              metalness={0.95} 
            />
          </mesh>
          {/* Bedroom Furniture (Bed block) */}
          <mesh position={[0.3, -0.2, -0.1]}>
            <boxGeometry args={[0.8, 0.3, 0.8]} />
            <meshStandardMaterial color={INK} roughness={0.9} />
          </mesh>
          {/* Bedroom interior lights */}
          <mesh position={[0.2, -0.05, 0.1]} name="interior-light">
            <boxGeometry args={[1.1, 0.4, 0.8]} />
            <meshStandardMaterial 
              color={OCHRE} 
              emissive={OCHRE}
              emissiveIntensity={1.5}
              roughness={0.9} 
            />
          </mesh>
        </group>

        {/* Projected Architectural Roof */}
        <group ref={roofSlabRef} position={[0.3, 1.4, 0.1]}>
          {/* Roof slab */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.6, 0.08, 1.9]} />
            <meshStandardMaterial color={INK} roughness={0.4} />
          </mesh>
          {/* Teakwood ceiling trim */}
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[2.58, 0.02, 1.88]} />
            <meshStandardMaterial color={OCHRE} roughness={0.3} />
          </mesh>
        </group>

        {/* Handrails, Louvers & Landscaping Palms */}
        <group ref={detailsRef}>
          {/* Glass balcony railing first floor */}
          <mesh position={[0.5, 0.98, 0.95]} name="window-glass">
            <boxGeometry args={[1.8, 0.3, 0.02]} />
            <meshStandardMaterial color="#e0f8ff" transparent opacity={0.4} roughness={0.01} />
          </mesh>
          {/* Poolside lounge chairs */}
          <mesh position={[1.4, -0.92, 0.9]} rotation={[0.08, -0.4, 0]}>
            <boxGeometry args={[0.3, 0.05, 0.6]} />
            <meshStandardMaterial color={BONE} roughness={0.5} />
          </mesh>
          <mesh position={[1.8, -0.92, 0.5]} rotation={[0.08, -0.4, 0]}>
            <boxGeometry args={[0.3, 0.05, 0.6]} />
            <meshStandardMaterial color={BONE} roughness={0.5} />
          </mesh>
          {/* Patio Umbrella */}
          <group position={[2.0, -0.92, 1.2]}>
            {/* Pole */}
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 1.0]} />
              <meshStandardMaterial color={INK} />
            </mesh>
            {/* Canvas shade */}
            <mesh position={[0, 1.0, 0]} rotation={[0.1, 0, 0.1]}>
              <coneGeometry args={[0.5, 0.2, 4]} />
              <meshStandardMaterial color={BONE} roughness={0.6} />
            </mesh>
          </group>

          {/* ── LANDSCAPING TREES (PALMS) ON THE LEFT ── */}
          {/* Architectural low-poly palm tree 1 */}
          <group position={[-1.9, -1.0, 0.6]}>
            {/* Trunk */}
            <mesh position={[0, 0.7, 0]} rotation={[0.05, 0, 0.02]}>
              <cylinderGeometry args={[0.04, 0.06, 1.4]} />
              <meshStandardMaterial color={INK} roughness={0.9} />
            </mesh>
            {/* Leaves */}
            <group position={[0, 1.4, 0]}>
              <mesh rotation={[0.3, 0, 0.3]}>
                <boxGeometry args={[0.8, 0.02, 0.2]} />
                <meshStandardMaterial color={LEAF} roughness={0.7} />
              </mesh>
              <mesh rotation={[0.3, Math.PI / 3, 0.3]}>
                <boxGeometry args={[0.8, 0.02, 0.2]} />
                <meshStandardMaterial color={LEAF} roughness={0.7} />
              </mesh>
              <mesh rotation={[0.3, (Math.PI * 2) / 3, 0.3]}>
                <boxGeometry args={[0.8, 0.02, 0.2]} />
                <meshStandardMaterial color={LEAF} roughness={0.7} />
              </mesh>
            </group>
          </group>
          {/* Architectural palm tree 2 */}
          <group position={[-2.1, -1.0, -0.6]}>
            {/* Trunk */}
            <mesh position={[0, 0.55, 0]} rotation={[-0.05, 0, -0.05]}>
              <cylinderGeometry args={[0.03, 0.05, 1.1]} />
              <meshStandardMaterial color={INK} roughness={0.9} />
            </mesh>
            {/* Leaves */}
            <group position={[0, 1.1, 0]}>
              <mesh rotation={[0.3, 0, 0.3]}>
                <boxGeometry args={[0.6, 0.02, 0.15]} />
                <meshStandardMaterial color={LEAF} roughness={0.7} />
              </mesh>
              <mesh rotation={[0.3, Math.PI / 4, 0.3]}>
                <boxGeometry args={[0.6, 0.02, 0.15]} />
                <meshStandardMaterial color={LEAF} roughness={0.7} />
              </mesh>
              <mesh rotation={[0.3, -Math.PI / 4, 0.3]}>
                <boxGeometry args={[0.6, 0.02, 0.15]} />
                <meshStandardMaterial color={LEAF} roughness={0.7} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

/** Abstract stacked architectural slabs — the brand's blueprint motif rendered in 3D. */
export default function Hero3D() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.5, 6.4], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 6, 5]} intensity={1.4} castShadow />
      <directionalLight position={[-5, -2, -3]} intensity={0.4} color={OCHRE} />
      <Suspense fallback={null}>
        <Float speed={1.0} rotationIntensity={0.08} floatIntensity={0.25}>
          <LuxuryVillaReplica />
        </Float>
      </Suspense>
    </Canvas>
  )
}
