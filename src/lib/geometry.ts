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
 * Clamps a translation so both endpoints stay inside the unit square.
 * Keeps a line's shape intact when it is dragged against an edge.
 */
export function clampTranslation(
  a: Point,
  b: Point,
  dx: number,
  dy: number,
): { dx: number; dy: number } {
  const minX = Math.min(a.x, b.x)
  const maxX = Math.max(a.x, b.x)
  const minY = Math.min(a.y, b.y)
  const maxY = Math.max(a.y, b.y)
  return {
    dx: Math.min(1 - maxX, Math.max(-minX, dx)),
    dy: Math.min(1 - maxY, Math.max(-minY, dy)),
  }
}

/** Angle of a line from horizontal, in degrees (0–90). */
export function angleFromHorizontal(a: Point, b: Point): number {
  const deg = Math.abs(toDegrees(Math.atan2(b.y - a.y, b.x - a.x)))
  return deg > 90 ? 180 - deg : deg
}

/** Angle of a line from vertical, in degrees (0–90). */
export function angleFromVertical(a: Point, b: Point): number {
  return 90 - angleFromHorizontal(a, b)
}
