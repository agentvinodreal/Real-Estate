export interface FloorPlanInputs {
  bhk: number
  areaSqft: number
  style: string
  facing: string
  extras: string[]
  floor: string
}

export type RoomCategory = 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'extra' | 'outdoor'

// Compass rows/cols follow the standard architectural convention of drawing
// with North at the top. Room-to-zone assignments below are based on
// Vastu Shastra directional guidance commonly followed by Indian builders
// (pooja room in the northeast, kitchen in the southeast, master bedroom in
// the southwest, bathrooms in the northwest, etc.) — see room placement
// research cited in floorPlanLayout.md-equivalent PR notes.
export type ZoneRow = 'N' | 'M' | 'S'
export type ZoneCol = 'W' | 'C' | 'E'

const COMPASS_LABEL: Record<string, string> = {
  NW: 'Northwest',
  NC: 'North',
  NE: 'Northeast',
  MW: 'West',
  MC: 'Center',
  ME: 'East',
  SW: 'Southwest',
  SC: 'South',
  SE: 'Southeast',
}

export interface RoomRect {
  id: string
  label: string
  category: RoomCategory
  x: number
  y: number
  width: number
  height: number
  areaSqft: number
  zone: string
  zoneLabel: string
}

export interface FloorPlanLayout {
  plotWidthFt: number
  plotHeightFt: number
  rooms: RoomRect[]
}

