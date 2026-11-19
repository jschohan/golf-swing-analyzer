import {
  angleAtVertex,
  measureLines,
  toPixels,
  type AngleMeasure,
  type Point,
  type Size,
} from './geometry'

// All points are normalized (0–1) relative to the video frame.

export type Line = {
  id: string
  a: Point
  b: Point
  color: string
  label: string
}

/** Angle between two drawn lines. Follows the lines as they are edited. */
export type LineAngle = {
  id: string
  kind: 'lines'
  lineIds: [string, string]
}

/** Angle at `vertex` between the arms to `p1` and `p2`. */
export type PointAngle = {
  id: string
  kind: 'points'
  p1: Point
  vertex: Point
  p2: Point
  color: string
}

export type Angle = LineAngle | PointAngle

/**
 * Measures an angle in pixel space for a frame of the given size.
 * Returns null if a line the angle refers to no longer exists.
 */
export function measureAngle(angle: Angle, lines: Line[], size: Size): AngleMeasure | null {
  if (angle.kind === 'points') {
    const vertex = toPixels(angle.vertex, size)
    const p1 = toPixels(angle.p1, size)
    const p2 = toPixels(angle.p2, size)
    return { degrees: angleAtVertex(vertex, p1, p2), vertex, p1, p2 }
  }
  const [first, second] = angle.lineIds.map((id) => lines.find((line) => line.id === id))
  if (!first || !second) return null
  return measureLines(
    toPixels(first.a, size),
    toPixels(first.b, size),
    toPixels(second.a, size),
    toPixels(second.b, size),
  )
}

/** Display name for a line: its label, or its position in the list. */
export function lineName(line: Line, lines: Line[]): string {
  return line.label || `Line ${lines.indexOf(line) + 1}`
}
