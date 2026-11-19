import type { MouseEvent } from 'react'
import { LINE_COLORS, useAnnotations, type Tool } from '../store/annotations'

// Keep clicks from moving focus so Space keeps meaning play/pause.
const keepFocus = (e: MouseEvent) => e.preventDefault()

const TOOLS: { tool: Tool; label: string; title: string }[] = [
  { tool: 'select', label: 'Select', title: 'Select and move (V)' },
  { tool: 'line', label: 'Line', title: 'Draw a line (L)' },
  { tool: 'lineAngle', label: 'Line angle', title: 'Measure the angle between two lines (A)' },
  { tool: 'pointAngle', label: '3-point angle', title: 'Measure an angle from three points (P)' },
]

export function AnnotationToolbar() {
  const tool = useAnnotations((s) => s.tool)
  const lines = useAnnotations((s) => s.lines)
  const angles = useAnnotations((s) => s.angles)
  const selectedId = useAnnotations((s) => s.selectedId)
  const drawColor = useAnnotations((s) => s.drawColor)
  const pendingLineId = useAnnotations((s) => s.pendingLineId)
  const pendingPoints = useAnnotations((s) => s.pendingPoints)
  const setTool = useAnnotations((s) => s.setTool)
  const setColor = useAnnotations((s) => s.setColor)
  const updateLine = useAnnotations((s) => s.updateLine)
  const deleteSelected = useAnnotations((s) => s.deleteSelected)

  const selectedLine = lines.find((l) => l.id === selectedId)
  const selectedAngle = angles.find((a) => a.id === selectedId)
  const activeColor =
    selectedLine?.color ?? (selectedAngle?.kind === 'points' ? selectedAngle.color : drawColor)

  // Tells the user what the next click will do.
  let hint = ''
  if (tool === 'lineAngle') {
    hint =
      lines.length < 2
        ? 'Draw two lines first.'
        : pendingLineId
          ? 'Click the second line.'
          : 'Click the first line.'
  } else if (tool === 'pointAngle') {
    hint = [
      'Click the end of the first arm.',
      'Click the corner of the angle.',
      'Click the end of the second arm.',
    ][pendingPoints.length]
  }

  return (
    <div className="toolbar">
      <div className="toolbar__group">
        {TOOLS.map(({ tool: option, label, title }) => (
          <button
            key={option}
            type="button"
            className="button"
            aria-pressed={tool === option}
            onMouseDown={keepFocus}
            onClick={() => setTool(option)}
            title={title}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="toolbar__group" role="group" aria-label="Line color">
        {LINE_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className="swatch"
            style={{ background: color }}
            aria-label={`Color ${color}`}
            aria-pressed={activeColor === color}
            onMouseDown={keepFocus}
            onClick={() => setColor(color)}
          />
        ))}
      </div>

      <label className="field">
        Label
        <input
          type="text"
          maxLength={24}
          disabled={!selectedLine}
          value={selectedLine?.label ?? ''}
          placeholder={selectedLine ? 'e.g. Spine' : 'Select a line'}
          onChange={(e) => selectedLine && updateLine(selectedLine.id, { label: e.target.value })}
        />
      </label>

      <button
        type="button"
        className="button"
        disabled={!selectedId}
        onMouseDown={keepFocus}
        onClick={deleteSelected}
        title="Delete the selected line or angle (Delete)"
      >
        Delete
      </button>

      {hint && (
        <span className="toolbar__hint" role="status">
          {hint}
        </span>
      )}
    </div>
  )
}
