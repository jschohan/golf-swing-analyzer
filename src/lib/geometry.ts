/** Points are normalized (0–1) relative to the video frame. */
export type Point = { x: number; y: number }

const toDegrees = (rad: number) => (rad * 180) / Math.PI

/**
 * Angle at `vertex` between rays to `p1` and `p2`, in degrees (0–180).
 * Returns NaN if either arm has zero length.
 */
export function angleAtVertex(vertex: Point, p1: Point, p2: Point): number {
  const ux = p1.x - vertex.x
  const uy = p1.y - vertex.y
  const vx = p2.x - vertex.x
  const vy = p2.y - vertex.y
  const lenU = Math.hypot(ux, uy)
  const lenV = Math.hypot(vx, vy)
  if (lenU === 0 || lenV === 0) return NaN
  const cos = (ux * vx + uy * vy) / (lenU * lenV)
  return toDegrees(Math.acos(Math.min(1, Math.max(-1, cos))))
}

/**
 * Angle between two lines (a1→a2, b1→b2), in degrees (0–90 when `acute`,
 * otherwise 0–180 based on the drawn direction of each line).
 */
export function angleBetweenLines(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point,
  acute = true,
): number {
  const origin = { x: 0, y: 0 }
  const angle = angleAtVertex(
    origin,
    { x: a2.x - a1.x, y: a2.y - a1.y },
    { x: b2.x - b1.x, y: b2.y - b1.y },
  )
  return acute && angle > 90 ? 180 - angle : angle
}

/** Intersection of the infinite lines through (a1,a2) and (b1,b2), or null if parallel. */
export function lineIntersection(a1: Point, a2: Point, b1: Point, b2: Point): Point | null {
  const d1x = a2.x - a1.x
  const d1y = a2.y - a1.y
  const d2x = b2.x - b1.x
  const d2y = b2.y - b1.y
  const denom = d1x * d2y - d1y * d2x
  if (denom === 0) return null
  const t = ((b1.x - a1.x) * d2y - (b1.y - a1.y) * d2x) / denom
  return { x: a1.x + t * d1x, y: a1.y + t * d1y }
}

/**
 * Clamps a translation so every point stays inside the unit square.
 * Keeps a shape intact when it is dragged against an edge.
 */
export function clampTranslation(
  points: Point[],
  dx: number,
  dy: number,
): { dx: number; dy: number } {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  return {
    dx: Math.min(1 - Math.max(...xs), Math.max(-Math.min(...xs), dx)),
    dy: Math.min(1 - Math.max(...ys), Math.max(-Math.min(...ys), dy)),
  }
}

export type Size = { width: number; height: number }

/**
 * Converts a normalized point to pixels. Angles must be measured in pixels:
 * normalized coordinates stretch a non-square frame into a square, which
 * changes every angle that isn't axis-aligned.
 */
export const toPixels = (p: Point, size: Size): Point => ({
  x: p.x * size.width,
  y: p.y * size.height,
})

export const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y)

export type AngleMeasure = {
  degrees: number
  /** Where the arms meet, or null for parallel lines. */
  vertex: Point | null
  p1: Point
  p2: Point
}

/**
 * Angle between two drawn lines, as they would meet if extended (0–180).
 * Each arm runs from the intersection toward the line's far endpoint, so the
 * result is the angle on the side where the lines were actually drawn.
 */
export function measureLines(a1: Point, a2: Point, b1: Point, b2: Point): AngleMeasure {
  const vertex = lineIntersection(a1, a2, b1, b2)
  if (!vertex) return { degrees: 0, vertex: null, p1: a2, p2: b2 }
  const p1 = distance(vertex, a1) > distance(vertex, a2) ? a1 : a2
  const p2 = distance(vertex, b1) > distance(vertex, b2) ? b1 : b2
  return { degrees: angleAtVertex(vertex, p1, p2), vertex, p1, p2 }
}

const unit = (from: Point, to: Point): Point => {
  const len = distance(from, to) || 1
  return { x: (to.x - from.x) / len, y: (to.y - from.y) / len }
}

/** Point `dist` away from `vertex` along the bisector of the angle p1–vertex–p2. */
export function bisectorPoint(vertex: Point, p1: Point, p2: Point, dist: number): Point {
  const u1 = unit(vertex, p1)
  const u2 = unit(vertex, p2)
  let bx = u1.x + u2.x
  let by = u1.y + u2.y
  // Arms pointing in opposite directions have no bisector; use a perpendicular.
  if (Math.hypot(bx, by) < 1e-9) {
    bx = -u1.y
    by = u1.x
  }
  const len = Math.hypot(bx, by)
  return { x: vertex.x + (bx / len) * dist, y: vertex.y + (by / len) * dist }
}

/** SVG path for the arc of the given radius spanning the angle p1–vertex–p2. */
export function arcPath(vertex: Point, p1: Point, p2: Point, radius: number): string {
  const u1 = unit(vertex, p1)
  const u2 = unit(vertex, p2)
  const start = { x: vertex.x + u1.x * radius, y: vertex.y + u1.y * radius }
  const end = { x: vertex.x + u2.x * radius, y: vertex.y + u2.y * radius }
  // With y pointing down, a positive cross product is a clockwise turn on screen.
  const sweep = u1.x * u2.y - u1.y * u2.x > 0 ? 1 : 0
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${sweep} ${end.x} ${end.y}`
}

export const formatDegrees = (degrees: number) =>
  Number.isFinite(degrees) ? `${degrees.toFixed(1)}°` : '–'

/** Angle of a line from horizontal, in degrees (0–90). */
export function angleFromHorizontal(a: Point, b: Point): number {
  const deg = Math.abs(toDegrees(Math.atan2(b.y - a.y, b.x - a.x)))
  return deg > 90 ? 180 - deg : deg
}

/** Angle of a line from vertical, in degrees (0–90). */
export function angleFromVertical(a: Point, b: Point): number {
  return 90 - angleFromHorizontal(a, b)
}
