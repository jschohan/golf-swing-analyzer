import { useRef, useState, type PointerEvent } from 'react'
import { measureAngle, type Angle } from '../lib/annotations'
import {
  arcPath,
  bisectorPoint,
  clampTranslation,
  distance,
  formatDegrees,
  toPixels,
  type AngleMeasure,
  type Point,
} from '../lib/geometry'
import { useAnnotations } from '../store/annotations'
import { usePlayback } from '../store/playback'

// Drags shorter than this (in screen pixels) count as accidental clicks.
const MIN_DRAW_PIXELS = 6
// Arc radius and label offset, as fractions of the frame's shorter side.
const ARC_RADIUS = 0.07
const LABEL_GAP = 0.05
const LINE_ANGLE_COLOR = '#ffffff'

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const shift = (p: Point, dx: number, dy: number): Point => ({ x: p.x + dx, y: p.y + dy })

type AngleKey = 'p1' | 'vertex' | 'p2'
const isAngleKey = (key: string | undefined): key is AngleKey =>
  key === 'p1' || key === 'vertex' || key === 'p2'

type Drag =
  | { kind: 'draw'; a: Point; b: Point }
  | { kind: 'move'; id: string; start: Point; a: Point; b: Point }
  | { kind: 'end'; id: string; end: 'a' | 'b' }
  | { kind: 'angleMove'; id: string; start: Point; p1: Point; vertex: Point; p2: Point }
  | { kind: 'anglePoint'; id: string; key: AngleKey }

// Everything needed to draw one angle, in video pixels.
type AngleView = {
  angle: Angle
  measure: AngleMeasure
  labelAt: Point
  arc: string | null
  extensions: { id: string; from: Point; to: Point; color: string }[]
}

type StrokeProps = {
  a: Point
  b: Point
  color: string
  width: number
  dashed?: boolean
  // Data attributes for a wide invisible stroke that makes the line easy to grab.
  hit?: Record<string, string>
}

function Stroke({ a, b, color, width, dashed, hit }: StrokeProps) {
  const coords = { x1: a.x, y1: a.y, x2: b.x, y2: b.y }
  return (
    <>
      {hit && (
        <line
          className="overlay__hit"
          {...hit}
          {...coords}
          strokeWidth={16}
          vectorEffect="non-scaling-stroke"
        />
      )}
      <line
        className="overlay__stroke"
        {...coords}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? '6 6' : undefined}
        vectorEffect="non-scaling-stroke"
      />
    </>
  )
}

/**
 * Drawing and editing layer on top of the video. Shapes are stored in
 * normalized (0–1) coordinates, so the overlay works at any display size.
 *
 * The SVG's coordinate system is the video's own pixels, which keeps arcs
 * circular and angles true. Strokes are non-scaling, so their widths stay in
 * screen pixels. Handles and labels are HTML so they don't scale either.
 */
