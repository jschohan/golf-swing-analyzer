import { create } from 'zustand'
import type { Angle, Line, PointAngle } from '../lib/annotations'
import type { Point } from '../lib/geometry'
import { usePlayback } from './playback'

export type { Angle, Line, LineAngle, PointAngle } from '../lib/annotations'

export type Tool = 'select' | 'line' | 'lineAngle' | 'pointAngle'

export const LINE_COLORS = ['#ffd60a', '#ff453a', '#30d158', '#0a84ff', '#ffffff'] as const

type AnnotationState = {
  tool: Tool
  lines: Line[]
  angles: Angle[]
  // Id of the selected line or angle.
  selectedId: string | null
  // Color for the next shape drawn, and for the selected shape when it changes.
  drawColor: string
  // Line angle tool: the first line picked, while waiting for the second.
  pendingLineId: string | null
  // 3-point angle tool: the points placed so far (first arm, then vertex).
  pendingPoints: Point[]

  setTool: (tool: Tool) => void
  select: (id: string | null) => void
  addLine: (a: Point, b: Point) => void
  updateLine: (id: string, patch: Partial<Omit<Line, 'id'>>) => void
  pickLineForAngle: (id: string) => void
  addPendingPoint: (point: Point) => void
  cancelPending: () => void
  updatePointAngle: (id: string, patch: Partial<Omit<PointAngle, 'id' | 'kind'>>) => void
  deleteSelected: () => void
  setColor: (color: string) => void
  clear: () => void
}

const noPending = { pendingLineId: null, pendingPoints: [] }

export const useAnnotations = create<AnnotationState>()((set, get) => ({
  tool: 'select',
  lines: [],
  angles: [],
  selectedId: null,
  drawColor: LINE_COLORS[0],
  ...noPending,

  setTool: (tool) => set({ tool, ...noPending }),
  select: (selectedId) => set({ selectedId }),

  addLine: (a, b) => {
    const line: Line = { id: crypto.randomUUID(), a, b, color: get().drawColor, label: '' }
    set((s) => ({ lines: [...s.lines, line], selectedId: line.id }))
  },

  updateLine: (id, patch) =>
    set((s) => ({
      lines: s.lines.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    })),

  pickLineForAngle: (id) => {
    const { pendingLineId, angles } = get()
    if (!pendingLineId) {
      set({ pendingLineId: id, selectedId: null })
      return
    }
    if (pendingLineId === id) {
      set({ pendingLineId: null })
      return
    }
    // Measuring the same pair twice just selects the existing angle.
    const existing = angles.find(
      (angle) =>
        angle.kind === 'lines' &&
        angle.lineIds.includes(pendingLineId) &&
        angle.lineIds.includes(id),
    )
    if (existing) {
      set({ pendingLineId: null, selectedId: existing.id })
      return
    }
    const angle: Angle = { id: crypto.randomUUID(), kind: 'lines', lineIds: [pendingLineId, id] }
    set({ angles: [...angles, angle], pendingLineId: null, selectedId: angle.id })
  },

  addPendingPoint: (point) => {
    const points = [...get().pendingPoints, point]
    if (points.length < 3) {
      set({ pendingPoints: points, selectedId: null })
      return
    }
    const angle: Angle = {
      id: crypto.randomUUID(),
      kind: 'points',
      p1: points[0],
      vertex: points[1],
      p2: points[2],
      color: get().drawColor,
    }
    set((s) => ({ angles: [...s.angles, angle], pendingPoints: [], selectedId: angle.id }))
  },

  cancelPending: () => set(noPending),

  updatePointAngle: (id, patch) =>
    set((s) => ({
      angles: s.angles.map((angle) =>
        angle.id === id && angle.kind === 'points' ? { ...angle, ...patch } : angle,
      ),
    })),

  deleteSelected: () => {
    const { selectedId, lines, angles } = get()
    if (!selectedId) return
    set({
      lines: lines.filter((line) => line.id !== selectedId),
      // Deleting a line also removes the angles measured from it.
      angles: angles.filter(
        (angle) =>
          angle.id !== selectedId &&
          !(angle.kind === 'lines' && angle.lineIds.includes(selectedId)),
      ),
      selectedId: null,
    })
  },

  setColor: (color) => {
    const { selectedId, updateLine, updatePointAngle } = get()
    set({ drawColor: color })
    if (!selectedId) return
    updateLine(selectedId, { color })
    updatePointAngle(selectedId, { color })
  },

  clear: () => set({ lines: [], angles: [], selectedId: null, ...noPending }),
}))

// Annotations belong to one video, so start fresh whenever a new one loads.
usePlayback.subscribe((state, prev) => {
  if (state.videoUrl !== prev.videoUrl) useAnnotations.getState().clear()
})
