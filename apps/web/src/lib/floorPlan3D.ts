import type { FloorPlanLayout, RoomCategory, RoomRect } from './floorPlanLayout'

/**
 * Turns a FloorPlanLayout into a flat list of geometry parts for the 3D
 * dollhouse view: walls derived from shared room edges, door and window
 * openings punched out of those walls, and a furniture kit per room category.
 *
 * Everything here is plain data in FEET, using the same coordinate space as
 * the 2D blueprint (x right, z down, origin at the plot's top-left corner)
 * except for `y`, which is height above the floor. The renderer re-centres on
 * the origin and converts to metres — keeping this module free of three.js so
 * the layout maths stays testable on its own.
 */

export type MatKey =
  | 'wall'
  | 'floor'
  | 'wood'
  | 'furniture'
  | 'fabric'
  | 'glass'
  | 'grass'
  | 'foliage'
  | 'ceramic'

export interface Part {
  name: string
  kind: 'box' | 'cyl'
  mat: MatKey
  /** box: [w, h, d] · cyl: [radiusTop, radiusBottom, h, radialSegments] */
  args: number[]
  pos: [number, number, number]
  /** Overrides the material colour — used to tint room floors by category. */
  color?: string
  /** Set on parts belonging to a room, so the view can highlight on hover. */
  roomId?: string
}

export interface FloorPlan3D {
  parts: Part[]
  plotWidthFt: number
  plotHeightFt: number
}

// Dimensions in feet. WALL_H/DOOR_H mirror the reference model's 2.8m/2.1m.
const WALL_H = 9.2
const WALL_T = 0.5
const DOOR_H = 6.9
const DOOR_W = 3.0
const RAIL_H = 1.6
const SILL_Y = 3.0
const LINTEL_Y = 7.0
const PARAPET_H = 0.55
const SLAB_T = 0.16

/** Floor tints per category — lightened from the 2D blueprint's palette so
 *  the two views read as the same drawing. */
const FLOOR_TINT: Record<RoomCategory, string> = {
  living: '#cfd8d2',
  kitchen: '#cddedb',
  bedroom: '#d6ddd8',
  bathroom: '#ccd3d4',
  extra: '#e6d6bb',
  outdoor: '#c6cbbd',
}

/** The Vastu Brahmasthan and the traditional aangan both render as open,
 *  unbuilt space rather than a furnished outdoor room. */
const isOpenCentre = (r: RoomRect) => r.id === 'brahmasthan' || r.id === 'courtyard'

type Interval = [number, number]

const key = (v: number) => Math.round(v * 100) / 100
const isNear = (a: number, b: number) => Math.abs(a - b) < 0.06

function mergeIntervals(list: Interval[]): Interval[] {
  if (!list.length) return []
  const sorted = list.slice().sort((a, b) => a[0] - b[0])
  const out: Interval[] = [sorted[0].slice() as Interval]
  for (const [s, e] of sorted.slice(1)) {
    const last = out[out.length - 1]
    if (s <= last[1] + 0.02) last[1] = Math.max(last[1], e)
    else out.push([s, e])
  }
  return out
}

/** Removes gap ranges from a segment, returning the solid pieces that remain. */
function subtractGaps(seg: Interval, gaps: Interval[]): Interval[] {
  let pieces: Interval[] = [seg]
  for (const [gs, ge] of gaps) {
    const next: Interval[] = []
    for (const [s, e] of pieces) {
      if (ge <= s || gs >= e) {
        next.push([s, e])
        continue
      }
      if (gs > s) next.push([s, gs])
      if (ge < e) next.push([ge, e])
    }
    pieces = next
  }
  return pieces.filter(([s, e]) => e - s > 0.08)
}

