import { create } from 'zustand'
import type { Point } from '../lib/geometry'
import { usePlayback } from './playback'

export type Tool = 'select' | 'line'

export type Line = {
  id: string
  // Normalized (0–1) relative to the video frame.
  a: Point
  b: Point
  color: string
  label: string
}

export const LINE_COLORS = ['#ffd60a', '#ff453a', '#30d158', '#0a84ff', '#ffffff'] as const

type AnnotationState = {
  tool: Tool
  lines: Line[]
  selectedId: string | null
  // Color for the next line drawn, and for the selected line when it changes.
  drawColor: string

  setTool: (tool: Tool) => void
  select: (id: string | null) => void
  addLine: (a: Point, b: Point) => void
  updateLine: (id: string, patch: Partial<Omit<Line, 'id'>>) => void
  deleteSelected: () => void
  setColor: (color: string) => void
  clear: () => void
}

export const useAnnotations = create<AnnotationState>()((set, get) => ({
  tool: 'select',
  lines: [],
  selectedId: null,
  drawColor: LINE_COLORS[0],

  setTool: (tool) => set({ tool }),
  select: (selectedId) => set({ selectedId }),

  addLine: (a, b) => {
    const line: Line = { id: crypto.randomUUID(), a, b, color: get().drawColor, label: '' }
    set((s) => ({ lines: [...s.lines, line], selectedId: line.id }))
  },

  updateLine: (id, patch) =>
    set((s) => ({
      lines: s.lines.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    })),

  deleteSelected: () => {
    const { selectedId, lines } = get()
    if (!selectedId) return
    set({
      lines: lines.filter((line) => line.id !== selectedId),
      selectedId: null,
    })
  },

  setColor: (color) => {
    const { selectedId, updateLine } = get()
    set({ drawColor: color })
    if (selectedId) updateLine(selectedId, { color })
  },

  clear: () => set({ lines: [], selectedId: null }),
}))

// Annotations belong to one video, so start fresh whenever a new one loads.
usePlayback.subscribe((state, prev) => {
  if (state.videoUrl !== prev.videoUrl) useAnnotations.getState().clear()
})
