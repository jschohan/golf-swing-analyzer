import { describe, expect, it } from 'vitest'
import {
  angleAtVertex,
  angleBetweenLines,
  angleFromHorizontal,
  angleFromVertical,
  arcPath,
  bisectorPoint,
  clampTranslation,
  formatDegrees,
  lineIntersection,
  measureLines,
  toPixels,
} from './geometry'

describe('angleAtVertex', () => {
  it('measures a right angle', () => {
    expect(angleAtVertex({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(90)
  })
  it('measures a straight line as 180', () => {
    expect(angleAtVertex({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 0 })).toBeCloseTo(180)
  })
  it('returns NaN for a zero-length arm', () => {
    expect(angleAtVertex({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeNaN()
  })
})

describe('angleBetweenLines', () => {
  const a1 = { x: 0, y: 0 }
  const a2 = { x: 1, y: 0 }
  const b1 = { x: 5, y: 5 }
  const b2 = { x: 6, y: 6 }
  it('works for lines that do not touch', () => {
    expect(angleBetweenLines(a1, a2, b1, b2)).toBeCloseTo(45)
  })
  it('reports the acute angle regardless of drawn direction', () => {
    expect(angleBetweenLines(a1, a2, b2, b1)).toBeCloseTo(45)
  })
  it('reports the directed angle when acute is false', () => {
    expect(angleBetweenLines(a1, a2, b2, b1, false)).toBeCloseTo(135)
  })
})

describe('lineIntersection', () => {
  it('finds the crossing point of extended lines', () => {
    const p = lineIntersection({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 1 })
    expect(p).toEqual({ x: 1, y: 1 })
  })
  it('returns null for parallel lines', () => {
    expect(lineIntersection({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 })).toBeNull()
  })
})

describe('clampTranslation', () => {
  const a = { x: 0.1, y: 0.1 }
  const b = { x: 0.3, y: 0.5 }
  it('passes through a translation that stays on screen', () => {
    const t = clampTranslation([a, b], 0.1, -0.05)
    expect(t.dx).toBeCloseTo(0.1)
    expect(t.dy).toBeCloseTo(-0.05)
  })
  it('stops at the edges of the frame', () => {
    const low = clampTranslation([a, b], -1, -1)
    expect(low.dx).toBeCloseTo(-0.1)
    expect(low.dy).toBeCloseTo(-0.1)
    const high = clampTranslation([a, b], 1, 1)
    expect(high.dx).toBeCloseTo(0.7)
    expect(high.dy).toBeCloseTo(0.5)
  })
})

describe('angle from axes', () => {
  it('measures from horizontal and vertical', () => {
    expect(angleFromHorizontal({ x: 0, y: 0 }, { x: 1, y: 1 })).toBeCloseTo(45)
    expect(angleFromVertical({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(0)
    expect(angleFromVertical({ x: 0, y: 0 }, { x: 1, y: 1 })).toBeCloseTo(45)
  })
})

describe('toPixels', () => {
  it('restores true angles on a non-square frame', () => {
    // A 45° diagonal in pixels on a 16:9 frame is not 45° in normalized space.
    const size = { width: 1600, height: 900 }
    const vertex = { x: 0.5, y: 0.5 }
    const along = { x: 0.75, y: 0.5 }
    const diagonal = { x: 0.75, y: 0.5 - 400 / 900 }
    expect(angleAtVertex(vertex, along, diagonal)).not.toBeCloseTo(45, 0)
    expect(
      angleAtVertex(toPixels(vertex, size), toPixels(along, size), toPixels(diagonal, size)),
    ).toBeCloseTo(45)
  })
})

describe('measureLines', () => {
  it('measures the angle on the side the lines were drawn', () => {
    // Two lines leaving the origin 120° apart, neither touching it.
    const rad = (120 * Math.PI) / 180
    const m = measureLines(
      { x: 2, y: 0 },
      { x: 10, y: 0 },
      { x: 2 * Math.cos(rad), y: 2 * Math.sin(rad) },
      { x: 10 * Math.cos(rad), y: 10 * Math.sin(rad) },
    )
    expect(m.degrees).toBeCloseTo(120)
    expect(m.vertex?.x).toBeCloseTo(0)
    expect(m.vertex?.y).toBeCloseTo(0)
  })
  it('does not depend on the direction a line was drawn', () => {
    const forward = measureLines({ x: 1, y: 0 }, { x: 5, y: 0 }, { x: 1, y: 1 }, { x: 5, y: 5 })
    const reversed = measureLines({ x: 5, y: 0 }, { x: 1, y: 0 }, { x: 5, y: 5 }, { x: 1, y: 1 })
    expect(forward.degrees).toBeCloseTo(45)
    expect(reversed.degrees).toBeCloseTo(45)
  })
  it('reports parallel lines as 0 with no vertex', () => {
    const m = measureLines({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 })
    expect(m.degrees).toBe(0)
    expect(m.vertex).toBeNull()
  })
})

describe('arcPath', () => {
  const vertex = { x: 0, y: 0 }
  const right = { x: 10, y: 0 }
  const down = { x: 0, y: 10 }
  it('sweeps clockwise on screen from right to down', () => {
    expect(arcPath(vertex, right, down, 5)).toBe('M 5 0 A 5 5 0 0 1 0 5')
  })
  it('sweeps the other way when the arms are swapped', () => {
    expect(arcPath(vertex, down, right, 5)).toBe('M 0 5 A 5 5 0 0 0 5 0')
  })
})

describe('bisectorPoint', () => {
  it('lies midway between the arms', () => {
    const p = bisectorPoint({ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 9 }, Math.SQRT2)
    expect(p.x).toBeCloseTo(1)
    expect(p.y).toBeCloseTo(1)
  })
  it('falls back to a perpendicular for a straight angle', () => {
    const p = bisectorPoint({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 0 }, 2)
    expect(p.x).toBeCloseTo(0)
    expect(Math.abs(p.y)).toBeCloseTo(2)
  })
})

describe('formatDegrees', () => {
  it('rounds to one decimal place', () => {
    expect(formatDegrees(42.25)).toBe('42.3°')
    expect(formatDegrees(NaN)).toBe('–')
  })
})
