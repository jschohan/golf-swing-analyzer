import { create } from 'zustand'
import { isVideoFile, stepTime } from '../lib/video'

type PlaybackState = {
  // Source
  videoUrl: string | null
  fileName: string | null
  error: string | null

  // Reported by the <video> element
  element: HTMLVideoElement | null
  duration: number
  videoWidth: number
  videoHeight: number
  currentTime: number
  isPlaying: boolean

  // User settings
  fps: number
  playbackRate: number
  loop: boolean

  loadFile: (file: File) => void
  unload: () => void
  setError: (error: string | null) => void
  setElement: (element: HTMLVideoElement | null) => void
  setMetadata: (meta: { duration: number; videoWidth: number; videoHeight: number }) => void
  setCurrentTime: (time: number) => void
  setIsPlaying: (isPlaying: boolean) => void

  togglePlay: () => void
  seek: (time: number) => void
  stepFrames: (delta: number) => void
  setFps: (fps: number) => void
  setPlaybackRate: (rate: number) => void
  setLoop: (loop: boolean) => void
}

const initialSource = {
  videoUrl: null,
  fileName: null,
  error: null,
  duration: 0,
  videoWidth: 0,
  videoHeight: 0,
  currentTime: 0,
  isPlaying: false,
}

export const usePlayback = create<PlaybackState>()((set, get) => ({
  ...initialSource,
  element: null,
  fps: 30,
  playbackRate: 1,
  loop: false,

  loadFile: (file) => {
    if (!isVideoFile(file)) {
      set({ error: `"${file.name}" isn't a video file.` })
      return
    }
    const previous = get().videoUrl
    if (previous) URL.revokeObjectURL(previous)
    set({ ...initialSource, videoUrl: URL.createObjectURL(file), fileName: file.name })
  },

  unload: () => {
    const previous = get().videoUrl
    if (previous) URL.revokeObjectURL(previous)
    set(initialSource)
  },

  setError: (error) => set({ error }),
  setElement: (element) => set({ element }),
  setMetadata: (meta) => set(meta),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  togglePlay: () => {
    const { element } = get()
    if (!element) return
    if (element.paused) {
      // play() rejects if interrupted (e.g. by a pause); that's not an error worth surfacing.
      element.play().catch(() => {})
    } else {
      element.pause()
    }
  },

  seek: (time) => {
    const { element, duration } = get()
    if (!element) return
    const clamped = Math.min(duration, Math.max(0, time))
    element.currentTime = clamped
    set({ currentTime: clamped })
  },

  stepFrames: (delta) => {
    const { element, fps, duration, seek } = get()
    if (!element) return
    element.pause()
    seek(stepTime(element.currentTime, delta, fps, duration))
  },

  setFps: (fps) => set({ fps }),

  setPlaybackRate: (playbackRate) => {
    const { element } = get()
    if (element) element.playbackRate = playbackRate
    set({ playbackRate })
  },

  setLoop: (loop) => set({ loop }),
}))
