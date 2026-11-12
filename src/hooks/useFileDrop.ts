import { useEffect, useState } from 'react'

const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes('Files') ?? false

/**
 * Accepts files dropped anywhere on the window and reports whether a file is
 * being dragged over it. Also stops the browser from navigating to a file
 * dropped outside a drop target.
 */
export function useFileDrop(onFile: (file: File) => void): boolean {
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    // dragenter/dragleave fire for every child element crossed, so count them.
    let depth = 0

    const onDragEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return
      depth++
      setIsDragging(true)
    }
    const onDragLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return
      depth = Math.max(0, depth - 1)
      if (depth === 0) setIsDragging(false)
    }
    const onDragOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault()
    }
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth = 0
      setIsDragging(false)
      const file = e.dataTransfer?.files[0]
      if (file) onFile(file)
    }

    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [onFile])

  return isDragging
}
