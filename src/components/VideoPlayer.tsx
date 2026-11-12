import { useEffect } from 'react'
import { usePlayback } from '../store/playback'

const supportsFrameCallback =
  typeof HTMLVideoElement !== 'undefined' &&
  'requestVideoFrameCallback' in HTMLVideoElement.prototype

const UNSUPPORTED_FORMAT =
  "Your browser can't play this video. iPhone .mov files (HEVC) play in Safari; " +
  'for other browsers, export the video as H.264 MP4.'

export function VideoPlayer() {
  const videoUrl = usePlayback((s) => s.videoUrl)
  const element = usePlayback((s) => s.element)
  const loop = usePlayback((s) => s.loop)
  const videoWidth = usePlayback((s) => s.videoWidth)
  const videoHeight = usePlayback((s) => s.videoHeight)
  const setElement = usePlayback((s) => s.setElement)
  const setMetadata = usePlayback((s) => s.setMetadata)
  const setCurrentTime = usePlayback((s) => s.setCurrentTime)
  const setIsPlaying = usePlayback((s) => s.setIsPlaying)
  const setError = usePlayback((s) => s.setError)
  const togglePlay = usePlayback((s) => s.togglePlay)

  // Keep currentTime in sync with the frame actually on screen.
  // requestVideoFrameCallback fires once per presented frame (during playback
  // and after seeks); timeupdate only fires a few times per second.
  useEffect(() => {
    if (!element || !videoUrl) return

    if (supportsFrameCallback) {
      let handle: number
      const onFrame: VideoFrameRequestCallback = (_now, metadata) => {
        setCurrentTime(metadata.mediaTime)
        handle = element.requestVideoFrameCallback(onFrame)
      }
      handle = element.requestVideoFrameCallback(onFrame)
      return () => element.cancelVideoFrameCallback(handle)
    }

    const sync = () => setCurrentTime(element.currentTime)
    element.addEventListener('timeupdate', sync)
    element.addEventListener('seeked', sync)
    return () => {
      element.removeEventListener('timeupdate', sync)
      element.removeEventListener('seeked', sync)
    }
  }, [element, videoUrl, setCurrentTime])

  if (!videoUrl) return null

  // Size the frame to the video's aspect ratio so it is never letterboxed.
  // Drawn overlays can then map 1:1 onto this box.
  const ratio = videoWidth && videoHeight ? videoWidth / videoHeight : 16 / 9

  return (
    <div
      className="player"
      style={{ aspectRatio: ratio, width: `min(100%, calc(var(--player-max-height) * ${ratio}))` }}
    >
      <video
        ref={setElement}
        src={videoUrl}
        loop={loop}
        playsInline
        preload="auto"
        onClick={togglePlay}
        onLoadedMetadata={(e) => {
          const video = e.currentTarget
          // Loading a new source resets playbackRate, so reapply the user's choice.
          video.playbackRate = usePlayback.getState().playbackRate
          setMetadata({
            duration: video.duration,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
          })
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setError(UNSUPPORTED_FORMAT)}
      />
    </div>
  )
}
