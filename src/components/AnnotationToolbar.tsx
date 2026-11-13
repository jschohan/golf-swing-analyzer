import type { MouseEvent } from 'react'
import { LINE_COLORS, useAnnotations } from '../store/annotations'

// Keep clicks from moving focus so Space keeps meaning play/pause.
const keepFocus = (e: MouseEvent) => e.preventDefault()

export function AnnotationToolbar() {
  const tool = useAnnotations((s) => s.tool)
  const lines = useAnnotations((s) => s.lines)
  const selectedId = useAnnotations((s) => s.selectedId)
  const drawColor = useAnnotations((s) => s.drawColor)
  const setTool = useAnnotations((s) => s.setTool)
  const setColor = useAnnotations((s) => s.setColor)
  const updateLine = useAnnotations((s) => s.updateLine)
  const deleteSelected = useAnnotations((s) => s.deleteSelected)

  const selected = lines.find((l) => l.id === selectedId)
  const activeColor = selected?.color ?? drawColor

  return (
    <div className="toolbar">
      <div className="toolbar__group">
        <button
          type="button"
          className="button"
          aria-pressed={tool === 'select'}
          onMouseDown={keepFocus}
          onClick={() => setTool('select')}
          title="Select and move (V)"
        >
          Select
        </button>
        <button
          type="button"
          className="button"
          aria-pressed={tool === 'line'}
          onMouseDown={keepFocus}
          onClick={() => setTool('line')}
          title="Draw a line (L)"
        >
          Line
        </button>
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
          disabled={!selected}
          value={selected?.label ?? ''}
          placeholder={selected ? 'e.g. Spine' : 'Select a line'}
          onChange={(e) => selected && updateLine(selected.id, { label: e.target.value })}
        />
      </label>

      <button
        type="button"
        className="button"
        disabled={!selected}
        onMouseDown={keepFocus}
        onClick={deleteSelected}
        title="Delete selected line (Delete)"
      >
        Delete
      </button>
    </div>
  )
}
