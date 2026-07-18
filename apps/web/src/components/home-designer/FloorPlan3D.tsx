import { useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Html, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { buildFloorPlan3D, type MatKey, type Part } from '../../lib/floorPlan3D'
import type { FloorPlanLayout } from '../../lib/floorPlanLayout'

const FT_TO_M = 0.3048

/** Materials mirror the reference model's warm paper-and-timber palette.
 *  There is no environment map in this scene, so metalness stays low —
 *  anything higher has nothing to reflect and renders near-black. */
const MATERIALS: Record<MatKey, THREE.MeshStandardMaterialParameters> = {
  wall: { color: '#f5f0e8', roughness: 0.92, metalness: 0 },
  floor: { color: '#d8c9a8', roughness: 0.85, metalness: 0 },
  wood: { color: '#b08968', roughness: 0.55, metalness: 0.05 },
  furniture: { color: '#8a6a4a', roughness: 0.7, metalness: 0 },
  fabric: { color: '#c7a97e', roughness: 0.95, metalness: 0 },
  glass: { color: '#bcd4d8', roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.34 },
  grass: { color: '#7f9a71', roughness: 0.95, metalness: 0 },
  foliage: { color: '#647f56', roughness: 0.9, metalness: 0 },
  ceramic: { color: '#eceae4', roughness: 0.35, metalness: 0.05 },
}

function Parts({
  parts,
  hovered,
  selected,
  onHover,
  onSelect,
}: {
  parts: Part[]
  hovered: string | null
  selected: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string | null) => void
}) {
  // One material instance per key (plus per-colour floor variants), shared
  // across every mesh so we are not allocating hundreds of materials.
  const materials = useMemo(() => {
    const cache = new Map<string, THREE.MeshStandardMaterial>()
    const get = (mat: MatKey, color?: string) => {
      const k = color ? `${mat}:${color}` : mat
      let m = cache.get(k)
      if (!m) {
        m = new THREE.MeshStandardMaterial({ ...MATERIALS[mat], ...(color ? { color } : {}) })
        m.name = k
        cache.set(k, m)
      }
      return m
    }
    return { get, cache }
  }, [])

  const geometries = useMemo(() => {
    const cache = new Map<string, THREE.BufferGeometry>()
    return (p: Part) => {
      const k = `${p.kind}:${p.args.join(',')}`
      let g = cache.get(k)
      if (!g) {
        g =
          p.kind === 'box'
            ? new THREE.BoxGeometry(p.args[0] * FT_TO_M, p.args[1] * FT_TO_M, p.args[2] * FT_TO_M)
            : new THREE.CylinderGeometry(
                p.args[0] * FT_TO_M,
                p.args[1] * FT_TO_M,
                p.args[2] * FT_TO_M,
                p.args[3]
              )
        cache.set(k, g)
      }
      return g
    }
  }, [parts])

  return (
    <group>
      {parts.map((p) => {
        const isPicked = p.roomId != null && p.roomId === selected
        const isHot = p.roomId != null && p.roomId === hovered
        const tint = isPicked ? '#c98f2f' : isHot ? '#e2b877' : p.color
        return (
          <mesh
            key={p.name}
            name={p.name}
            geometry={geometries(p)}
            material={materials.get(p.mat, tint)}
            position={[p.pos[0] * FT_TO_M, p.pos[1] * FT_TO_M, p.pos[2] * FT_TO_M]}
            castShadow
            receiveShadow
            onPointerOver={(e) => {
              if (!p.roomId) return
              e.stopPropagation()
              onHover(p.roomId)
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              if (!p.roomId) return
              onHover(null)
              document.body.style.cursor = 'auto'
            }}
            onClick={(e) => {
              if (!p.roomId) return
              e.stopPropagation()
              onSelect(p.roomId === selected ? null : p.roomId)
            }}
          />
        )
      })}
    </group>
  )
}

