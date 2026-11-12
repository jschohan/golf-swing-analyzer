import type { ChangeEvent, MouseEvent } from 'react'
import { FPS_OPTIONS, SPEED_OPTIONS, formatTime, timeToFrame } from '../lib/video'
import { usePlayback } from '../store/playback'

// Keep buttons from taking focus on click, so Space keeps meaning play/pause
// instead of re-pressing whichever button was clicked last.
const keepFocus = (e: MouseEvent) => e.preventDefault()

// Likewise, return focus to the page after picking from a dropdown.
const blurAfter =
  <T,>(fn: (value: T) => void, parse: (raw: string) => T) =>
  (e: ChangeEvent<HTMLSelectElement>) => {
    fn(parse(e.target.value))
    e.target.blur()
  }

export function PlaybackControls() {
  const duration = usePlayback((s) => s.duration)
  const currentTime = usePlayback((s) => s.currentTime)
  const isPlaying = usePlayback((s) => s.isPlaying)
  const fps = usePlayback((s) => s.fps)
  const playbackRate = usePlayback((s) => s.playbackRate)
  const loop = usePlayback((s) => s.loop)
  const togglePlay = usePlayback((s) => s.togglePlay)
  const seek = usePlayback((s) => s.seek)
  const stepFrames = usePlayback((s) => s.stepFrames)
  const setFps = usePlayback((s) => s.setFps)
  const setPlaybackRate = usePlayback((s) => s.setPlaybackRate)
  const setLoop = usePlayback((s) => s.setLoop)

  const ready = duration > 0
  const frame = timeToFrame(currentTime, fps) + 1
  const totalFrames = Math.max(1, timeToFrame(duration, fps))

  return (
    <div className="controls">
      <input
        type="range"
        className="scrubber"
        aria-label="Seek"
        min={0}
        max={duration || 0}
        step={1 / fps}
        value={currentTime}
        disabled={!ready}
        onChange={(e) => seek(Number(e.target.value))}
      />

      <div className="controls__row">
        <div className="controls__group">
          <button
            type="button"
            className="button"
            onMouseDown={keepFocus}
            onClick={() => stepFrames(-1)}
            disabled={!ready}
            title="Previous frame (←, Shift+← for 10)"
          >
            ◀ Frame
          </button>
          <button
            type="button"
            className="button button--primary controls__play"
            onMouseDown={keepFocus}
            onClick={togglePlay}
            disabled={!ready}
            title="Play/pause (Space)"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            className="button"
            onMouseDown={keepFocus}
            onClick={() => stepFrames(1)}
            disabled={!ready}
            title="Next frame (→, Shift+→ for 10)"
          >
            Frame ▶
          </button>
        </div>

        <div className="controls__readout" aria-live="off">
          <span>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <span>
            Frame {Math.min(frame, totalFrames)} / {totalFrames}
          </span>
        </div>

        <div className="controls__group">
          <label className="field">
            Speed
            <select value={playbackRate} onChange={blurAfter(setPlaybackRate, Number)}>
              {SPEED_OPTIONS.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}×
                </option>
              ))}
            </select>
          </label>
          <label className="field" title="Frame rate the video was recorded at">
            FPS
            <select value={fps} onChange={blurAfter(setFps, Number)}>
              {FPS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <input
              type="checkbox"
              checked={loop}
              onChange={(e) => {
                setLoop(e.target.checked)
                e.target.blur()
              }}
            />
            Loop
          </label>
        </div>
      </div>
    </div>
  )
}
