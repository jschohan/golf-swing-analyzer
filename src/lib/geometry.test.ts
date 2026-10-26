import { describe, expect, it } from 'vitest'
import {
  angleAtVertex,
  angleBetweenLines,
  angleFromHorizontal,
  angleFromVertical,
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

describe('angle from axes', () => {
  it('measures from horizontal and vertical', () => {
    expect(angleFromHorizontal({ x: 0, y: 0 }, { x: 1, y: 1 })).toBeCloseTo(45)
    expect(angleFromVertical({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(0)
    expect(angleFromVertical({ x: 0, y: 0 }, { x: 1, y: 1 })).toBeCloseTo(45)
  })
})
