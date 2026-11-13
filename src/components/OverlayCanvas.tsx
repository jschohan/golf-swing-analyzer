import { useRef, useState, type PointerEvent } from 'react'
import { clampTranslation, type Point } from '../lib/geometry'
import { useAnnotations } from '../store/annotations'

// Drags shorter than this (in screen pixels) count as accidental clicks.
const MIN_DRAW_PIXELS = 6

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const shift = (p: Point, dx: number, dy: number): Point => ({ x: p.x + dx, y: p.y + dy })

type Drag =
  | { kind: 'draw'; a: Point; b: Point }
  | { kind: 'move'; id: string; start: Point; a: Point; b: Point }
  | { kind: 'end'; id: string; end: 'a' | 'b' }

/**
 * Drawing and editing layer on top of the video. Coordinates are normalized
 * (0–1), so the overlay works at any display size.
 *
 * Lines render as SVG with a non-scaling stroke, so stroke widths stay in
 * screen pixels. Endpoint handles are HTML so they stay circular.
 */
export function OverlayCanvas() {
  const tool = useAnnotations((s) => s.tool)
  const lines = useAnnotations((s) => s.lines)
  const selectedId = useAnnotations((s) => s.selectedId)
  const drawColor = useAnnotations((s) => s.drawColor)
  const select = useAnnotations((s) => s.select)
  const addLine = useAnnotations((s) => s.addLine)
  const updateLine = useAnnotations((s) => s.updateLine)

  // The in-progress line, shown while drawing.
  const [draft, setDraft] = useState<{ a: Point; b: Point } | null>(null)
  // A ref, not state, so pointer handlers always see the latest drag.
  const dragRef = useRef<Drag | null>(null)

  const pointerPoint = (e: PointerEvent<HTMLDivElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: clamp01((e.clientX - rect.left) / rect.width),
      y: clamp01((e.clientY - rect.top) / rect.height),
    }
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const target = e.target as Element
    const hit = target.closest<HTMLElement>('[data-line-id]')
    const handle = target.closest<HTMLElement>('[data-handle]')
    const p = pointerPoint(e)

    if (tool === 'line') {
      dragRef.current = { kind: 'draw', a: p, b: p }
      setDraft({ a: p, b: p })
    } else if (hit?.dataset.lineId) {
      const id = hit.dataset.lineId
      const line = lines.find((l) => l.id === id)
      if (!line) return
      select(id)
      const end = handle?.dataset.handle
      dragRef.current =
        end === 'a' || end === 'b'
          ? { kind: 'end', id, end }
          : { kind: 'move', id, start: p, a: line.a, b: line.b }
    } else {
      select(null)
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const p = pointerPoint(e)

    if (drag.kind === 'draw') {
      drag.b = p
      setDraft({ a: drag.a, b: p })
    } else if (drag.kind === 'end') {
      updateLine(drag.id, drag.end === 'a' ? { a: p } : { b: p })
    } else {
      const t = clampTranslation(drag.a, drag.b, p.x - drag.start.x, p.y - drag.start.y)
      updateLine(drag.id, {
        a: shift(drag.a, t.dx, t.dy),
        b: shift(drag.b, t.dx, t.dy),
      })
    }
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const finished = dragRef.current
    dragRef.current = null
    if (finished?.kind !== 'draw') return

    setDraft(null)
    const rect = e.currentTarget.getBoundingClientRect()
    const pixels = Math.hypot(
      (finished.b.x - finished.a.x) * rect.width,
      (finished.b.y - finished.a.y) * rect.height,
    )
    if (pixels >= MIN_DRAW_PIXELS) addLine(finished.a, finished.b)
  }

  const onPointerCancel = () => {
    dragRef.current = null
    setDraft(null)
  }

  const selected = lines.find((l) => l.id === selectedId)

  return (
    <div
      className={`overlay overlay--${tool}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <svg className="overlay__lines" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
        {lines.map((line) => (
          <g key={line.id}>
            <line
              className="overlay__hit"
              data-line-id={line.id}
              x1={line.a.x}
              y1={line.a.y}
              x2={line.b.x}
              y2={line.b.y}
              strokeWidth={16}
              vectorEffect="non-scaling-stroke"
            />
            <line
              className="overlay__stroke"
              stroke={line.color}
              strokeWidth={line.id === selectedId ? 4 : 2}
              x1={line.a.x}
              y1={line.a.y}
              x2={line.b.x}
              y2={line.b.y}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
        {draft && (
          <line
            className="overlay__stroke"
            stroke={drawColor}
            strokeWidth={2}
            x1={draft.a.x}
            y1={draft.a.y}
            x2={draft.b.x}
            y2={draft.b.y}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {lines
        .filter((line) => line.label)
        .map((line) => (
          <div
            key={line.id}
            className="overlay__label"
            style={{
              left: `${((line.a.x + line.b.x) / 2) * 100}%`,
              top: `${((line.a.y + line.b.y) / 2) * 100}%`,
              background: line.color,
            }}
          >
            {line.label}
          </div>
        ))}

      {selected &&
        tool === 'select' &&
        (['a', 'b'] as const).map((end) => (
          <div
            key={end}
            className="overlay__handle"
            data-line-id={selected.id}
            data-handle={end}
            style={{ left: `${selected[end].x * 100}%`, top: `${selected[end].y * 100}%` }}
          />
        ))}
    </div>
  )
}