/** Labels only the picked room. Nothing is drawn otherwise — the hover tint
 *  already shows what a click would select, and ambient labels crowded the
 *  model badly once every cell had one. */
function RoomLabel({ layout, selected }: { layout: FloorPlanLayout; selected: string | null }) {
  const room = selected ? layout.rooms.find((r) => r.id === selected) : undefined
  if (!room) return null

  const x = (room.x + room.width / 2 - layout.plotWidthFt / 2) * FT_TO_M
  const z = (room.y + room.height / 2 - layout.plotHeightFt / 2) * FT_TO_M
  // Length before breadth, matching the 2D blueprint's legend.
  const dims = `${room.width.toFixed(1)} × ${room.height.toFixed(1)} ft`

  return (
    <Html
      position={[x, 1.1, z]}
      center
      distanceFactor={12}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          whiteSpace: 'nowrap',
          textAlign: 'center',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.02em',
          color: '#122325',
          background: 'rgba(255,255,255,0.97)',
          border: '1.5px solid #c98f2f',
          boxShadow: '0 2px 10px rgba(18,35,37,0.22)',
          borderRadius: 3,
          padding: '5px 9px',
        }}
      >
        <div>{room.label}</div>
        <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{dims}</div>
        <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.6, marginTop: 1 }}>
          {Math.round(room.areaSqft)} sq ft · {room.zoneLabel}
        </div>
      </div>
    </Html>
  )
}

/** Frames the camera to the plot, matching the reference's dollhouse angle. */
function Rig({ radiusM }: { radiusM: number }) {
  const { camera } = useThree()
  const done = useRef(false)
  if (!done.current) {
    done.current = true
    const dist = (radiusM / Math.tan((45 * Math.PI) / 360)) * 1.25
    const dir = new THREE.Vector3(1, 0.72, 1.25).normalize()
    camera.position.copy(dir.multiplyScalar(dist))
    camera.near = Math.max(dist / 100, 0.01)
    camera.far = dist * 100
    camera.updateProjectionMatrix()
  }
  return null
}

interface Props {
  layout: FloorPlanLayout
  facing?: string
  className?: string
}

export default function FloorPlan3D({ layout, facing, className = '' }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const model = useMemo(() => buildFloorPlan3D(layout, { facing }), [layout, facing])

  // Drop the selection when the plan itself changes underneath it.
  useEffect(() => setSelected(null), [layout])

  const radiusM =
    (Math.hypot(model.plotWidthFt, model.plotHeightFt) / 2) * FT_TO_M * 1.15

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 45, near: 0.1, far: 500 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        style={{ background: '#f2ede3' }}
        onPointerMissed={() => setSelected(null)}
      >
        <Suspense fallback={null}>
          <hemisphereLight args={['#ffffff', '#d8d2c4', 1.0]} />
          <directionalLight
            position={[4 * radiusM, 7 * radiusM, 5 * radiusM]}
            intensity={2.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0002}
            shadow-camera-left={-radiusM * 2}
            shadow-camera-right={radiusM * 2}
            shadow-camera-top={radiusM * 2}
            shadow-camera-bottom={-radiusM * 2}
          />
          <directionalLight position={[-5, 3, -4]} intensity={0.5} color="#fff4e6" />

          <Parts
            parts={model.parts}
            hovered={hovered}
            selected={selected}
            onHover={setHovered}
            onSelect={setSelected}
          />
          <RoomLabel layout={layout} selected={selected} />
          <ContactShadows position={[0, -0.02, 0]} opacity={0.3} scale={radiusM * 4} blur={2} far={4} />

          <Rig radiusM={radiusM} />
          <OrbitControls
            enableDamping
            dampingFactor={0.08}
            maxPolarAngle={Math.PI / 2.05}
            minDistance={radiusM * 0.5}
            maxDistance={radiusM * 6}
          />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute bottom-3 left-3 text-[11px] text-ink/45">
        Click a room for its size · drag to orbit · scroll to zoom · right-drag to pan
      </div>
    </div>
  )
}
