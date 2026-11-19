import { AnglePanel } from './components/AnglePanel'
import { AnnotationToolbar } from './components/AnnotationToolbar'
import { PlaybackControls } from './components/PlaybackControls'
import { OpenVideoButton, VideoLoader } from './components/VideoLoader'
import { VideoPlayer } from './components/VideoPlayer'
import { useAnnotationShortcuts } from './hooks/useAnnotationShortcuts'
import { useFileDrop } from './hooks/useFileDrop'
import { usePlaybackShortcuts } from './hooks/usePlaybackShortcuts'
import { usePlayback } from './store/playback'

export default function App() {
  const videoUrl = usePlayback((s) => s.videoUrl)
  const fileName = usePlayback((s) => s.fileName)
  const error = usePlayback((s) => s.error)
  const loadFile = usePlayback((s) => s.loadFile)

  const isDragging = useFileDrop(loadFile)
  usePlaybackShortcuts()
  useAnnotationShortcuts()

  return (
    <div className="app">
      <header className="app__header">
        <h1>Golf Swing Analyzer</h1>
        {videoUrl && (
          <div className="app__file">
            <span className="app__filename">{fileName}</span>
            <OpenVideoButton />
          </div>
        )}
      </header>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      <main className="app__main">
        {videoUrl ? (
          <>
            <AnnotationToolbar />
            <VideoPlayer />
            <PlaybackControls />
            <AnglePanel />
            {isDragging && <div className="drop-overlay">Drop to replace video</div>}
          </>
        ) : (
          <VideoLoader isDragging={isDragging} />
        )}
      </main>
    </div>
  )
}
