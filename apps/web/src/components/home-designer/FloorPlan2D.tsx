import { useMemo, useRef } from 'react'
import { Download, AlertTriangle } from 'lucide-react'
import {
  computeFloorPlanLayout,
  getMinimumFeasibleAreaSqft,
  type FloorPlanInputs,
  type RoomCategory,
  type FloorPlanLayout,
} from '../../lib/floorPlanLayout'

interface FloorPlan2DProps extends FloorPlanInputs {
  customLayout?: FloorPlanLayout
}

const CATEGORY_COLOR: Record<RoomCategory, { fill: string; label: string }> = {
  living: { fill: '#0f3d3e', label: 'Living / Dining' },
  kitchen: { fill: '#319795', label: 'Kitchen' },
  bedroom: { fill: '#467475', label: 'Bedroom' },
  bathroom: { fill: '#4e5b5c', label: 'Bathroom' },
  extra: { fill: '#d5a96a', label: 'Extra Room' },
  outdoor: { fill: '#c9c2b3', label: 'Outdoor / Open' },
}

const COLOR_INK = '#122325'

const MARGIN = 56
const SCALE_PX_PER_FT = 26
const ENTRANCE_OFFSET = 16

function seededOffset(id: string, mod: number): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return hash % mod
}

export default function FloorPlan2D({ bhk, areaSqft, style, facing, floor, extras, customLayout }: FloorPlan2DProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  const layout = useMemo(
    () => customLayout || computeFloorPlanLayout({ bhk, areaSqft, style, facing, floor, extras }),
    [bhk, areaSqft, style, facing, floor, extras, customLayout]
  )

  const minimumFeasibleAreaSqft = useMemo(
    () => getMinimumFeasibleAreaSqft({ bhk, areaSqft, style, facing, floor, extras }),
    [bhk, areaSqft, style, facing, floor, extras]
  )
  const isBelowRealisticMinimum = !customLayout && areaSqft < minimumFeasibleAreaSqft

  const plotWidthPx = layout.plotWidthFt * SCALE_PX_PER_FT
  const plotHeightPx = layout.plotHeightFt * SCALE_PX_PER_FT
  const viewWidth = plotWidthPx + MARGIN * 2
  const viewHeight = plotHeightPx + MARGIN * 2 + 60

  const livingRoom = layout.rooms.find((r) => r.category === 'living') ?? layout.rooms[0]
  const livingCx = livingRoom.x + livingRoom.width / 2
  const livingCy = livingRoom.y + livingRoom.height / 2

  // Entrance sits on whichever outer wall the living room touches, matching
  // the selected entrance facing — not just a decorative rotated icon.
  const livingRx = MARGIN + livingRoom.x * SCALE_PX_PER_FT
  const livingRy = MARGIN + livingRoom.y * SCALE_PX_PER_FT
  const livingRw = livingRoom.width * SCALE_PX_PER_FT
  const livingRh = livingRoom.height * SCALE_PX_PER_FT

  let entranceX = livingRx + livingRw / 2
  let entranceY = livingRy + livingRh / 2
  let entranceArrowRotation = 0
  if (facing === 'north') {
    entranceY = MARGIN - ENTRANCE_OFFSET
    entranceArrowRotation = 0
  } else if (facing === 'south') {
    entranceY = MARGIN + plotHeightPx + ENTRANCE_OFFSET
    entranceArrowRotation = 180
  } else if (facing === 'east') {
    entranceX = MARGIN + plotWidthPx + ENTRANCE_OFFSET
    entranceArrowRotation = 90
  } else {
    entranceX = MARGIN - ENTRANCE_OFFSET
    entranceArrowRotation = -90
  }

  const handleDownload = () => {
    const svgEl = svgRef.current
    if (!svgEl) return
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svgEl)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const exportScale = 2
      canvas.width = viewWidth * exportScale
      canvas.height = viewHeight * exportScale
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#fbfaf7'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.scale(exportScale, exportScale)
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)

      canvas.toBlob((blob) => {
        if (!blob) return
        const pngUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = `carry_blueprint_${bhk}bhk_${areaSqft}sqft.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(pngUrl)
      }, 'image/png')
    }
    img.src = url
  }

  return (
    <div className="w-full h-full flex flex-col">
      {isBelowRealisticMinimum && (
        <div className="flex gap-2 border border-ochre/40 bg-ochre/5 px-3 py-2 m-2 mb-0 text-[0.68rem] text-ochre-dark">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p>
            {areaSqft} sqft is below the realistic minimum (~{Math.round(minimumFeasibleAreaSqft)} sqft) for a{' '}
            {bhk}BHK with your selected extras — rooms below are compressed under standard size. Increase area or
            remove extras for a realistic layout.
          </p>
        </div>
      )}
      <div className="flex-1 overflow-auto flex items-center justify-center p-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          width={Math.min(viewWidth, 560)}
          height={Math.min(viewHeight, 460)}
          className="max-w-full max-h-full"
        >
          <defs>
            <pattern id="blueprint-grid" width={SCALE_PX_PER_FT} height={SCALE_PX_PER_FT} patternUnits="userSpaceOnUse">
              <path d={`M ${SCALE_PX_PER_FT} 0 L 0 0 0 ${SCALE_PX_PER_FT}`} fill="none" stroke="#e9e5d9" strokeWidth={0.5} />
            </pattern>
          </defs>

          <rect x={0} y={0} width={viewWidth} height={viewHeight} fill="#fbfaf7" />

          {/* Grid background inside the plot boundary */}
          <rect
            x={MARGIN}
            y={MARGIN}
            width={plotWidthPx}
            height={plotHeightPx}
            fill="url(#blueprint-grid)"
          />

          {/* Plot boundary (outer wall) */}
          <rect
            x={MARGIN}
            y={MARGIN}
            width={plotWidthPx}
            height={plotHeightPx}
            fill="none"
            stroke={COLOR_INK}
            strokeWidth={4}
          />

          {/* Rooms */}
          {layout.rooms.map((room) => {
            const rx = MARGIN + room.x * SCALE_PX_PER_FT
            const ry = MARGIN + room.y * SCALE_PX_PER_FT
            const rw = room.width * SCALE_PX_PER_FT
            const rh = room.height * SCALE_PX_PER_FT
            const color = CATEGORY_COLOR[room.category]

            // Door swing: quarter-arc on the wall segment facing the living room,
            // skipped for the living room itself since it has no single "entry" wall.
            const isLiving = room.category === 'living'
            const dx = livingCx - (room.x + room.width / 2)
            const dy = livingCy - (room.y + room.height / 2)
            const doorOnVerticalWall = Math.abs(dx) > Math.abs(dy)
            const doorOffset = 6 + (seededOffset(room.id, 10) / 10) * Math.max(rh - 24, 8)

            let doorX = rx
            let doorY = ry + Math.min(doorOffset, rh - 10)
            let arcPath = ''
            const doorSize = Math.min(18, rw * 0.4, rh * 0.4)

            if (!isLiving) {
              if (doorOnVerticalWall) {
                doorX = dx > 0 ? rx + rw : rx
                doorY = ry + Math.min(Math.max(doorOffset, doorSize + 4), Math.max(rh - doorSize - 4, doorSize + 4))
                const sign = dx > 0 ? -1 : 1
                arcPath = `M ${doorX} ${doorY} L ${doorX + sign * doorSize} ${doorY} A ${doorSize} ${doorSize} 0 0 ${
                  sign > 0 ? 1 : 0
                } ${doorX} ${doorY + doorSize}`
              } else {
                doorY = dy > 0 ? ry + rh : ry
                doorX = rx + Math.min(Math.max(doorOffset, doorSize + 4), Math.max(rw - doorSize - 4, doorSize + 4))
                const sign = dy > 0 ? -1 : 1
                arcPath = `M ${doorX} ${doorY} L ${doorX} ${doorY + sign * doorSize} A ${doorSize} ${doorSize} 0 0 ${
                  sign > 0 ? 0 : 1
                } ${doorX + doorSize} ${doorY}`
              }
            }

            const showLabel = rw > 52 && rh > 34
            const showZone = rw > 64 && rh > 48
            const isTopExternal = Math.abs(room.y) < 0.05
            const isBottomExternal = Math.abs(room.y + room.height - layout.plotHeightFt) < 0.05
            const isLeftExternal = Math.abs(room.x) < 0.05
            const isRightExternal = Math.abs(room.x + room.width - layout.plotWidthFt) < 0.05
            
            const formatDim = (val: number) => {
              const feet = Math.floor(val)
              const inches = Math.round((val - feet) * 12)
              if (inches === 12) return `${feet + 1}'0"`
              return `${feet}'${inches}"`
            }
            const roomDimLabel = `${formatDim(room.width)} × ${formatDim(room.height)}`

            return (
              <g key={room.id}>
                <rect
                  x={rx}
                  y={ry}
                  width={rw}
                  height={rh}
                  fill={color.fill}
                  fillOpacity={0.16}
                  stroke={COLOR_INK}
                  strokeWidth={2}
                />
                {!isLiving && arcPath && (
                  <path d={arcPath} fill="none" stroke={COLOR_INK} strokeWidth={1.2} strokeDasharray="3 2" />
                )}

                {/* Windows & Ventilator Marks */}
                {isTopExternal && room.category !== 'outdoor' && (
                  <g>
                    <rect
                      x={rx + rw / 2 - (room.category === 'bathroom' ? 10 : 20)}
                      y={ry - 3}
                      width={room.category === 'bathroom' ? 20 : 40}
                      height={6}
                      fill="#ffffff"
                      stroke={COLOR_INK}
                      strokeWidth={1.5}
                    />
                    <line
                      x1={rx + rw / 2 - (room.category === 'bathroom' ? 10 : 20)}
                      y1={ry}
                      x2={rx + rw / 2 + (room.category === 'bathroom' ? 10 : 20)}
                      y2={ry}
                      stroke="#319795"
                      strokeWidth={1}
                    />
                    <text
                      x={rx + rw / 2}
                      y={ry - 6}
                      textAnchor="middle"
                      fontSize={8}
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill={COLOR_INK}
                    >
                      {room.category === 'bathroom' ? 'V' : 'W'}
                    </text>
                  </g>
                )}
                {isBottomExternal && room.category !== 'outdoor' && (
                  <g>
                    <rect
                      x={rx + rw / 2 - (room.category === 'bathroom' ? 10 : 20)}
                      y={ry + rh - 3}
                      width={room.category === 'bathroom' ? 20 : 40}
                      height={6}
                      fill="#ffffff"
                      stroke={COLOR_INK}
                      strokeWidth={1.5}
                    />
                    <line
                      x1={rx + rw / 2 - (room.category === 'bathroom' ? 10 : 20)}
                      y1={ry + rh}
                      x2={rx + rw / 2 + (room.category === 'bathroom' ? 10 : 20)}
                      y2={ry + rh}
                      stroke="#319795"
                      strokeWidth={1}
                    />
                    <text
                      x={rx + rw / 2}
                      y={ry + rh + 11}
                      textAnchor="middle"
                      fontSize={8}
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill={COLOR_INK}
                    >
                      {room.category === 'bathroom' ? 'V' : 'W'}
                    </text>
                  </g>
                )}
                {isLeftExternal && room.category !== 'outdoor' && (
                  <g>
                    <rect
                      x={rx - 3}
                      y={ry + rh / 2 - (room.category === 'bathroom' ? 10 : 20)}
                      width={6}
                      height={room.category === 'bathroom' ? 20 : 40}
                      fill="#ffffff"
                      stroke={COLOR_INK}
                      strokeWidth={1.5}
                    />
                    <line
                      x1={rx}
                      y1={ry + rh / 2 - (room.category === 'bathroom' ? 10 : 20)}
                      x2={rx}
                      y2={ry + rh / 2 + (room.category === 'bathroom' ? 10 : 20)}
                      stroke="#319795"
                      strokeWidth={1}
                    />
                    <text
                      x={rx - 7}
                      y={ry + rh / 2 + 3}
                      textAnchor="middle"
                      fontSize={8}
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill={COLOR_INK}
                    >
                      {room.category === 'bathroom' ? 'V' : 'W'}
                    </text>
                  </g>
                )}
                {isRightExternal && room.category !== 'outdoor' && (
                  <g>
                    <rect
                      x={rx + rw - 3}
                      y={ry + rh / 2 - (room.category === 'bathroom' ? 10 : 20)}
                      width={6}
                      height={room.category === 'bathroom' ? 20 : 40}
                      fill="#ffffff"
                      stroke={COLOR_INK}
                      strokeWidth={1.5}
                    />
                    <line
                      x1={rx + rw}
                      y1={ry + rh / 2 - (room.category === 'bathroom' ? 10 : 20)}
                      x2={rx + rw}
                      y2={ry + rh / 2 + (room.category === 'bathroom' ? 10 : 20)}
                      stroke="#319795"
                      strokeWidth={1}
                    />
                    <text
                      x={rx + rw + 7}
                      y={ry + rh / 2 + 3}
                      textAnchor="middle"
                      fontSize={8}
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill={COLOR_INK}
                    >
                      {room.category === 'bathroom' ? 'V' : 'W'}
                    </text>
                  </g>
                )}

                {showZone && (
                  <text
                    x={rx + rw / 2}
                    y={ry + rh / 2 - 16}
                    textAnchor="middle"
                    fontSize={7.5}
                    fontFamily="monospace"
                    fill="#8a8171"
                    letterSpacing={0.5}
                  >
                    {room.zoneLabel.toUpperCase()}
                  </text>
                )}
                {showLabel && (
                  <text
                    x={rx + rw / 2}
                    y={ry + rh / 2 - 4}
                    textAnchor="middle"
                    fontSize={10.5}
                    fontFamily="monospace"
                    fontWeight={600}
                    fill={COLOR_INK}
                  >
                    {room.label}
                  </text>
                )}
                {showLabel && (
                  <text
                    x={rx + rw / 2}
                    y={ry + rh / 2 + 10}
                    textAnchor="middle"
                    fontSize={9}
                    fontFamily="monospace"
                    fill="#4e5b5c"
                  >
                    {roomDimLabel}
                  </text>
                )}
              </g>
            )
          })}

          {/* Width dimension (top) */}
          <g fontFamily="monospace" fontSize={10} fill={COLOR_INK}>
            <line
              x1={MARGIN}
              y1={MARGIN - 14}
              x2={MARGIN + plotWidthPx}
              y2={MARGIN - 14}
              stroke={COLOR_INK}
              strokeWidth={1}
            />
            <text x={MARGIN + plotWidthPx / 2} y={MARGIN - 20} textAnchor="middle">
              {layout.plotWidthFt.toFixed(1)} ft
            </text>

            {/* Height dimension (left) */}
            <line
              x1={MARGIN - 14}
              y1={MARGIN}
              x2={MARGIN - 14}
              y2={MARGIN + plotHeightPx}
              stroke={COLOR_INK}
              strokeWidth={1}
            />
            <text
              x={MARGIN - 20}
              y={MARGIN + plotHeightPx / 2}
              textAnchor="middle"
              transform={`rotate(-90, ${MARGIN - 20}, ${MARGIN + plotHeightPx / 2})`}
            >
              {layout.plotHeightFt.toFixed(1)} ft
            </text>
          </g>

          {/* North indicator — always points up, per architectural drawing convention */}
          <g transform={`translate(${MARGIN + plotWidthPx - 20}, ${MARGIN + 24})`}>
            <path d="M 0 -14 L 7 8 L 0 3 L -7 8 Z" fill="#d5a96a" stroke={COLOR_INK} strokeWidth={1} />
            <text x={0} y={22} textAnchor="middle" fontFamily="monospace" fontSize={8} fontWeight={700} fill={COLOR_INK}>
              N
            </text>
          </g>

          {/* Main Gate Compound Wall swing doors */}
          {facing === 'north' && (
            <g>
              <rect x={entranceX - 20} y={MARGIN - 4} width={40} height={8} fill="#fbfaf7" />
              <path
                d={`M ${entranceX - 20} ${MARGIN} L ${entranceX - 20} ${MARGIN + 20} A 20 20 0 0 0 ${entranceX} ${MARGIN}`}
                fill="none"
                stroke={COLOR_INK}
                strokeWidth={1.5}
                strokeDasharray="2 1.5"
              />
              <path
                d={`M ${entranceX + 20} ${MARGIN} L ${entranceX + 20} ${MARGIN + 20} A 20 20 0 0 1 ${entranceX} ${MARGIN}`}
                fill="none"
                stroke={COLOR_INK}
                strokeWidth={1.5}
                strokeDasharray="2 1.5"
              />
              <line x1={entranceX - 20} y1={MARGIN} x2={entranceX - 20} y2={MARGIN + 20} stroke={COLOR_INK} strokeWidth={2} />
              <line x1={entranceX + 20} y1={MARGIN} x2={entranceX + 20} y2={MARGIN + 20} stroke={COLOR_INK} strokeWidth={2} />
            </g>
          )}
          {facing === 'south' && (
            <g>
              <rect x={entranceX - 20} y={MARGIN + plotHeightPx - 4} width={40} height={8} fill="#fbfaf7" />
              <path
                d={`M ${entranceX - 20} ${MARGIN + plotHeightPx} L ${entranceX - 20} ${MARGIN + plotHeightPx - 20} A 20 20 0 0 1 ${entranceX} ${MARGIN + plotHeightPx}`}
                fill="none"
                stroke={COLOR_INK}
                strokeWidth={1.5}
                strokeDasharray="2 1.5"
              />
              <path
                d={`M ${entranceX + 20} ${MARGIN + plotHeightPx} L ${entranceX + 20} ${MARGIN + plotHeightPx - 20} A 20 20 0 0 0 ${entranceX} ${MARGIN + plotHeightPx}`}
                fill="none"
                stroke={COLOR_INK}
                strokeWidth={1.5}
                strokeDasharray="2 1.5"
              />
              <line x1={entranceX - 20} y1={MARGIN + plotHeightPx} x2={entranceX - 20} y2={MARGIN + plotHeightPx - 20} stroke={COLOR_INK} strokeWidth={2} />
              <line x1={entranceX + 20} y1={MARGIN + plotHeightPx} x2={entranceX + 20} y2={MARGIN + plotHeightPx - 20} stroke={COLOR_INK} strokeWidth={2} />
            </g>
          )}
          {facing === 'east' && (
            <g>
              <rect x={MARGIN + plotWidthPx - 4} y={entranceY - 20} width={8} height={40} fill="#fbfaf7" />
              <path
                d={`M ${MARGIN + plotWidthPx} ${entranceY - 20} L ${MARGIN + plotWidthPx - 20} ${entranceY - 20} A 20 20 0 0 0 ${MARGIN + plotWidthPx} ${entranceY}`}
                fill="none"
                stroke={COLOR_INK}
                strokeWidth={1.5}
                strokeDasharray="2 1.5"
              />
              <path
                d={`M ${MARGIN + plotWidthPx} ${entranceY + 20} L ${MARGIN + plotWidthPx - 20} ${entranceY + 20} A 20 20 0 0 1 ${MARGIN + plotWidthPx} ${entranceY}`}
                fill="none"
                stroke={COLOR_INK}
                strokeWidth={1.5}
                strokeDasharray="2 1.5"
              />
              <line x1={MARGIN + plotWidthPx} y1={entranceY - 20} x2={MARGIN + plotWidthPx - 20} y2={entranceY - 20} stroke={COLOR_INK} strokeWidth={2} />
              <line x1={MARGIN + plotWidthPx} y1={entranceY + 20} x2={MARGIN + plotWidthPx - 20} y2={entranceY + 20} stroke={COLOR_INK} strokeWidth={2} />
            </g>
          )}
          {facing === 'west' && (
            <g>
              <rect x={MARGIN - 4} y={entranceY - 20} width={8} height={40} fill="#fbfaf7" />
              <path
                d={`M ${MARGIN} ${entranceY - 20} L ${MARGIN + 20} ${entranceY - 20} A 20 20 0 0 1 ${MARGIN} ${entranceY}`}
                fill="none"
                stroke={COLOR_INK}
                strokeWidth={1.5}
                strokeDasharray="2 1.5"
              />
              <path
                d={`M ${MARGIN} ${entranceY + 20} L ${MARGIN + 20} ${entranceY + 20} A 20 20 0 0 0 ${MARGIN} ${entranceY}`}
                fill="none"
                stroke={COLOR_INK}
                strokeWidth={1.5}
                strokeDasharray="2 1.5"
              />
              <line x1={MARGIN} y1={entranceY - 20} x2={MARGIN + 20} y2={entranceY - 20} stroke={COLOR_INK} strokeWidth={2} />
              <line x1={MARGIN} y1={entranceY + 20} x2={MARGIN + 20} y2={entranceY + 20} stroke={COLOR_INK} strokeWidth={2} />
            </g>
          )}

          {/* Main entrance — placed on the actual outer wall matching the selected facing */}
          <g transform={`translate(${entranceX}, ${entranceY}) rotate(${entranceArrowRotation})`}>
            <path d="M 0 0 L 6 10 L -6 10 Z" fill={COLOR_INK} />
            <text
              x={0}
              y={22}
              textAnchor="middle"
              fontFamily="monospace"
              fontSize={7.5}
              fill={COLOR_INK}
              transform={`rotate(${-entranceArrowRotation})`}
            >
              ENTRANCE
            </text>
          </g>

          {/* Scale bar */}
          <g transform={`translate(${MARGIN}, ${MARGIN + plotHeightPx + 22})`} fontFamily="monospace" fontSize={9}>
            <line x1={0} y1={0} x2={10 * SCALE_PX_PER_FT} y2={0} stroke={COLOR_INK} strokeWidth={2} />
            <line x1={0} y1={-4} x2={0} y2={4} stroke={COLOR_INK} strokeWidth={2} />
            <line x1={10 * SCALE_PX_PER_FT} y1={-4} x2={10 * SCALE_PX_PER_FT} y2={4} stroke={COLOR_INK} strokeWidth={2} />
            <text x={5 * SCALE_PX_PER_FT} y={16} textAnchor="middle" fill={COLOR_INK}>
              10 ft scale
            </text>
          </g>

          {/* Footer summary */}
          <text x={MARGIN} y={viewHeight - 20} fontFamily="monospace" fontSize={9} fill="#4e5b5c">
            {bhk}BHK · {areaSqft} sqft total · {style} · {facing} facing · {floor} floor
          </text>
          <text x={MARGIN} y={viewHeight - 8} fontFamily="monospace" fontSize={8} fill="#8a8171">
            Room sizes and zones follow standard Indian builder conventions and Vastu Shastra directional
            placement — schematic layout, not a certified structural drawing.
          </text>
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1">
        <div className="flex flex-wrap gap-3">
          {(Object.keys(CATEGORY_COLOR) as RoomCategory[])
            .filter((cat) => layout.rooms.some((r) => r.category === cat))
            .map((cat) => (
              <div key={cat} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 border border-ink/20"
                  style={{ backgroundColor: CATEGORY_COLOR[cat].fill, opacity: 0.6 }}
                />
                <span className="font-mono text-[0.6rem] uppercase tracking-wider text-concrete">
                  {CATEGORY_COLOR[cat].label}
                </span>
              </div>
            ))}
        </div>
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-1.5 border border-ink/15 hover:border-teal hover:text-teal px-3 py-1 font-mono text-[0.62rem] uppercase tracking-wider text-ink transition-colors duration-150 cursor-pointer"
        >
          <Download className="h-3 w-3" /> Download Blueprint
        </button>
      </div>
    </div>
  )
}
