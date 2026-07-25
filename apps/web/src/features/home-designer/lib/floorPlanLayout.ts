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

/**
 * Site elements Vastu governs that are not rooms and have no floor area:
 * water sources, the overhead tank, and the direction the plot drains.
 * Optional on the layout, since AI-generated layouts do not carry them.
 */
export type SiteFeatureKind = 'borewell' | 'overhead-tank' | 'slope'

export interface SiteFeature {
  id: string
  label: string
  kind: SiteFeatureKind
  /** Plot coordinates in feet. Site features may fall outside the built
   *  footprint — a borewell normally sits in the open ground beyond it. */
  x: number
  y: number
  zone: string
  note: string
}

export interface FloorPlanLayout {
  plotWidthFt: number
  plotHeightFt: number
  rooms: RoomRect[]
  features?: SiteFeature[]
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

  // Attached bath for the master bedroom, in the West (Varuna) cell directly
  // north of the master in the Southwest — so it adjoins the bedroom while
  // staying clear of the Southeast kitchen and the centre.
  specs.push({
    id: 'bath1',
    label: 'Bath (Attached)',
    category: 'bathroom',
    row: 'M',
    col: 'W',
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
    // West (Varuna), not North — North is Kubera's wealth zone and Vastu
    // discourages toilets there, second only to the Northeast.
    specs.push({
      id: 'bath3',
      label: 'Bath 3',
      category: 'bathroom',
      row: 'M',
      col: 'W',
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
        // Northwest (Vayavya, the zone of air and movement) is the
        // conventional Vastu placement for an exercise room. It also keeps
        // the gym out of the centre, where it would otherwise build over the
        // Brahmasthan on Vastu and traditional plans.
        specs.push({
          id: 'gym',
          label: 'Home Gym',
          category: 'extra',
          row: 'N',
          col: 'W',
          min: 70,
          typical: clamp(0.06 * areaSqft, 80, 130),
          max: Math.max(130, clamp(0.09 * areaSqft, 160, 260)),
        })
        break
      case 'staircase':
        // South, West and Southwest are the accepted Vastu zones for a
        // staircase; never the Northeast, and never over the Brahmasthan.
        specs.push({
          id: 'staircase',
          label: 'Staircase',
          category: 'extra',
          row: 'S',
          col: 'C',
          min: 45,
          typical: clamp(0.045 * areaSqft, 50, 90),
          max: 130,
        })
        break
      default:
        break
    }
  }

  return specs
}

// ---------------------------------------------------------------------------
// Vastu adjacency constraints
//
// Zone assignment alone is not enough: Vastu also governs which rooms may
// touch. The rules enforced here are the ones Indian buyers most commonly
// check for, in roughly descending order of how strongly they are held:
//
//   1. A toilet must not share a wall with the pooja room (impurity beside
//      the sacred). Strongest of the three.
//   2. A toilet must not share a wall with the kitchen (waste beside where
//      food is prepared).
//   3. A toilet must not touch the Brahmasthan, the open centre, which is
//      kept free of both construction and impurity.
//
// Enforcement happens in two stages. `separateBathrooms` moves toilets out of
// the pooja room's band entirely, because two rooms alone in a band have no
// choice but to touch. `orderRow` then permutes each band so the remaining
// pairs never end up side by side.
// ---------------------------------------------------------------------------

const isBathroom = (r: { category: RoomCategory }) => r.category === 'bathroom'
const isPooja = (r: { id: string }) => r.id === 'pooja'
const isOpenCentre = (r: { id: string }) => r.id === 'brahmasthan' || r.id === 'courtyard'
const isKitchen = (r: { category: RoomCategory }) => r.category === 'kitchen'

/** True when these two rooms must not share a wall. */
function isForbiddenPair(a: RoomSpec, b: RoomSpec): boolean {
  const bath = isBathroom(a) ? a : isBathroom(b) ? b : null
  if (!bath) return false
  const other = bath === a ? b : a
  return isPooja(other) || isKitchen(other) || isOpenCentre(other)
}

/**
 * Keeps the centre cell clear on plans that carry a Brahmasthan or aangan.
 * Any enclosed room assigned there is pushed to the West band — a general
 * guard, so adding a room at M/C later cannot silently build over the centre
 * the way the home gym did.
 */
function reserveOpenCentre(specs: RoomSpec[], style: string): RoomSpec[] {
  if (style !== 'vastu' && style !== 'traditional') return specs
  return specs.map((s) => {
    if (s.row !== 'M' || s.col !== 'C') return s
    if (s.category === 'outdoor' || isOpenCentre(s)) return s
    return { ...s, col: 'W' as ZoneCol }
  })
}

/**
 * Pulls every toilet out of the row holding the pooja room. Within a row the
 * ordering pass can usually separate a conflicting pair, but not when the row
 * holds only those two rooms — then adjacency is unavoidable, so the toilet
 * has to leave the band altogether.
 */
function separateBathrooms(specs: RoomSpec[]): RoomSpec[] {
  const pooja = specs.find(isPooja)
  if (!pooja) return specs

  return specs.map((s) => {
    if (!isBathroom(s) || s.row !== pooja.row) return s
    // Middle band first (West/Varuna is an accepted toilet zone), then South.
    const target: ZoneRow = pooja.row === 'M' ? 'S' : 'M'
    return { ...s, row: target, col: 'W' as ZoneCol }
  })
}

/**
 * Orders one band left-to-right. Starts from the ideal compass order and
 * searches for the arrangement with no forbidden neighbours that strays least
 * from it, so zones stay as close to their prescribed positions as the
 * constraints allow.
 */
function orderRow(group: AllocatedRoom[]): AllocatedRoom[] {
  const ideal = [...group].sort((a, b) => COL_ORDER.indexOf(a.col) - COL_ORDER.indexOf(b.col))
  if (ideal.length < 3) return ideal // Nothing to rearrange usefully.

  const idealIndex = new Map(ideal.map((r, i) => [r.id, i]))
  const score = (order: AllocatedRoom[]) => {
    let conflicts = 0
    for (let i = 0; i < order.length - 1; i++) {
      if (isForbiddenPair(order[i], order[i + 1])) conflicts++
    }
    let drift = 0
    order.forEach((r, i) => (drift += Math.abs(i - (idealIndex.get(r.id) ?? i))))
    return conflicts * 1000 + drift
  }

  let best = ideal
  let bestScore = score(ideal)
  if (bestScore < 1000) return ideal // Already conflict-free.

  // Bands hold a handful of rooms, so an exhaustive search is cheap. Above
  // the permutation cap, fall back to the compass order rather than hang.
  if (ideal.length > 7) return ideal

  const permute = (rest: AllocatedRoom[], acc: AllocatedRoom[]) => {
    if (!rest.length) {
      const s = score(acc)
      if (s < bestScore) {
        bestScore = s
        best = acc.slice()
      }
      return
    }
    for (let i = 0; i < rest.length; i++) {
      permute([...rest.slice(0, i), ...rest.slice(i + 1)], [...acc, rest[i]])
    }
  }
  permute(ideal, [])
  return best
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

// Minimum sensible short-side dimension per category. Stacking (see
// `layoutRooms`) locks a room's width to the full column width and derives
// its height from a share of the cell's allocated area — without a floor, a
// low-area room like a bathroom sharing a wide column with a bedroom ends up
// full-width but a foot or two tall, which is not a buildable room.
const MIN_SHORT_DIM_FT: Record<RoomCategory, number> = {
  living: 9,
  kitchen: 7,
  bedroom: 8,
  bathroom: 5,
  extra: 4,
  outdoor: 4,
}

/**
 * Heights for rooms stacked in a single column cell (full column width,
 * split along y). Each room gets at least its category's minimum short-side
 * dimension; the remaining height above that floor is distributed in
 * proportion to how much allocated area each room has beyond its floor, so
 * bigger rooms still end up taller. If the floors alone don't fit the cell,
 * they're scaled down uniformly — still tiles exactly, just tighter.
 */
function distributeStackedHeights(cellRooms: AllocatedRoom[], cellH: number): number[] {
  if (!cellRooms.length) return []

  const floors = cellRooms.map((r) => MIN_SHORT_DIM_FT[r.category])
  const floorTotal = floors.reduce((a, b) => a + b, 0)

  if (floorTotal >= cellH - 0.01) {
    const scale = floorTotal > 0 ? cellH / floorTotal : 0
    return floors.map((f) => f * scale)
  }

  const surplus = cellH - floorTotal
  const weight = cellRooms.map((r) => Math.max(0, r.alloc))
  const totalWeight = weight.reduce((a, b) => a + b, 0)
  if (totalWeight <= 0) {
    return floors.map((f) => f + surplus / cellRooms.length)
  }
  return floors.map((f, i) => f + surplus * (weight[i] / totalWeight))
}

/**
 * Places rooms on a true 3×3 Vastu grid.
 *
 * The previous approach laid each compass row out as an independent
 * full-width band, with room widths falling out of `alloc / rowHeight`. That
 * made the zone assignments essentially decorative: a band holding one room
 * stretched it across the whole plot, so the Brahmasthan could land on the
 * east edge and the master bedroom read as South-centre. Rooms only reached
 * their prescribed zone by luck.
 *
 * Here the column boundaries are shared across every row, so a cell's
 * position on the plot really is its compass zone. Row heights and column
 * widths are set from marginal demand, which reproduces each row's and each
 * column's total area exactly; the residual lands inside individual cells,
 * where it is absorbed by the rooms sharing that cell. Empty cells are merged
 * into an occupied neighbour so the grid still tiles the plot with no gaps.
 */
function layoutRooms(
  items: AllocatedRoom[],
  plotWidthFt: number,
  plotHeightFt: number,
  corridorFt: number
): RoomRect[] {
  const total = items.reduce((sum, r) => sum + r.alloc, 0)
  if (total <= 0) return []

  const demand = new Map<string, number>()
  for (const it of items) {
    const k = `${it.row}${it.col}`
    demand.set(k, (demand.get(k) ?? 0) + it.alloc)
  }
  const cellDemand = (r: ZoneRow, c: ZoneCol) => demand.get(`${r}${c}`) ?? 0
  const colDemand = (c: ZoneCol) => ROW_ORDER.reduce((s, r) => s + cellDemand(r, c), 0)

  const rowDemand = (r: ZoneRow) => COL_ORDER.reduce((s, c) => s + cellDemand(r, c), 0)
  const rowsPresent = ROW_ORDER.filter((r) => rowDemand(r) > 0)
  const colsPresent = COL_ORDER.filter((c) => colDemand(c) > 0)

  // Rigid grid: column widths and row heights are global, so every boundary
  // lines up and a cell's place on the plot really is its compass zone.
  //
  // What previously broke this was merging an empty cell sideways into its
  // neighbour (which let the master bedroom stretch across the centre) and
  // normalising rows within a column (which pushed the Middle band to the top
  // wherever a column had no North rooms). Neither happens here. An empty cell
  // becomes circulation instead — but only a corridor's worth of it, with the
  // rest handed back down its own column; see `columnHeights`.
  //
  // Demand alone produces wildly lopsided bands — a west-facing plan puts the
  // living room, master and its bath all in the West column, which then eats
  // ~78% of the width and drags its rooms' centres into the middle third, so
  // they stop reading as West at all. Clamping each band's share keeps the
  // grid close to even thirds, which is what makes the compass zones mean
  // anything; rooms absorb the difference in area.
  const balancedShares = <K extends string>(keys: K[], demandOf: (k: K) => number) => {
    if (!keys.length) return new Map<K, number>()
    const lo = 0.24
    const hi = 0.44
    const raw = keys.map((k) => demandOf(k) / total)
    const clamped =
      keys.length > 1 ? raw.map((s) => Math.min(Math.max(s, lo), hi)) : raw.map(() => 1)
    const sum = clamped.reduce((a, b) => a + b, 0)
    return new Map(keys.map((k, i) => [k, clamped[i] / sum]))
  }

  const colShare = balancedShares(colsPresent, colDemand)
  const rowShare = balancedShares(rowsPresent, rowDemand)
  const colWidth = new Map(colsPresent.map((c) => [c, plotWidthFt * colShare.get(c)!]))
  const rowHeight = new Map(rowsPresent.map((r) => [r, plotHeightFt * rowShare.get(r)!]))

  /**
   * Heights for one column's cells. An empty cell only needs to be a corridor,
   * so it is shrunk to `CORRIDOR_FT` and the surplus handed to the occupied
   * cells in that same column, weighted by demand. Redistributing down the
   * column rather than across the row is what makes this safe: a room's
   * x-extent never changes, so it cannot drift off its compass column the way
   * the earlier sideways merge did.
   *
   * Growth is capped so an occupied cell still ends inside its own horizontal
   * pada — without that, a master bedroom absorbing the band above it would
   * creep back into the middle third and stop reading as Southwest.
   */
  const columnHeights = (colKey: ZoneCol): Map<ZoneRow, number> => {
    const base = rowsPresent.map((r) => rowHeight.get(r)!)
    const occupied = rowsPresent.map((r) => cellDemand(r, colKey) > 0)
    const shrunk = base.map((b, i) => (occupied[i] ? b : Math.min(corridorFt, b)))

    let surplus = base.reduce((s, b, i) => s + (b - shrunk[i]), 0)
    const occupiedDemand = rowsPresent.reduce(
      (s, r, i) => s + (occupied[i] ? cellDemand(r, colKey) : 0),
      0
    )

    const out = shrunk.slice()
    if (surplus > 0.01 && occupiedDemand > 0) {
      const padaH = plotHeightFt / 3
      // Walk the column once, giving each occupied cell its share but never
      // more than keeps its midpoint inside the pada it started in.
      let cursor = 0
      for (let i = 0; i < rowsPresent.length; i++) {
        if (!occupied[i]) {
          cursor += out[i]
          continue
        }
        const share = surplus * (cellDemand(rowsPresent[i], colKey) / occupiedDemand)
        const padaIndex = Math.min(2, Math.floor((cursor + out[i] / 2) / padaH + 1e-6))
        const padaEnd = (padaIndex + 1) * padaH
        // Midpoint after growing by `g` is cursor + (out[i] + g) / 2.
        const maxGrow = Math.max(0, 2 * (padaEnd - cursor) - out[i])
        out[i] += Math.min(share, maxGrow)
        cursor += out[i]
      }
      // Anything the caps refused stays with the corridors, so the column
      // still spans the full height.
      const used = out.reduce((s, v) => s + v, 0)
      const slack = plotHeightFt - used
      if (Math.abs(slack) > 0.01) {
        const emptyCount = occupied.filter((o) => !o).length
        if (emptyCount > 0) {
          for (let i = 0; i < out.length; i++) if (!occupied[i]) out[i] += slack / emptyCount
        } else {
          const scale = plotHeightFt / used
          for (let i = 0; i < out.length; i++) out[i] *= scale
        }
      }
    }
    return new Map(rowsPresent.map((r, i) => [r, out[i]]))
  }

  const rooms: RoomRect[] = []
  let x = 0

  for (const colKey of colsPresent) {
    const colW = colWidth.get(colKey)!
    const heights = columnHeights(colKey)
    let y = 0

    for (const rowKey of rowsPresent) {
      const cellH = heights.get(rowKey)!
      const cellRooms = orderRow(items.filter((r) => r.row === rowKey && r.col === colKey))
      const cellAlloc = cellRooms.reduce((sum, r) => sum + r.alloc, 0)

      if (!cellRooms.length) {
        const zone = `${rowKey}${colKey}`
        rooms.push({
          id: `passage-${zone}`,
          label: 'Passage / Circulation',
          category: 'extra',
          x,
          y,
          width: colW,
          height: cellH,
          areaSqft: colW * cellH,
          zone,
          zoneLabel: COMPASS_LABEL[zone] ?? zone,
        })
        y += cellH
        continue
      }
      // Subdivide along the cell's longer side so rooms come out squarish —
      // but only when the cell sits inside a single vertical pada. A band may
      // be wider than a third of the plot, and slicing such a cell across x
      // pushes its outer rooms over the pada line: that is how a bathroom in
      // the West cell ended up measuring into the Brahmasthan. Where that
      // would happen, stack the rooms instead, which keeps every one of them
      // on the column's own compass line.
      const padaW = plotWidthFt / 3
      const spansOnePada = (start: number, extent: number, pada: number) =>
        Math.floor(start / pada + 1e-6) === Math.floor((start + extent - 1e-6) / pada)
      // Stacking is the safe default: it never moves a room off its column's
      // compass line. Slice across x only when the cell provably sits inside
      // one pada and the wider split gives better proportions.
      const splitAlongX = spansOnePada(x, colW, padaW) && colW >= cellH
      const stackedHeights = splitAlongX ? null : distributeStackedHeights(cellRooms, cellH)

      let cursor = 0
      cellRooms.forEach((room, roomIdx) => {
        const frac = cellAlloc > 0 ? room.alloc / cellAlloc : 1 / cellRooms.length
        const widthFt = splitAlongX ? colW * frac : colW
        const heightFt = splitAlongX ? cellH : stackedHeights![roomIdx]
        const rx = x + (splitAlongX ? cursor : 0)
        const ry = y + (splitAlongX ? 0 : cursor)

        // Read the zone off the final rectangle rather than the requested
        // cell, so the label always describes where the room actually sits.
        const cxFrac = plotWidthFt > 0 ? (rx + widthFt / 2) / plotWidthFt : 0.5
        const cyFrac = plotHeightFt > 0 ? (ry + heightFt / 2) / plotHeightFt : 0.5
        const col: ZoneCol = cxFrac < 1 / 3 ? 'W' : cxFrac < 2 / 3 ? 'C' : 'E'
        const row: ZoneRow = cyFrac < 1 / 3 ? 'N' : cyFrac < 2 / 3 ? 'M' : 'S'
        const zone = `${row}${col}`

        rooms.push({
          id: room.id,
          label: room.label,
          category: room.category,
          x: rx,
          y: ry,
          width: widthFt,
          height: heightFt,
          areaSqft: widthFt * heightFt,
          zone,
          zoneLabel: COMPASS_LABEL[zone] ?? zone,
        })
        cursor += splitAlongX ? widthFt : heightFt
      })
      y += cellH
    }
    x += colW
  }

  return separateVertically(rooms)
}

/**
 * Cells stacked directly above or below the pooja room share its horizontal
 * edge. If a toilet lands there, mirror the offending band so it slides to the
 * far side and the two no longer overlap.
 */
function separateVertically(rooms: RoomRect[]): RoomRect[] {
  const pooja = rooms.find(isPooja)
  if (!pooja) return rooms

  const overlaps = (a: RoomRect, b: RoomRect) =>
    a.x < b.x + b.width - 0.01 && b.x < a.x + a.width - 0.01

  const touchesVertically = (a: RoomRect, b: RoomRect) =>
    Math.abs(a.y + a.height - b.y) < 0.01 || Math.abs(b.y + b.height - a.y) < 0.01

  const offenders = rooms.filter(
    (r) => isBathroom(r) && touchesVertically(r, pooja) && overlaps(r, pooja)
  )
  if (!offenders.length) return rooms

  // Reverse the offending band in place: the row still tiles exactly, but the
  // toilet ends up at the opposite end from the pooja room.
  for (const bandY of new Set(offenders.map((r) => Math.round(r.y * 100) / 100))) {
    const band = rooms.filter((r) => Math.round(r.y * 100) / 100 === bandY)
    if (band.length < 2) continue
    const left = Math.min(...band.map((r) => r.x))
    const ordered = [...band].sort((a, b) => a.x - b.x).reverse()
    let x = left
    for (const r of ordered) {
      r.x = x
      x += r.width
    }
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

/**
 * Places the site features Vastu prescribes. North is the top of the drawing
 * and East the right, so the Northeast is (high x, low y) and the Southwest
 * (low x, high y).
 *
 * Underground water — borewell, well, sump — belongs in the Northeast, the
 * water zone. Stored water overhead belongs in the Southwest, the heaviest
 * zone, where weight is desirable. The plot should fall towards the Northeast
 * so water drains that way.
 */
function buildSiteFeatures(style: string, W: number, H: number): SiteFeature[] {
  if (style !== 'vastu' && style !== 'traditional') return []
  return [
    {
      id: 'borewell',
      label: 'Borewell / Underground Sump',
      kind: 'borewell',
      x: W + 5,
      y: -5,
      zone: 'NE',
      note: 'Underground water belongs in the Northeast (Ishanya), the water zone.',
    },
    {
      id: 'overhead-tank',
      label: 'Overhead Water Tank',
      kind: 'overhead-tank',
      x: W * 0.12,
      y: H * 0.88,
      zone: 'SW',
      note: 'Stored water sits in the Southwest (Nairutya), where added weight is desirable.',
    },
    {
      id: 'slope',
      label: 'Site Slope',
      kind: 'slope',
      x: W * 0.5,
      y: H * 0.5,
      zone: 'NE',
      note: 'Ground level should fall from the Southwest down towards the Northeast so water drains that way.',
    },
  ]
}

export function computeFloorPlanLayout(inputs: FloorPlanInputs): FloorPlanLayout {
  const specs = separateBathrooms(reserveOpenCentre(buildRoomSpecs(inputs), inputs.style))
  const aspect = STYLE_ASPECT[inputs.style] ?? 1.3
  const plotWidthFt = Math.sqrt(inputs.areaSqft * aspect)
  const plotHeightFt = inputs.areaSqft / plotWidthFt

  const allocated = allocateAreas(specs, inputs.areaSqft)

  // Narrow corridors give the plan far more usable room area — mean
  // circulation drops from ~18% to ~9% — but handing that space back shifts
  // rooms down their column, which on some plans nudges one off its zone or
  // into a forbidden neighbour. Rather than trade one against the other
  // globally, draw it both ways, audit each, and keep the tighter corridors
  // only where they cost no Vastu compliance.
  const features = buildSiteFeatures(inputs.style, plotWidthFt, plotHeightFt)
  const violations = (rooms: RoomRect[]) =>
    auditVastu({ plotWidthFt, plotHeightFt, rooms, features }, inputs).filter(
      (f) => f.severity === 'violation'
    ).length

  const tight = layoutRooms(allocated, plotWidthFt, plotHeightFt, 3.5)
  const loose = layoutRooms(allocated, plotWidthFt, plotHeightFt, Number.POSITIVE_INFINITY)
  const rooms = violations(tight) <= violations(loose) ? tight : loose

  return {
    plotWidthFt,
    plotHeightFt,
    rooms,
    features,
  }
}

// ---------------------------------------------------------------------------
// Vastu audit
//
// Runs over a finished layout rather than the specs, so it checks AI-generated
// layouts too — those come back from the model with no guarantee of
// compliance, and a plan labelled "Vastu Compliant" should be able to say
// where it does and does not hold.
// ---------------------------------------------------------------------------

export type VastuSeverity = 'violation' | 'advisory'

export interface VastuFinding {
  code: string
  severity: VastuSeverity
  message: string
}

/** Two rooms share a wall when an edge is common and the spans overlap. */
function sharesWall(a: RoomRect, b: RoomRect): boolean {
  const xOverlap = a.x < b.x + b.width - 0.01 && b.x < a.x + a.width - 0.01
  const yOverlap = a.y < b.y + b.height - 0.01 && b.y < a.y + a.height - 0.01
  const vTouch = Math.abs(a.y + a.height - b.y) < 0.02 || Math.abs(b.y + b.height - a.y) < 0.02
  const hTouch = Math.abs(a.x + a.width - b.x) < 0.02 || Math.abs(b.x + b.width - a.x) < 0.02
  return (vTouch && xOverlap) || (hTouch && yOverlap)
}

/** Zone of a room derived from its own position, so AI layouts that omit or
 *  mislabel `zone` are still audited against where the room actually sits. */
function positionZone(r: RoomRect, layout: FloorPlanLayout): string {
  const cx = (r.x + r.width / 2) / layout.plotWidthFt
  const cy = (r.y + r.height / 2) / layout.plotHeightFt
  const row: ZoneRow = cy < 1 / 3 ? 'N' : cy < 2 / 3 ? 'M' : 'S'
  const col: ZoneCol = cx < 1 / 3 ? 'W' : cx < 2 / 3 ? 'C' : 'E'
  return `${row}${col}`
}

export function auditVastu(layout: FloorPlanLayout, inputs: FloorPlanInputs): VastuFinding[] {
  const findings: VastuFinding[] = []
  const rooms = layout.rooms ?? []
  const zoneOf = (r: RoomRect) => positionZone(r, layout)

  const baths = rooms.filter(isBathroom)
  const pooja = rooms.find(isPooja)
  const kitchen = rooms.find(isKitchen)
  const master = rooms.find((r) => r.id === 'bed1')

  // --- toilet placement: the rules held most strongly ---
  for (const b of baths) {
    const z = zoneOf(b)
    if (z === 'NE')
      findings.push({
        code: 'toilet-northeast',
        severity: 'violation',
        message: `${b.label} sits in the Northeast (Ishanya) — the most sacred zone, where a toilet is the single most-cited Vastu violation.`,
      })
    else if (z === 'MC')
      findings.push({
        code: 'toilet-brahmasthan',
        severity: 'violation',
        message: `${b.label} occupies the Brahmasthan (centre), which Vastu keeps free of both construction and impurity.`,
      })
    else if (z === 'NC')
      // Only due north. The Northwest (Vayavya) is a prescribed toilet zone,
      // not a problem — it must not be swept up by a blanket "North" test.
      findings.push({
        code: 'toilet-north',
        severity: 'advisory',
        message: `${b.label} is in the due North (Kubera), the wealth zone — the Northwest, West or South is preferred for toilets.`,
      })

    if (pooja && sharesWall(b, pooja))
      findings.push({
        code: 'toilet-abuts-pooja',
        severity: 'violation',
        message: `${b.label} shares a wall with the ${pooja.label}. Vastu does not permit a toilet adjoining the prayer room.`,
      })
    if (kitchen && sharesWall(b, kitchen))
      findings.push({
        code: 'toilet-abuts-kitchen',
        severity: 'violation',
        message: `${b.label} shares a wall with the ${kitchen.label}. A toilet beside food preparation is a Vastu violation.`,
      })
  }

  // --- prescribed zones for the anchor rooms ---
  if (kitchen && zoneOf(kitchen) !== 'SE')
    findings.push({
      code: 'kitchen-not-southeast',
      severity: 'advisory',
      message: `The kitchen sits in the ${COMPASS_LABEL[zoneOf(kitchen)] ?? zoneOf(kitchen)}. Vastu places it in the Southeast (Agneya), the zone of fire.`,
    })

  if (pooja && zoneOf(pooja) !== 'NE')
    findings.push({
      code: 'pooja-not-northeast',
      severity: 'advisory',
      message: `The pooja room sits in the ${COMPASS_LABEL[zoneOf(pooja)] ?? zoneOf(pooja)}. The Northeast (Ishanya) is the prescribed zone.`,
    })

  if (master && zoneOf(master) !== 'SW')
    findings.push({
      code: 'master-not-southwest',
      severity: 'advisory',
      message: `The master bedroom sits in the ${COMPASS_LABEL[zoneOf(master)] ?? zoneOf(master)}. Vastu places it in the Southwest (Nairutya), the heaviest zone.`,
    })

  // --- the open centre must stay open ---
  const centreRooms = rooms.filter((r) => zoneOf(r) === 'MC')
  const builtCentre = centreRooms.filter((r) => r.category !== 'outdoor')
  if (inputs.style === 'vastu' && builtCentre.length)
    findings.push({
      code: 'brahmasthan-built',
      severity: 'advisory',
      message: `${builtCentre.map((r) => r.label).join(', ')} occupies the Brahmasthan. The centre is ideally left open to the sky.`,
    })

  // --- staircase ---
  const stair = rooms.find((r) => r.id === 'staircase')
  if (stair) {
    const z = zoneOf(stair)
    if (z === 'NE')
      findings.push({
        code: 'stair-northeast',
        severity: 'violation',
        message: 'The staircase is in the Northeast (Ishanya). Vastu keeps the sacred Northeast light and low — stairs belong in the South, West or Southwest.',
      })
    else if (z === 'MC')
      findings.push({
        code: 'stair-brahmasthan',
        severity: 'violation',
        message: 'The staircase crosses the Brahmasthan. The centre must stay free of heavy construction.',
      })
    else if (!['SW', 'SC', 'MW', 'SE'].includes(z))
      findings.push({
        code: 'stair-zone',
        severity: 'advisory',
        message: `The staircase sits in the ${COMPASS_LABEL[z] ?? z}. The South, West and Southwest are the prescribed zones.`,
      })
    findings.push({
      code: 'stair-ascent',
      severity: 'advisory',
      message: 'Build the flight to ascend clockwise — north to east, east to south — and use an odd number of steps.',
    })
  }

  // --- site features: water and drainage ---
  for (const f of layout.features ?? []) {
    if (f.kind === 'borewell' && f.zone !== 'NE')
      findings.push({
        code: 'water-source-zone',
        severity: 'advisory',
        message: `${f.label} should sit in the Northeast (Ishanya), the water zone.`,
      })
    if (f.kind === 'overhead-tank' && f.zone !== 'SW')
      findings.push({
        code: 'water-tank-zone',
        severity: 'advisory',
        message: `${f.label} should sit in the Southwest (Nairutya), where its weight is desirable.`,
      })
    if (f.kind === 'slope')
      findings.push({ code: 'site-slope', severity: 'advisory', message: f.note })
  }

  // --- entrance direction ---
  const facing = (inputs.facing || '').toLowerCase()
  if (facing === 'south' || facing === 'west')
    findings.push({
      code: 'entrance-direction',
      severity: 'advisory',
      message: `A ${facing}-facing entrance is not traditionally Vastu-preferred. North, East and Northeast entrances are considered auspicious.`,
    })

  return findings
}

// Sum of each required room's functional minimum (NBC/builder-standard floor)
// for this BHK + extras combination, ignoring the selected area. If the
// selected area falls below this, rooms will be compressed below realistic
// size — the UI should warn rather than silently render a degenerate plan.
export function getMinimumFeasibleAreaSqft(inputs: FloorPlanInputs): number {
  const specs = buildRoomSpecs(inputs)
  return specs.reduce((sum, s) => sum + s.min, 0)
}