interface RoomSpec {
  id: string
  label: string
  category: RoomCategory
  row: ZoneRow
  col: ZoneCol
  min: number
  typical: number
  max: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// Target room sizes (sqft) are anchored to standard Indian residential
// conventions: NBC minimum habitable room area (~102 sqft), typical builder
// master bedroom (12x14 to 14x16 ft), standard secondary bedroom (10x12 ft),
// kitchen (60-160 sqft), and bath (30-55 sqft combined WC+bath).
function buildRoomSpecs(inputs: FloorPlanInputs): RoomSpec[] {
  const { bhk, extras, style, facing, areaSqft } = inputs
  const specs: RoomSpec[] = []
  const hasCenterCourtyard = style === 'traditional' || style === 'vastu'

  // Living/dining sits adjacent to whichever wall the entrance faces so the
  // layout reads as "enter into the living area", the way real floor plans do.
  const livingRow: ZoneRow = facing === 'south' ? 'S' : 'N'
  const livingCol: ZoneCol = facing === 'east' ? 'E' : facing === 'west' ? 'W' : 'C'

  specs.push({
    id: 'living',
    label: 'Living / Dining',
    category: 'living',
    row: livingRow,
    col: livingCol,
    min: 150,
    typical: clamp(0.27 * areaSqft, 150, 600),
    max: Math.max(600, clamp(0.35 * areaSqft, 500, 1000)),
  })

  // Kitchen: Southeast (fire element) per Vastu; 60-160 sqft is standard builder range.
  specs.push({
    id: 'kitchen',
    label: 'Kitchen',
    category: 'kitchen',
    row: 'S',
    col: 'E',
    min: 55,
    typical: clamp(0.09 * areaSqft, 60, 160),
    max: 200,
  })

  // Attached bath sits adjacent to the master bedroom (Southwest zone).
  specs.push({
    id: 'bath1',
    label: 'Bath (Attached)',
    category: 'bathroom',
    row: 'S',
    col: 'C',
    min: 28,
    typical: clamp(0.035 * areaSqft, 30, 55),
    max: 70,
  })

  // Master bedroom: Southwest (earth element, heaviest room) per Vastu.
  specs.push({
    id: 'bed1',
    label: 'Master Bedroom',
    category: 'bedroom',
    row: 'S',
    col: 'W',
    min: 150,
    typical: clamp(0.17 * areaSqft, 168, 260),
    max: Math.max(260, clamp(0.22 * areaSqft, 300, 550)),
  })

  if (bhk >= 2) {
    specs.push({
      id: 'bed2',
      label: 'Bedroom 2',
      category: 'bedroom',
      row: 'M',
      col: 'W',
      min: 100,
      typical: clamp(0.12 * areaSqft, 110, 170),
      max: Math.max(170, clamp(0.15 * areaSqft, 220, 380)),
    })
    // Common bathroom: Northwest per Vastu (never Northeast).
    specs.push({
      id: 'bath2',
      label: 'Bath (Common)',
      category: 'bathroom',
      row: 'N',
      col: 'W',
      min: 28,
      typical: clamp(0.03 * areaSqft, 30, 48),
      max: 60,
    })
  }
  if (bhk >= 3) {
    specs.push({
      id: 'bed3',
      label: 'Bedroom 3',
      category: 'bedroom',
      row: 'M',
      col: hasCenterCourtyard ? 'E' : 'C',
      min: 100,
      typical: clamp(0.11 * areaSqft, 105, 160),
      max: Math.max(160, clamp(0.14 * areaSqft, 210, 360)),
    })
  }
  if (bhk >= 4) {
    specs.push({
      id: 'bed4',
      label: 'Bedroom 4',
      category: 'bedroom',
      row: 'N',
      col: 'W',
      min: 100,
      typical: clamp(0.1 * areaSqft, 100, 155),
      max: Math.max(155, clamp(0.13 * areaSqft, 200, 340)),
    })
    specs.push({
      id: 'bath3',
      label: 'Bath 3',
      category: 'bathroom',
      row: 'N',
      col: 'C',
      min: 26,
      typical: clamp(0.028 * areaSqft, 28, 45),
      max: 55,
    })
  }
  if (bhk >= 5) {
    specs.push({
      id: 'bed5',
      label: 'Bedroom 5',
      category: 'bedroom',
      row: 'M',
      col: 'E',
      min: 95,
      typical: clamp(0.09 * areaSqft, 95, 145),
      max: Math.max(145, clamp(0.12 * areaSqft, 190, 320)),
    })
  }

  // Traditional homes commonly center around an open courtyard (aangan);
  // Vastu-compliant layouts keep the Brahmasthan (center) clear of heavy
  // construction. Both map to the same Center zone, rendered as open space.
  if (style === 'traditional') {
    specs.push({
      id: 'courtyard',
      label: 'Courtyard (Aangan)',
      category: 'outdoor',
      row: 'M',
      col: 'C',
      min: 60,
      typical: clamp(0.05 * areaSqft, 60, 150),
      max: Math.max(150, clamp(0.08 * areaSqft, 200, 400)),
    })
  } else if (style === 'vastu') {
    specs.push({
      id: 'brahmasthan',
      label: 'Open Courtyard (Brahmasthan)',
      category: 'outdoor',
      row: 'M',
      col: 'C',
      min: 50,
      typical: clamp(0.04 * areaSqft, 50, 120),
      max: Math.max(120, clamp(0.07 * areaSqft, 160, 350)),
    })
  }

  for (const extra of extras) {
    switch (extra) {
      case 'pooja_room':
        // Northeast (Ishan) — most sacred zone per Vastu.
        specs.push({
          id: 'pooja',
          label: 'Pooja Room',
          category: 'extra',
          row: 'N',
          col: 'E',
          min: 16,
          typical: clamp(0.02 * areaSqft, 16, 36),
          max: 45,
        })
        break
      case 'study':
        specs.push({
          id: 'study',
          label: 'Study / Office',
          category: 'extra',
          row: 'N',
          col: 'C',
          min: 80,
          typical: clamp(0.07 * areaSqft, 90, 130),
          max: Math.max(130, clamp(0.09 * areaSqft, 160, 260)),
        })
        break
      case 'servant_quarter':
        specs.push({
          id: 'servant',
          label: 'Servant Quarter',
          category: 'extra',
          row: 'S',
          col: 'C',
          min: 55,
          typical: clamp(0.05 * areaSqft, 60, 90),
          max: Math.max(90, clamp(0.06 * areaSqft, 110, 180)),
        })
        break
      case 'store_room':
        specs.push({
          id: 'store',
          label: 'Store Room',
          category: 'extra',
          row: 'N',
          col: 'W',
          min: 28,
          typical: clamp(0.03 * areaSqft, 30, 50),
          max: 65,
        })
        break
      case 'balcony':
        specs.push({
          id: 'balcony',
          label: 'Balcony',
          category: 'outdoor',
          row: 'M',
          col: 'E',
          min: 30,
          typical: clamp(0.04 * areaSqft, 35, 70),
          max: Math.max(70, clamp(0.06 * areaSqft, 90, 180)),
        })
        break
      case 'gym':
        specs.push({
          id: 'gym',
          label: 'Home Gym',
          category: 'extra',
          row: 'M',
          col: 'C',
          min: 70,
          typical: clamp(0.06 * areaSqft, 80, 130),
          max: Math.max(130, clamp(0.09 * areaSqft, 160, 260)),
        })
        break
      default:
        break
    }
  }

  return specs
}

interface AllocatedRoom extends RoomSpec {
  alloc: number
}

// Distributes the actual plot area across rooms: bigger plots grow the
// living/dining area and master bedroom (as real Indian builder floor plans
// do), while utility rooms (kitchen, bathrooms) stay close to standard size.
// Smaller plots shrink proportionally but respect each room's functional
// minimum for as long as possible before falling back to pure proportional
// scaling. A final corrective pass guarantees the allocation always sums to
// exactly areaSqft, so the drawn plot has no gaps or overlaps.
function allocateAreas(specs: RoomSpec[], areaSqft: number): AllocatedRoom[] {
  const items: AllocatedRoom[] = specs.map((s) => ({ ...s, alloc: s.typical }))
  const typicalTotal = items.reduce((sum, r) => sum + r.typical, 0)

  if (areaSqft >= typicalTotal) {
    // Weighted water-filling: distribute surplus toward living/master/other
    // flexible rooms in proportion to priority weight, capped by each room's
    // own `max` (so no single room like the living/dining hall can balloon
    // to an unrealistic share of the plot). Kitchen, bathrooms, and pooja
    // rooms are excluded — Indian builder practice keeps those near
    // standard size regardless of overall home size.
    const weightOf = (r: AllocatedRoom): number => {
      if (r.id === 'living') return 3
      if (r.id === 'bed1') return 2
      if (r.category === 'bedroom' || r.category === 'extra' || r.category === 'outdoor') return 1
      return 0
    }

    let surplus = areaSqft - typicalTotal
    let guard = 0
    while (surplus > 0.5 && guard < 25) {
      guard++
      const flexible = items.filter((r) => weightOf(r) > 0 && r.alloc < r.max - 0.01)
      if (flexible.length === 0) break

      const totalWeight = flexible.reduce((sum, r) => sum + weightOf(r), 0)
      let distributed = 0
      for (const room of flexible) {
        const share = surplus * (weightOf(room) / totalWeight)
        const given = Math.min(share, room.max - room.alloc)
        room.alloc += given
        distributed += given
      }
      surplus -= distributed
      if (distributed < 0.01) break
    }

    if (surplus > 0.5) {
      // Every flexible room is already at its realistic maximum — the
      // remaining excess becomes additional common spaces (a genuine feature
      // of larger Indian homes), capped per space so no single overflow room
      // dominates the plot the way one giant "verandah" would.
      const living = items.find((r) => r.id === 'living')
      const overflowLabels = ['Family Lounge', 'Verandah / Sit-out', 'Covered Terrace', 'Entrance Foyer']
      const overflowCap = Math.max(400, 0.15 * areaSqft)
      let overflowIndex = 0
      // Bounded by construction: each iteration allocates at least
      // min(surplus, overflowCap) > 0, so surplus strictly decreases.
      while (surplus > 0.5) {
        const cycle = Math.floor(overflowIndex / overflowLabels.length) + 1
        const baseLabel = overflowLabels[overflowIndex % overflowLabels.length]
        const label = cycle > 1 ? `${baseLabel} ${cycle}` : baseLabel
        const alloc = Math.min(surplus, overflowCap)
        items.push({
          id: `overflow-${overflowIndex}`,
          label,
          category: 'outdoor',
          row: living?.row ?? 'N',
          col: living?.col ?? 'C',
          min: 0,
          typical: 0,
          max: alloc,
          alloc,
        })
        surplus -= alloc
        overflowIndex++
      }
    }
  } else {
    let deficit = typicalTotal - areaSqft
    let guard = 0
    while (deficit > 0.01 && guard < 10) {
      guard++
      const shrinkable = items.filter((r) => r.alloc > r.min + 0.01)
      if (shrinkable.length === 0) {
        const ratio = areaSqft / typicalTotal
        for (const room of items) room.alloc = room.typical * ratio
        deficit = 0
        break
      }
      const give = shrinkable.reduce((sum, r) => sum + (r.alloc - r.min), 0)
      if (give <= deficit) {
        for (const room of shrinkable) {
          deficit -= room.alloc - room.min
          room.alloc = room.min
        }
      } else {
        for (const room of shrinkable) {
          room.alloc -= (deficit * (room.alloc - room.min)) / give
        }
        deficit = 0
      }
    }
  }

  // Correct any residual floating-point drift so rooms tile the plot exactly.
  const currentTotal = items.reduce((sum, r) => sum + r.alloc, 0)
  if (currentTotal > 0) {
    const fix = areaSqft / currentTotal
    for (const room of items) room.alloc *= fix
  }

  return items
}

const ROW_ORDER: ZoneRow[] = ['N', 'M', 'S']
const COL_ORDER: ZoneCol[] = ['W', 'C', 'E']

function layoutRooms(items: AllocatedRoom[], plotWidthFt: number, plotHeightFt: number): RoomRect[] {
  const totalArea = plotWidthFt * plotHeightFt
  const rooms: RoomRect[] = []
  let y = 0

  for (const rowKey of ROW_ORDER) {
    const group = items.filter((r) => r.row === rowKey)
    if (group.length === 0) continue

    const rowTotal = group.reduce((sum, r) => sum + r.alloc, 0)
    const rowHeightFt = (rowTotal / totalArea) * plotHeightFt
    const sorted = [...group].sort((a, b) => COL_ORDER.indexOf(a.col) - COL_ORDER.indexOf(b.col))

    let x = 0
    for (const room of sorted) {
      const widthFt = room.alloc / rowHeightFt
      const zone = `${rowKey}${room.col}`
      rooms.push({
        id: room.id,
        label: room.label,
        category: room.category,
        x,
        y,
        width: widthFt,
        height: rowHeightFt,
        areaSqft: room.alloc,
        zone,
        zoneLabel: COMPASS_LABEL[zone] ?? zone,
      })
      x += widthFt
    }
    y += rowHeightFt
  }

  return rooms
}

const STYLE_ASPECT: Record<string, number> = {
  modern: 1.35,
  traditional: 1.1,
  vastu: 1.2,
  minimalist: 1.4,
  'open-plan': 1.45,
}

export function computeFloorPlanLayout(inputs: FloorPlanInputs): FloorPlanLayout {
  const specs = buildRoomSpecs(inputs)
  const aspect = STYLE_ASPECT[inputs.style] ?? 1.3
  const plotWidthFt = Math.sqrt(inputs.areaSqft * aspect)
  const plotHeightFt = inputs.areaSqft / plotWidthFt

  const allocated = allocateAreas(specs, inputs.areaSqft)
  const rooms = layoutRooms(allocated, plotWidthFt, plotHeightFt)

  return { plotWidthFt, plotHeightFt, rooms }
}

// Sum of each required room's functional minimum (NBC/builder-standard floor)
// for this BHK + extras combination, ignoring the selected area. If the
// selected area falls below this, rooms will be compressed below realistic
// size — the UI should warn rather than silently render a degenerate plan.
export function getMinimumFeasibleAreaSqft(inputs: FloorPlanInputs): number {
  const specs = buildRoomSpecs(inputs)
  return specs.reduce((sum, s) => sum + s.min, 0)
}
