import { describe, expect, it } from 'vitest'
import { formatTime, frameToTime, isVideoFile, stepTime, timeToFrame } from './video'

describe('timeToFrame / frameToTime', () => {
  it('round-trips frame indices', () => {
    for (const fps of [24, 30, 60, 240]) {
      for (const frame of [0, 1, 17, 299]) {
        expect(timeToFrame(frameToTime(frame, fps), fps)).toBe(frame)
      }
    }
  })
  it('treats an exact boundary as the frame that starts there', () => {
    expect(timeToFrame(0.1, 30)).toBe(3)
  })
})

describe('stepTime', () => {
  const fps = 30
  const duration = 2 // 60 frames: 0–59

  it('steps forward and back by whole frames', () => {
    const t = frameToTime(10, fps)
    expect(timeToFrame(stepTime(t, 1, fps, duration), fps)).toBe(11)
    expect(timeToFrame(stepTime(t, -1, fps, duration), fps)).toBe(9)
    expect(timeToFrame(stepTime(t, 5, fps, duration), fps)).toBe(15)
  })
  it('clamps at the first frame', () => {
    expect(timeToFrame(stepTime(0, -1, fps, duration), fps)).toBe(0)
  })
  it('clamps at the last frame', () => {
    expect(timeToFrame(stepTime(duration, 1, fps, duration), fps)).toBe(59)
  })
})

describe('formatTime', () => {
  it('formats minutes, seconds and milliseconds', () => {
    expect(formatTime(0)).toBe('0:00.000')
    expect(formatTime(5.25)).toBe('0:05.250')
    expect(formatTime(83.5)).toBe('1:23.500')
  })
  it('handles non-finite input', () => {
    expect(formatTime(NaN)).toBe('0:00.000')
  })
})

describe('isVideoFile', () => {
  it('accepts video MIME types and known extensions', () => {
    expect(isVideoFile(new File([], 'a.mp4', { type: 'video/mp4' }))).toBe(true)
    expect(isVideoFile(new File([], 'swing.MOV', { type: '' }))).toBe(true)
  })
  it('rejects other files', () => {
    expect(isVideoFile(new File([], 'notes.txt', { type: 'text/plain' }))).toBe(false)
  })
})
