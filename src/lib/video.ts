export const FPS_OPTIONS = [24, 25, 30, 50, 60, 120, 240] as const
export const SPEED_OPTIONS = [0.1, 0.25, 0.5, 1] as const

// Tolerance in frames, so a time at a frame's start (as reported by
// requestVideoFrameCallback, subject to float error) resolves to that frame.
const FRAME_TOLERANCE = 1e-3

/** Zero-based index of the frame displayed at `time`. */
export function timeToFrame(time: number, fps: number): number {
  return Math.floor(time * fps + FRAME_TOLERANCE)
}

/**
 * Time to seek to in order to display `frame`. Targets the middle of the
 * frame rather than its start, since browsers round seek times
 * inconsistently and a boundary seek can land on the previous frame.
 */
export function frameToTime(frame: number, fps: number): number {
  return (frame + 0.5) / fps
}

/** Seek time for the frame `delta` frames away from `time`, clamped to the video. */
export function stepTime(time: number, delta: number, fps: number, duration: number): number {
  const lastFrame = Math.max(0, timeToFrame(duration, fps) - 1)
  const target = Math.min(lastFrame, Math.max(0, timeToFrame(time, fps) + delta))
  return Math.min(duration, frameToTime(target, fps))
}

/** Formats seconds as m:ss.mmm. */
export function formatTime(time: number): string {
  if (!Number.isFinite(time)) return '0:00.000'
  const minutes = Math.floor(time / 60)
  const seconds = (time - minutes * 60).toFixed(3).padStart(6, '0')
  return `${minutes}:${seconds}`
}

const VIDEO_EXTENSIONS = /\.(mp4|m4v|mov|webm|ogv)$/i

/** Whether a file looks like a video. Some browsers leave `type` empty for .mov files. */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || VIDEO_EXTENSIONS.test(file.name)
}