export function OverlayCanvas() {
  const tool = useAnnotations((s) => s.tool)
  const lines = useAnnotations((s) => s.lines)
  const angles = useAnnotations((s) => s.angles)
  const selectedId = useAnnotations((s) => s.selectedId)
  const drawColor = useAnnotations((s) => s.drawColor)
  const pendingLineId = useAnnotations((s) => s.pendingLineId)
  const pendingPoints = useAnnotations((s) => s.pendingPoints)
  const select = useAnnotations((s) => s.select)
  const addLine = useAnnotations((s) => s.addLine)
  const updateLine = useAnnotations((s) => s.updateLine)
  const pickLineForAngle = useAnnotations((s) => s.pickLineForAngle)
  const addPendingPoint = useAnnotations((s) => s.addPendingPoint)
  const cancelPending = useAnnotations((s) => s.cancelPending)
  const updatePointAngle = useAnnotations((s) => s.updatePointAngle)
  const videoWidth = usePlayback((s) => s.videoWidth)
  const videoHeight = usePlayback((s) => s.videoHeight)

  // The in-progress line, shown while drawing.
  const [draft, setDraft] = useState<{ a: Point; b: Point } | null>(null)
  // Pointer position, for previewing a 3-point angle as it is placed.
  const [cursor, setCursor] = useState<Point | null>(null)
  // A ref, not state, so pointer handlers always see the latest drag.
  const dragRef = useRef<Drag | null>(null)

  const size = { width: videoWidth || 16, height: videoHeight || 9 }
  const shortSide = Math.min(size.width, size.height)
  const px = (p: Point) => toPixels(p, size)
  const position = (pixel: Point) => ({
    left: `${(pixel.x / size.width) * 100}%`,
    top: `${(pixel.y / size.height) * 100}%`,
  })

  const pointerPoint = (e: PointerEvent<HTMLDivElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: clamp01((e.clientX - rect.left) / rect.width),
      y: clamp01((e.clientY - rect.top) / rect.height),
    }
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const target = e.target as Element
    const lineId = target.closest<HTMLElement>('[data-line-id]')?.dataset.lineId
    const angleId = target.closest<HTMLElement>('[data-angle-id]')?.dataset.angleId
    const handle = target.closest<HTMLElement>('[data-handle]')?.dataset.handle
    const p = pointerPoint(e)

    if (tool === 'line') {
      dragRef.current = { kind: 'draw', a: p, b: p }
      setDraft({ a: p, b: p })
    } else if (tool === 'pointAngle') {
      addPendingPoint(p)
      setCursor(p)
      return
    } else if (tool === 'lineAngle') {
      if (lineId) pickLineForAngle(lineId)
      else cancelPending()
      return
    } else if (lineId) {
      const line = lines.find((l) => l.id === lineId)
      if (!line) return
      select(lineId)
      dragRef.current =
        handle === 'a' || handle === 'b'
          ? { kind: 'end', id: lineId, end: handle }
          : { kind: 'move', id: lineId, start: p, a: line.a, b: line.b }
    } else if (angleId) {
      const angle = angles.find((a) => a.id === angleId)
      if (!angle) return
      select(angleId)
      // Angles between lines follow their lines; only 3-point angles can be dragged.
      if (angle.kind !== 'points') return
      dragRef.current = isAngleKey(handle)
        ? { kind: 'anglePoint', id: angleId, key: handle }
        : {
            kind: 'angleMove',
            id: angleId,
            start: p,
            p1: angle.p1,
            vertex: angle.vertex,
            p2: angle.p2,
          }
    } else {
      select(null)
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = pointerPoint(e)
    if (tool === 'pointAngle' && pendingPoints.length > 0) setCursor(p)

    const drag = dragRef.current
    if (!drag) return

    switch (drag.kind) {
      case 'draw':
        drag.b = p
        setDraft({ a: drag.a, b: p })
        break
      case 'end':
        updateLine(drag.id, drag.end === 'a' ? { a: p } : { b: p })
        break
      case 'move': {
        const t = clampTranslation([drag.a, drag.b], p.x - drag.start.x, p.y - drag.start.y)
        updateLine(drag.id, { a: shift(drag.a, t.dx, t.dy), b: shift(drag.b, t.dx, t.dy) })
        break
      }
      case 'anglePoint':
        updatePointAngle(
          drag.id,
          drag.key === 'p1' ? { p1: p } : drag.key === 'vertex' ? { vertex: p } : { p2: p },
        )
        break
      case 'angleMove': {
        const t = clampTranslation(
          [drag.p1, drag.vertex, drag.p2],
          p.x - drag.start.x,
          p.y - drag.start.y,
        )
        updatePointAngle(drag.id, {
          p1: shift(drag.p1, t.dx, t.dy),
          vertex: shift(drag.vertex, t.dx, t.dy),
          p2: shift(drag.p2, t.dx, t.dy),
        })
        break
      }
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

  const angleViews = angles.flatMap((angle): AngleView[] => {
    const measure = measureAngle(angle, lines, size)
    if (!measure) return []
    const { vertex, p1, p2 } = measure

    const inFrame =
      vertex !== null &&
      vertex.x >= 0 &&
      vertex.x <= size.width &&
      vertex.y >= 0 &&
      vertex.y <= size.height
    if (!vertex || !inFrame) {
      // The lines meet off screen (or never): show the value between them, with no arc.
      const labelAt = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
      return [{ angle, measure, labelAt, arc: null, extensions: [] }]
    }

    const radius = Math.min(
      ARC_RADIUS * shortSide,
      0.45 * Math.min(distance(vertex, p1), distance(vertex, p2)),
    )
    // Dashed extensions from each line to the point where they meet.
    const extensions =
      angle.kind === 'lines'
        ? angle.lineIds.flatMap((id, i) => {
            const line = lines.find((l) => l.id === id)
            if (!line) return []
            const far = i === 0 ? p1 : p2
            const a = px(line.a)
            const b = px(line.b)
            const near = distance(vertex, a) > distance(vertex, b) ? b : a
            // Both endpoints on the same side of the vertex: the line stops short of it.
            const stopsShort =
              (near.x - vertex.x) * (far.x - vertex.x) + (near.y - vertex.y) * (far.y - vertex.y) > 0
            return stopsShort ? [{ id, from: vertex, to: near, color: line.color }] : []
          })
        : []

    return [
      {
        angle,
        measure,
        labelAt: bisectorPoint(vertex, p1, p2, radius + LABEL_GAP * shortSide),
        arc: arcPath(vertex, p1, p2, radius),
        extensions,
      },
    ]
  })

  const selectedLine = lines.find((l) => l.id === selectedId)
  const selectedAngle = angles.find((a) => a.id === selectedId)
  const handles =
    tool !== 'select'
      ? []
      : selectedLine
        ? (['a', 'b'] as const).map((key) => ({
            key,
            point: selectedLine[key],
            owner: { 'data-line-id': selectedLine.id },
          }))
        : selectedAngle?.kind === 'points'
          ? (['p1', 'vertex', 'p2'] as const).map((key) => ({
              key,
              point: selectedAngle[key],
              owner: { 'data-angle-id': selectedAngle.id },
            }))
          : []

  const preview = pendingPoints.length > 0 && cursor ? [...pendingPoints, cursor] : []

  return (
    <div
      className={`overlay overlay--${tool}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <svg
        className="overlay__lines"
        viewBox={`0 0 ${size.width} ${size.height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {lines.map((line) => (
          <Stroke
            key={line.id}
            a={px(line.a)}
            b={px(line.b)}
            color={line.color}
            width={line.id === selectedId || line.id === pendingLineId ? 4 : 2}
            hit={{ 'data-line-id': line.id }}
          />
        ))}

        {angleViews.map(({ angle, measure, arc, extensions }) => {
          const color = angle.kind === 'points' ? angle.color : LINE_ANGLE_COLOR
          const width = angle.id === selectedId ? 4 : 2
          return (
            <g key={angle.id}>
              {angle.kind === 'points' && measure.vertex && (
                <>
                  <Stroke
                    a={measure.vertex}
                    b={measure.p1}
                    color={color}
                    width={width}
                    hit={{ 'data-angle-id': angle.id }}
                  />
                  <Stroke
                    a={measure.vertex}
                    b={measure.p2}
                    color={color}
                    width={width}
                    hit={{ 'data-angle-id': angle.id }}
                  />
                </>
              )}
              {extensions.map((ext) => (
                <Stroke key={ext.id} a={ext.from} b={ext.to} color={ext.color} width={1} dashed />
              ))}
              {arc && (
                <path
                  className="overlay__stroke"
                  d={arc}
                  stroke={color}
                  strokeWidth={width}
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </g>
          )
        })}

        {draft && <Stroke a={px(draft.a)} b={px(draft.b)} color={drawColor} width={2} />}
        {preview.slice(1).map((point, i) => (
          <Stroke key={i} a={px(preview[i])} b={px(point)} color={drawColor} width={2} />
        ))}
      </svg>

      {lines
        .filter((line) => line.label)
        .map((line) => (
          <div
            key={line.id}
            className="overlay__label"
            style={{
              ...position(px({ x: (line.a.x + line.b.x) / 2, y: (line.a.y + line.b.y) / 2 })),
              background: line.color,
            }}
          >
            {line.label}
          </div>
        ))}

      {angleViews.map(({ angle, measure, labelAt }) => (
        <div
          key={angle.id}
          className={`overlay__angle${angle.id === selectedId ? ' overlay__angle--selected' : ''}`}
          data-angle-id={angle.id}
          // Keep the label on screen when the angle sits at the edge of the frame.
          style={position({
            x: Math.min(size.width * 0.96, Math.max(size.width * 0.04, labelAt.x)),
            y: Math.min(size.height * 0.96, Math.max(size.height * 0.04, labelAt.y)),
          })}
        >
          {formatDegrees(measure.degrees)}
        </div>
      ))}

      {pendingPoints.map((point, i) => (
        <div key={i} className="overlay__handle overlay__handle--placed" style={position(px(point))} />
      ))}

      {handles.map(({ key, point, owner }) => (
        <div
          key={key}
          className="overlay__handle"
          data-handle={key}
          {...owner}
          style={position(px(point))}
        />
      ))}
    </div>
  )
}
