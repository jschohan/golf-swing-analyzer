import { describe, expect, it } from 'vitest'
import {
  angleAtVertex,
  angleBetweenLines,
  angleFromHorizontal,
  angleFromVertical,
  clampTranslation,
  lineIntersection,
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
    const t = clampTranslation(a, b, 0.1, -0.05)
    expect(t.dx).toBeCloseTo(0.1)
    expect(t.dy).toBeCloseTo(-0.05)
  })
  it('stops at the edges of the frame', () => {
    const low = clampTranslation(a, b, -1, -1)
    expect(low.dx).toBeCloseTo(-0.1)
    expect(low.dy).toBeCloseTo(-0.1)
    const high = clampTranslation(a, b, 1, 1)
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
