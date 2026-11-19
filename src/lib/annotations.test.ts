import { describe, expect, it } from 'vitest'
import { lineName, measureAngle, type Line } from './annotations'

const size = { width: 1600, height: 900 }
const line = (id: string, ax: number, ay: number, bx: number, by: number, label = ''): Line => ({
  id,
  a: { x: ax, y: ay },
  b: { x: bx, y: by },
  color: '#fff',
  label,
})

describe('measureAngle', () => {
  it('measures a 3-point angle in pixels, not normalized units', () => {
    // 400px right and 400px up from the vertex: 45° on screen.
    const measure = measureAngle(
      {
        id: 'p',
        kind: 'points',
        vertex: { x: 0.5, y: 0.5 },
        p1: { x: 0.75, y: 0.5 },
        p2: { x: 0.75, y: 0.5 - 400 / 900 },
        color: '#fff',
      },
      [],
      size,
    )
    expect(measure?.degrees).toBeCloseTo(45)
  })

  it('measures between two lines that do not touch', () => {
    const lines = [line('h', 0.25, 0.5, 0.75, 0.5), line('d', 0.5, 0.9, 0.75, 0.9 - 400 / 900)]
    const measure = measureAngle({ id: 'a', kind: 'lines', lineIds: ['h', 'd'] }, lines, size)
    expect(measure?.degrees).toBeCloseTo(45)
  })

  it('returns null when a line is missing', () => {
    const lines = [line('h', 0, 0, 1, 0)]
    expect(measureAngle({ id: 'a', kind: 'lines', lineIds: ['h', 'gone'] }, lines, size)).toBeNull()
  })
})

describe('lineName', () => {
  it('uses the label, falling back to the position', () => {
    const lines = [line('1', 0, 0, 1, 1), line('2', 0, 0, 1, 1, 'Spine')]
    expect(lineName(lines[0], lines)).toBe('Line 1')
    expect(lineName(lines[1], lines)).toBe('Spine')
  })
})
