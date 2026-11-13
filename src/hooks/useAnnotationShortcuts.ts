import { useEffect } from 'react'
import { useAnnotations } from '../store/annotations'
import { isEditingTarget } from './usePlaybackShortcuts'

/**
 * V: select tool
 * L: line tool
 * Escape: clear selection and return to the select tool
 * Delete / Backspace: delete the selected line
 */
export function useAnnotationShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isEditingTarget(e.target)) return
      const { setTool, select, deleteSelected, selectedId } = useAnnotations.getState()

      switch (e.key.toLowerCase()) {
        case 'v':
          setTool('select')
          break
        case 'l':
          setTool('line')
          break
        case 'escape':
          select(null)
          setTool('select')
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
