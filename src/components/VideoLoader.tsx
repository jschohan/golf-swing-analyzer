import { useRef, type ChangeEvent } from 'react'
import { usePlayback } from '../store/playback'

const ACCEPT = 'video/*,.mov,.m4v'

function useFilePicker() {
  const inputRef = useRef<HTMLInputElement>(null)
  const loadFile = usePlayback((s) => s.loadFile)

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
    // Reset so picking the same file again still fires a change.
    e.target.value = ''
  }

  const input = <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={onChange} />
  return { input, open: () => inputRef.current?.click() }
}

/** Empty state: prompts for a video by drag-and-drop or file picker. */
export function VideoLoader({ isDragging }: { isDragging: boolean }) {
  const { input, open } = useFilePicker()

  return (
    <div className={`drop-zone${isDragging ? ' drop-zone--active' : ''}`}>
      <p className="drop-zone__title">Drop a swing video here</p>
      <p className="drop-zone__hint">MP4, MOV or WebM. Your video stays on this device.</p>
      <button type="button" className="button button--primary" onClick={open}>
        Choose a file
      </button>
      {input}
    </div>
  )
}

/** Header button to replace the loaded video. */
export function OpenVideoButton() {
  const { input, open } = useFilePicker()

  return (
    <>
      <button type="button" className="button" onClick={open}>
        Open another video
      </button>
      {input}
    </>
  )
}