export function buildFloorPlan3D(
  layout: FloorPlanLayout,
  opts: { facing?: string } = {}
): FloorPlan3D {
  const { plotWidthFt: W, plotHeightFt: H, rooms } = layout
  const parts: Part[] = []
  let uid = 0

  const box = (
    name: string,
    mat: MatKey,
    w: number,
    h: number,
    d: number,
    cx: number,
    cy: number,
    cz: number,
    extra: { color?: string; roomId?: string } = {}
  ) => {
    parts.push({ name: `${name}_${uid++}`, kind: 'box', mat, args: [w, h, d], pos: [cx, cy, cz], ...extra })
  }

  const cyl = (
    name: string,
    mat: MatKey,
    rTop: number,
    rBot: number,
    h: number,
    cx: number,
    cy: number,
    cz: number,
    seg = 16,
    extra: { roomId?: string } = {}
  ) => {
    parts.push({ name: `${name}_${uid++}`, kind: 'cyl', mat, args: [rTop, rBot, h, seg], pos: [cx, cy, cz], ...extra })
  }

  const indoor = rooms.filter((r) => r.category !== 'outdoor')
  const outdoor = rooms.filter((r) => r.category === 'outdoor')

  // ---- ground + floor slabs ----
  box('lawn', 'grass', W + 26, 0.1, H + 26, W / 2, -0.14, H / 2)
  for (const r of rooms) {
    // The open centre sits a step lower, the way a real aangan does.
    const drop = isOpenCentre(r) ? 0.35 : 0
    box(
      `floor_${r.id}`,
      'floor',
      r.width,
      SLAB_T,
      r.height,
      r.x + r.width / 2,
      -SLAB_T / 2 - drop,
      r.y + r.height / 2,
      { color: isOpenCentre(r) ? '#bfc4b4' : FLOOR_TINT[r.category], roomId: r.id }
    )
  }

  // ---- collect wall lines from indoor room edges ----
  // Rooms tile the plot, so a wall between two rooms is contributed twice;
  // merging intervals per line collapses those into one run and prevents
  // coplanar duplicate faces from z-fighting.
  const hLines = new Map<number, Interval[]>()
  const vLines = new Map<number, Interval[]>()
  const push = (m: Map<number, Interval[]>, at: number, iv: Interval) => {
    const k = key(at)
    const arr = m.get(k)
    if (arr) arr.push(iv)
    else m.set(k, [iv])
  }

  for (const r of indoor) {
    push(hLines, r.y, [r.x, r.x + r.width])
    push(hLines, r.y + r.height, [r.x, r.x + r.width])
    push(vLines, r.x, [r.y, r.y + r.height])
    push(vLines, r.x + r.width, [r.y, r.y + r.height])
  }

  // ---- openings ----
  type Gap = { fixed: number; range: Interval }
  const hGaps: Gap[] = []
  const vGaps: Gap[] = []
  const doors: { axis: 'h' | 'v'; fixed: number; range: Interval }[] = []

  const isExteriorH = (y: number) => isNear(y, 0) || isNear(y, H)
  const isExteriorV = (x: number) => isNear(x, 0) || isNear(x, W)

  /** True when this line already has an opening overlapping the range —
   *  stops two adjacent rooms punching two doors through one shared wall. */
  const occupied = (list: Gap[], fixed: number, range: Interval) =>
    list.some((g) => isNear(g.fixed, fixed) && g.range[0] < range[1] && range[0] < g.range[1])

  const addDoor = (axis: 'h' | 'v', fixed: number, centre: number, span: Interval) => {
    const w = Math.min(DOOR_W, (span[1] - span[0]) * 0.55)
    if (w < 1.8) return false
    const c = Math.min(Math.max(centre, span[0] + w / 2 + 0.3), span[1] - w / 2 - 0.3)
    const range: Interval = [c - w / 2, c + w / 2]
    const list = axis === 'h' ? hGaps : vGaps
    if (occupied(list, fixed, range)) return false
    list.push({ fixed, range })
    doors.push({ axis, fixed, range })
    return true
  }

  // One interior door per room, on its longest interior edge.
  for (const r of indoor) {
    const edges: { axis: 'h' | 'v'; fixed: number; span: Interval; len: number }[] = []
    if (!isExteriorH(r.y)) edges.push({ axis: 'h', fixed: r.y, span: [r.x, r.x + r.width], len: r.width })
    if (!isExteriorH(r.y + r.height))
      edges.push({ axis: 'h', fixed: r.y + r.height, span: [r.x, r.x + r.width], len: r.width })
    if (!isExteriorV(r.x)) edges.push({ axis: 'v', fixed: r.x, span: [r.y, r.y + r.height], len: r.height })
    if (!isExteriorV(r.x + r.width))
      edges.push({ axis: 'v', fixed: r.x + r.width, span: [r.y, r.y + r.height], len: r.height })

    edges.sort((a, b) => b.len - a.len)
    for (const e of edges) {
      const centre = e.axis === 'h' ? r.x + r.width / 2 : r.y + r.height / 2
      if (addDoor(e.axis, e.fixed, centre, e.span)) break
    }
  }

  // Front door: on the living room's exterior wall matching the chosen facing.
  const living = indoor.find((r) => r.category === 'living') ?? indoor[0]
  if (living) {
    const facing = (opts.facing || 'north').toLowerCase()
    const cand: { axis: 'h' | 'v'; fixed: number; span: Interval }[] = []
    // North is the top of the drawing, matching the 2D blueprint's convention.
    if (facing === 'north' && isNear(living.y, 0))
      cand.push({ axis: 'h', fixed: 0, span: [living.x, living.x + living.width] })
    if (facing === 'south' && isNear(living.y + living.height, H))
      cand.push({ axis: 'h', fixed: H, span: [living.x, living.x + living.width] })
    if (facing === 'west' && isNear(living.x, 0))
      cand.push({ axis: 'v', fixed: 0, span: [living.y, living.y + living.height] })
    if (facing === 'east' && isNear(living.x + living.width, W))
      cand.push({ axis: 'v', fixed: W, span: [living.y, living.y + living.height] })

    // Fall back to any exterior edge so there is always a way in.
    if (!cand.length) {
      if (isNear(living.y, 0)) cand.push({ axis: 'h', fixed: 0, span: [living.x, living.x + living.width] })
      else if (isNear(living.y + living.height, H))
        cand.push({ axis: 'h', fixed: H, span: [living.x, living.x + living.width] })
      else if (isNear(living.x, 0)) cand.push({ axis: 'v', fixed: 0, span: [living.y, living.y + living.height] })
      else if (isNear(living.x + living.width, W))
        cand.push({ axis: 'v', fixed: W, span: [living.y, living.y + living.height] })
    }
    for (const c of cand) {
      const centre = c.axis === 'h' ? living.x + living.width / 2 : living.y + living.height / 2
      if (addDoor(c.axis, c.fixed, centre, c.span)) break
    }
  }

  // Windows on exterior edges. Bathrooms get a narrow vent, matching the
  // 'V' vs 'W' distinction the 2D blueprint already draws.
  type Win = { axis: 'h' | 'v'; fixed: number; range: Interval }
  const windows: Win[] = []
  const addWindow = (axis: 'h' | 'v', fixed: number, centre: number, span: Interval, narrow: boolean) => {
    const want = narrow ? 2.2 : 4.2
    const w = Math.min(want, (span[1] - span[0]) * 0.6)
    if (w < 1.4) return
    const range: Interval = [centre - w / 2, centre + w / 2]
    if (range[0] < span[0] + 0.4 || range[1] > span[1] - 0.4) return
    const list = axis === 'h' ? hGaps : vGaps
    if (occupied(list, fixed, range)) return
    list.push({ fixed, range })
    windows.push({ axis, fixed, range })
  }

  for (const r of indoor) {
    const narrow = r.category === 'bathroom'
    if (isNear(r.y, 0)) addWindow('h', 0, r.x + r.width / 2, [r.x, r.x + r.width], narrow)
    if (isNear(r.y + r.height, H)) addWindow('h', H, r.x + r.width / 2, [r.x, r.x + r.width], narrow)
    if (isNear(r.x, 0)) addWindow('v', 0, r.y + r.height / 2, [r.y, r.y + r.height], narrow)
    if (isNear(r.x + r.width, W)) addWindow('v', W, r.y + r.height / 2, [r.y, r.y + r.height], narrow)
  }

  // ---- emit walls, split around every opening ----
  const windowRanges = new Set(windows.map((w) => `${w.axis}|${key(w.fixed)}|${key(w.range[0])}`))

  const emitLine = (axis: 'h' | 'v', fixed: number, runs: Interval[], gaps: Gap[]) => {
    const mine = gaps.filter((g) => isNear(g.fixed, fixed)).map((g) => g.range)
    for (const run of runs) {
      for (const [s, e] of subtractGaps(run, mine)) {
        const len = e - s
        const w = axis === 'h' ? len : WALL_T
        const d = axis === 'h' ? WALL_T : len
        const cx = axis === 'h' ? (s + e) / 2 : fixed
        const cz = axis === 'h' ? fixed : (s + e) / 2
        box('wall', 'wall', w, WALL_H, d, cx, WALL_H / 2, cz)
      }
      // Window openings keep the wall above and below the glass.
      for (const [gs, ge] of mine) {
        if (gs < run[0] - 0.02 || ge > run[1] + 0.02) continue
        const isWindow = windowRanges.has(`${axis}|${key(fixed)}|${key(gs)}`)
        const span = ge - gs
        const w = axis === 'h' ? span : WALL_T
        const d = axis === 'h' ? WALL_T : span
        const cx = axis === 'h' ? (gs + ge) / 2 : fixed
        const cz = axis === 'h' ? fixed : (gs + ge) / 2
        if (isWindow) {
          box('wall_apron', 'wall', w, SILL_Y, d, cx, SILL_Y / 2, cz)
          box('wall_head', 'wall', w, WALL_H - LINTEL_Y, d, cx, (WALL_H + LINTEL_Y) / 2, cz)
          const gw = axis === 'h' ? span : 0.08
          const gd = axis === 'h' ? 0.08 : span
          box('window_glass', 'glass', gw, LINTEL_Y - SILL_Y, gd, cx, (SILL_Y + LINTEL_Y) / 2, cz)
          box('window_sill', 'wood', w + 0.3, 0.14, d + 0.3, cx, SILL_Y, cz)
        } else {
          box('wall_head', 'wall', w, WALL_H - DOOR_H, d, cx, (WALL_H + DOOR_H) / 2, cz)
        }
      }
    }
  }

  for (const [fixed, list] of hLines) emitLine('h', fixed, mergeIntervals(list), hGaps)
  for (const [fixed, list] of vLines) emitLine('v', fixed, mergeIntervals(list), vGaps)

  // Door leaves, set slightly ajar so openings read as doors from above.
  for (const d of doors) {
    const span = d.range[1] - d.range[0]
    const w = d.axis === 'h' ? span * 0.92 : 0.12
    const dp = d.axis === 'h' ? 0.12 : span * 0.92
    const cx = d.axis === 'h' ? (d.range[0] + d.range[1]) / 2 : d.fixed
    const cz = d.axis === 'h' ? d.fixed : (d.range[0] + d.range[1]) / 2
    box('door', 'wood', w, DOOR_H, dp, cx, DOOR_H / 2, cz)
  }

  // ---- parapet cap on exterior walls (flat-roof detail) ----
  box('parapet_n', 'wood', W + WALL_T, PARAPET_H, WALL_T + 0.14, W / 2, WALL_H + PARAPET_H / 2, 0)
  box('parapet_s', 'wood', W + WALL_T, PARAPET_H, WALL_T + 0.14, W / 2, WALL_H + PARAPET_H / 2, H)
  box('parapet_w', 'wood', WALL_T + 0.14, PARAPET_H, H + WALL_T, 0, WALL_H + PARAPET_H / 2, H / 2)
  box('parapet_e', 'wood', WALL_T + 0.14, PARAPET_H, H + WALL_T, W, WALL_H + PARAPET_H / 2, H / 2)

  // ---- outdoor rooms: low rail instead of walls ----
  for (const r of outdoor) {
    const rails: [number, number, number, number, number, number][] = [
      [r.width, RAIL_H, WALL_T, r.x + r.width / 2, RAIL_H / 2, r.y],
      [r.width, RAIL_H, WALL_T, r.x + r.width / 2, RAIL_H / 2, r.y + r.height],
      [WALL_T, RAIL_H, r.height, r.x, RAIL_H / 2, r.y + r.height / 2],
      [WALL_T, RAIL_H, r.height, r.x + r.width, RAIL_H / 2, r.y + r.height / 2],
    ]
    for (const [w, h, d, cx, cy, cz] of rails) {
      // Skip the side shared with the house — that edge already has a wall.
      const onHouse =
        (isNear(cz, r.y) && r.y > 0.1) ||
        (isNear(cz, r.y + r.height) && r.y + r.height < H - 0.1) ||
        (isNear(cx, r.x) && r.x > 0.1) ||
        (isNear(cx, r.x + r.width) && r.x + r.width < W - 0.1)
      if (onHouse) continue
      box('rail', 'wood', w, h, d, cx, cy, cz, { roomId: r.id })
    }
  }

  // ---- site features: water sources and the overhead tank ----
  for (const f of layout.features ?? []) {
    if (f.kind === 'borewell') {
      // Open ground beyond the built footprint, in the Northeast.
      cyl('borewell_ring', 'ceramic', 2.2, 2.4, 1.4, f.x, 0.7, f.y, 20)
      cyl('borewell_mouth', 'glass', 1.7, 1.7, 0.15, f.x, 1.4, f.y, 20)
    } else if (f.kind === 'overhead-tank') {
      // Sits on the roof slab in the Southwest, where weight is wanted.
      const base = WALL_H + PARAPET_H
      for (const [ox, oz] of [
        [-1.6, -1.6],
        [1.6, -1.6],
        [-1.6, 1.6],
        [1.6, 1.6],
      ]) {
        box('tank_leg', 'wood', 0.4, 2.6, 0.4, f.x + ox, base + 1.3, f.y + oz)
      }
      cyl('overhead_tank', 'ceramic', 2.6, 2.6, 4.0, f.x, base + 4.6, f.y, 20)
      cyl('tank_lid', 'wood', 1.0, 1.0, 0.4, f.x, base + 6.8, f.y, 14)
    }
    // 'slope' is a construction instruction with no geometry — it surfaces in
    // the Vastu audit rather than the model.
  }

  // ---- furniture ----
  for (const r of rooms) furnish(r)

  function furnish(r: RoomRect) {
    const cx = r.x + r.width / 2
    const cz = r.y + r.height / 2
    const long = Math.max(r.width, r.height)
    const short = Math.min(r.width, r.height)
    const horiz = r.width >= r.height
    const id = { roomId: r.id }
    if (short < 3.5) return

    // Local axes: `u` runs along the room's long side, `v` across it.
    const at = (u: number, v: number): [number, number] => (horiz ? [cx + u, cz + v] : [cx + v, cz + u])

    switch (r.category) {
      case 'living': {
        const sofaW = Math.min(long * 0.5, 7.5)
        const [sx, sz] = at(-long * 0.16, -short * 0.28)
        box('sofa_seat', 'fabric', horiz ? sofaW : 2.8, 1.5, horiz ? 2.8 : sofaW, sx, 0.75, sz, id)
        const [bx, bz] = at(-long * 0.16, -short * 0.28 - 1.2)
        box('sofa_back', 'fabric', horiz ? sofaW : 0.7, 2.4, horiz ? 0.7 : sofaW, bx, 1.2, bz, id)
        const [tx, tz] = at(-long * 0.16, short * 0.06)
        box('coffee_table', 'furniture', horiz ? 3.4 : 1.9, 1.2, horiz ? 1.9 : 3.4, tx, 0.6, tz, id)
        const [vx, vz] = at(long * 0.3, -short * 0.3)
        box('tv_unit', 'furniture', horiz ? 5.2 : 1.5, 1.6, horiz ? 1.5 : 5.2, vx, 0.8, vz, id)
        if (long > 14) {
          const [dx, dz] = at(long * 0.26, short * 0.14)
          box('dining_top', 'furniture', horiz ? 5.2 : 3.2, 0.2, horiz ? 3.2 : 5.2, dx, 2.4, dz, id)
          for (const [ox, oz] of [
            [-2.2, -1.2],
            [2.2, -1.2],
            [-2.2, 1.2],
            [2.2, 1.2],
          ]) {
            cyl('dining_leg', 'furniture', 0.13, 0.13, 2.4, dx + ox, 1.2, dz + oz, 8, id)
            box('dining_chair', 'fabric', 1.3, 1.5, 1.3, dx + ox * 1.25, 0.75, dz + oz * 1.5, id)
          }
        }
        break
      }
      case 'kitchen': {
        const [ax, az] = at(0, -short / 2 + 1.1)
        box('counter_a', 'furniture', horiz ? long - 1.2 : 2.0, 3.0, horiz ? 2.0 : long - 1.2, ax, 1.5, az, id)
        const [bx2, bz2] = at(-long / 2 + 1.1, 0.6)
        box('counter_b', 'furniture', horiz ? 2.0 : short - 2.4, 3.0, horiz ? short - 2.4 : 2.0, bx2, 1.5, bz2, id)
        box('sink', 'ceramic', 1.6, 0.5, 1.4, ax, 3.1, az, id)
        const [fx, fz] = at(long / 2 - 1.4, -short / 2 + 1.3)
        box('fridge', 'ceramic', 2.2, 5.6, 2.2, fx, 2.8, fz, id)
        break
      }
      case 'bedroom': {
        const isMaster = r.areaSqft > 130
        const bw = isMaster ? 6.2 : 4.0
        const bl = 6.8
        const [px, pz] = at(-long / 2 + bl / 2 + 0.6, 0)
        box('bed_base', 'furniture', horiz ? bl : bw, 1.15, horiz ? bw : bl, px, 0.58, pz, id)
        box('mattress', 'fabric', horiz ? bl - 0.3 : bw - 0.3, 0.7, horiz ? bw - 0.3 : bl - 0.3, px, 1.5, pz, id)
        const [hx, hz] = at(-long / 2 + 0.9, 0)
        box('headboard', 'wood', horiz ? 0.4 : bw, 3.2, horiz ? bw : 0.4, hx, 1.6, hz, id)
        const [nx, nz] = at(-long / 2 + 1.0, bw / 2 + 0.9)
        if (short > bw + 3) box('nightstand', 'furniture', 1.6, 1.9, 1.6, nx, 0.95, nz, id)
        const [wx, wz] = at(long / 2 - 1.1, 0)
        box('wardrobe', 'furniture', horiz ? 1.9 : short * 0.6, 6.2, horiz ? short * 0.6 : 1.9, wx, 3.1, wz, id)
        break
      }
      case 'bathroom': {
        const [vx2, vz2] = at(-long / 2 + 1.0, -short / 2 + 1.2)
        box('vanity', 'ceramic', 1.8, 2.5, 2.6, vx2, 1.25, vz2, id)
        const [wx2, wz2] = at(long / 2 - 1.1, -short / 2 + 1.1)
        box('wc', 'ceramic', 1.4, 1.4, 2.0, wx2, 0.7, wz2, id)
        const [sx2, sz2] = at(long / 2 - 1.6, short / 2 - 1.6)
        box('shower_tray', 'ceramic', 2.6, 0.25, 2.6, sx2, 0.12, sz2, id)
        break
      }
      case 'extra': {
        if (r.id.startsWith('passage-')) return // Circulation stays empty.
        if (r.id === 'staircase') {
          // A straight flight rising along the room's long axis. Each tread is
          // a solid box from the floor up, so the run reads as stairs from the
          // dollhouse camera rather than as floating slabs.
          const steps = 11 // Vastu prescribes an odd step count.
          const rise = WALL_H / steps
          const run = (long - 1.0) / steps
          const treadDepth = Math.min(short - 1.0, 4.0)
          for (let i = 0; i < steps; i++) {
            const u = -long / 2 + 0.5 + run * (i + 0.5)
            const [sx3, sz3] = at(u, 0)
            const h = rise * (i + 1)
            box('stair_tread', 'wood', horiz ? run : treadDepth, h, horiz ? treadDepth : run, sx3, h / 2, sz3, id)
          }
          return
        }
        const [ux, uz] = at(0, -short / 2 + 1.0)
        box('shelf', 'furniture', horiz ? long * 0.5 : 1.5, 2.6, horiz ? 1.5 : long * 0.5, ux, 1.3, uz, id)
        const [cx2, cz2] = at(0, short * 0.12)
        box('low_table', 'wood', 2.4, 1.1, 2.4, cx2, 0.55, cz2, id)
        break
      }
      case 'outdoor': {
        // The Brahmasthan (and a traditional aangan) must read as unbuilt
        // open-to-sky space — Vastu keeps the centre free of construction, so
        // no deck, seating or planters go here. A plain sunken floor and a
        // low kerb are the whole treatment.
        if (isOpenCentre(r)) {
          box('centre_kerb', 'wood', r.width, 0.45, 0.35, cx, 0.22, r.y + 0.18, id)
          box('centre_kerb', 'wood', r.width, 0.45, 0.35, cx, 0.22, r.y + r.height - 0.18, id)
          box('centre_kerb', 'wood', 0.35, 0.45, r.height, r.x + 0.18, 0.22, cz, id)
          box('centre_kerb', 'wood', 0.35, 0.45, r.height, r.x + r.width - 0.18, 0.22, cz, id)
          return
        }
        const [dx2, dz2] = at(0, 0)
        box('deck', 'wood', r.width - 1.0, 0.2, r.height - 1.0, dx2, 0.1, dz2, id)
        const [bx3, bz3] = at(long * 0.2, 0)
        box('bench_seat', 'furniture', horiz ? 4.0 : 1.5, 1.3, horiz ? 1.5 : 4.0, bx3, 0.65, bz3, id)
        for (const u of [-long * 0.3, long * 0.34]) {
          const [px2, pz2] = at(u, short * 0.28)
          cyl('planter_pot', 'wood', 0.9, 0.7, 1.3, px2, 0.65, pz2, 16, id)
          cyl('planter_foliage', 'foliage', 1.0, 0.16, 1.8, px2, 2.2, pz2, 10, id)
        }
        break
      }
    }
  }

  // Re-centre on the origin so the renderer can frame it symmetrically.
  for (const p of parts) {
    p.pos[0] -= W / 2
    p.pos[2] -= H / 2
  }

  return { parts, plotWidthFt: W, plotHeightFt: H }
}
