import { useEffect } from 'react'
import { usePlayback } from '../store/playback'

const LARGE_STEP = 10

/** Whether the key event belongs to a control that needs the keys itself. */
function isEditingTarget(target: EventTarget | null): boolean {
  if (target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) return true
  // Range inputs (the scrubber) are fine: we handle their arrow keys as frame steps.
  return target instanceof HTMLInputElement && target.type !== 'range'
}

/**
 * Space / K: play or pause
 * ← / →: step one frame
 * Shift + ← / →: step ten frames
 */
export function usePlaybackShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isEditingTarget(e.target)) return
      const { element, togglePlay, stepFrames } = usePlayback.getState()
      if (!element) return

      const step = e.shiftKey ? LARGE_STEP : 1
      switch (e.key) {
        case ' ':
        case 'k':
          togglePlay()
          break
        case 'ArrowLeft':
          stepFrames(-step)
          break
        case 'ArrowRight':
          stepFrames(step)
          break
        default:
          return
      }
      e.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
