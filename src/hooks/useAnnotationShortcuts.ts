import { useEffect } from 'react'
import { useAnnotations } from '../store/annotations'
import { isEditingTarget } from './usePlaybackShortcuts'

/**
 * V: select tool
 * L: line tool
 * A: line angle tool
 * P: 3-point angle tool
 * Escape: cancel a half-placed angle, otherwise clear the selection and
 *   return to the select tool
 * Delete / Backspace: delete the selected line
 */
export function useAnnotationShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isEditingTarget(e.target)) return
      const { setTool, select, deleteSelected, cancelPending, selectedId, pendingLineId, pendingPoints } =
        useAnnotations.getState()

      switch (e.key.toLowerCase()) {
        case 'v':
          setTool('select')
          break
        case 'l':
          setTool('line')
          break
        case 'a':
          setTool('lineAngle')
          break
        case 'p':
          setTool('pointAngle')
          break
        case 'escape':
          if (pendingLineId || pendingPoints.length > 0) {
            cancelPending()
          } else {
            select(null)
            setTool('select')
          }
          break
        case 'delete':
        case 'backspace':
          if (!selectedId) return
          deleteSelected()
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
