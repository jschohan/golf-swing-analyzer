import { lineName, measureAngle } from '../lib/annotations'
import {
  angleFromHorizontal,
  angleFromVertical,
  formatDegrees,
  toPixels,
  type AngleMeasure,
} from '../lib/geometry'
import { useAnnotations } from '../store/annotations'
import { usePlayback } from '../store/playback'

type Row = { id: string; name: string; measure: AngleMeasure; other: number | null }

/** Lists every measured angle, plus the tilt of the selected line. */
export function AnglePanel() {
  const lines = useAnnotations((s) => s.lines)
  const angles = useAnnotations((s) => s.angles)
  const selectedId = useAnnotations((s) => s.selectedId)
  const select = useAnnotations((s) => s.select)
  const videoWidth = usePlayback((s) => s.videoWidth)
  const videoHeight = usePlayback((s) => s.videoHeight)

  const size = { width: videoWidth || 16, height: videoHeight || 9 }
  const selectedLine = lines.find((l) => l.id === selectedId)

  let pointCount = 0
  const rows = angles.flatMap((angle): Row[] => {
    const measure = measureAngle(angle, lines, size)
    if (!measure) return []
    if (angle.kind === 'points') {
      return [{ id: angle.id, name: `3-point angle ${++pointCount}`, measure, other: null }]
    }
    const names = angle.lineIds.map((id) => {
      const line = lines.find((l) => l.id === id)
      return line ? lineName(line, lines) : ''
    })
    // Two crossing lines form two angles; show the second one as well.
    return [{ id: angle.id, name: names.join(' ∠ '), measure, other: 180 - measure.degrees }]
  })

  return (
    <section className="angles" aria-label="Angles">
      <h2 className="angles__title">Angles</h2>

      {rows.length === 0 && !selectedLine && (
        <p className="angles__empty">
          No angles yet. Use <strong>Line angle</strong> to measure between two lines, or{' '}
          <strong>3-point angle</strong> to click three points.
        </p>
      )}

      {rows.length > 0 && (
        <ul className="angles__list">
          {rows.map(({ id, name, measure, other }) => (
            <li key={id}>
              <button
                type="button"
                className="angles__row"
                aria-pressed={id === selectedId}
                // Keep focus on the page so Space keeps meaning play/pause.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(id)}
              >
                <span className="angles__name">{name}</span>
                <span className="angles__value">{formatDegrees(measure.degrees)}</span>
                {other !== null && (
                  <span className="angles__other">other side {formatDegrees(other)}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedLine && (
        <p className="angles__tilt">
          <span className="angles__name">{lineName(selectedLine, lines)}</span>
          <span>
            {formatDegrees(
              angleFromHorizontal(toPixels(selectedLine.a, size), toPixels(selectedLine.b, size)),
            )}{' '}
            from horizontal
          </span>
          <span>
            {formatDegrees(
              angleFromVertical(toPixels(selectedLine.a, size), toPixels(selectedLine.b, size)),
            )}{' '}
            from vertical
          </span>
        </p>
      )}
    </section>
  )
}
