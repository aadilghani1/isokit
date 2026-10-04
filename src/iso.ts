/**
 * The projection. True isometric: +x runs down-right, +y runs down-left and +z
 * runs up, all three 120° apart. There is no perspective, so far things never
 * shrink, and no depth buffer: whatever is drawn later covers what was drawn
 * before, so a scene is written back to front.
 *
 * Faces are flat drawings placed on a 3D plane by one SVG `matrix()`, so
 * ordinary rects, paths and text drawn in a face's own coordinates land in
 * projection, text and rounded corners included.
 */

/** A point in world space: [x, y, z]. */
export type Vec3 = readonly [number, number, number]
/** A point on screen, in viewBox units. */
export type Vec2 = [number, number]
/** An axis-aligned box: its back-left-bottom corner and its size along x (w), y (d) and z (h). */
export type Box3 = { x: number; y: number; z: number; w: number; d: number; h: number }

const COS = Math.cos(Math.PI / 6)
const SIN = Math.sin(Math.PI / 6)
const r3 = (n: number) => Math.round(n * 1000) / 1000

/** Projects a world point to the screen. */
export const project = (x: number, y: number, z: number): Vec2 => [(x - y) * COS, (x + y) * SIN - z]

const plane = (o: Vec3, u: Vec3, v: Vec3) => {
  const [ox, oy] = project(...o)
  const [ux, uy] = project(...u)
  const [vx, vy] = project(...v)
  return `matrix(${r3(ux)} ${r3(uy)} ${r3(vx)} ${r3(vy)} ${r3(ox)} ${r3(oy)})`
}

/**
 * A horizontal plane at height z. Local x runs along +x, local y along +y;
 * the origin is the plane's back-left corner (smallest x and y).
 */
export const top = (x: number, y: number, z: number) => plane([x, y, z], [1, 0, 0], [0, 1, 0])
/**
 * A vertical plane facing lower-left (y is constant). Local x runs along +x,
 * local y runs down; the origin is the face's top-left corner.
 */
export const front = (x: number, y: number, z: number) => plane([x, y, z], [1, 0, 0], [0, 0, -1])
/**
 * A vertical plane facing lower-right (x is constant). Local x runs from the
 * front edge toward the back (−y), local y runs down; the origin is the face's
 * top-front corner.
 */
export const side = (x: number, y: number, z: number) => plane([x, y, z], [0, -1, 0], [0, 0, -1])

/** An open path through world points, for cables, guides and wires. */
export const path = (points: readonly Vec3[]) =>
  points.length < 2 ? "" : `M${points.map((p) => project(...p).map(r3).join(" ")).join("L")}`

/** The eight corners of a box. */
export const corners = ({ x, y, z, w, d, h }: Box3): Vec3[] =>
  [0, 1].flatMap((i) => [0, 1].flatMap((j) => [0, 1].map((k): Vec3 => [x + i * w, y + j * d, z + k * h])))

const isBox = (b: Box3 | Vec3): b is Box3 => !Array.isArray(b)

/**
 * A viewBox that fits the given boxes and points with some padding, at a fixed
 * aspect ratio (width / height). Fit the most extreme pose your figure takes,
 * so nothing leaves the frame when it moves.
 */
export function frame(fit: ReadonlyArray<Box3 | Vec3>, aspect = 1.25, pad = 0.07): string {
  const pts = fit.flatMap((b) => (isBox(b) ? corners(b) : [b])).map((p) => project(...p))
  if (!pts.length) return "0 0 100 100"
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
  let w = Math.max(x1 - x0, 1) * (1 + 2 * pad)
  let h = Math.max(y1 - y0, 1) * (1 + 2 * pad)
  if (w / h < aspect) w = h * aspect
  else h = w / aspect
  return [(x0 + x1 - w) / 2, (y0 + y1 - h) / 2, w, h].map(r3).join(" ")
}

/** A rounded-rectangle footprint, sampled round its corners. */
function footprint(x: number, y: number, w: number, d: number, r: number, steps = 6): Vec2[] {
  const out: Vec2[] = []
  const arcs: Array<[number, number, number]> = [[x + w - r, y + d - r, 0], [x + r, y + d - r, 90], [x + r, y + r, 180], [x + w - r, y + r, 270]]
  for (const [cx, cy, a0] of arcs)
    for (let k = 0; k <= steps; k++) {
      const a = ((a0 + (90 * k) / steps) * Math.PI) / 180
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
    }
  return out
}

/** Convex hull of screen points (Andrew's monotone chain). */
export function hull(input: readonly Vec2[]): Vec2[] {
  const pts = input.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o: Vec2, a: Vec2, b: Vec2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: Vec2[] = [], upper: Vec2[] = []
  for (const p of pts) {
    while (lower.length > 1 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (upper.length > 1 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1))
}

/**
 * The outline of a rounded box: the hull of its rounded top and foot. No
 * vertical corner is ever drawn and no face pokes past a rounded corner.
 */
export function outline({ x, y, z, w, d, h }: Box3, r: number): string {
  const ring = footprint(x, y, w, d, r)
  const pts = hull(ring.flatMap(([a, b]) => [project(a, b, z), project(a, b, z + h)]))
  return `M${pts.map((p) => p.map(r3).join(" ")).join("L")}Z`
}

/** The radius a box can actually take: never more than half its shorter side. */
export const radius = (b: Box3, r: number) => Math.max(0, Math.min(r, b.w / 2, b.d / 2))
