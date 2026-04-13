import { useEffect, useRef, useCallback } from 'react'
import { Box } from 'lucide-react'
import { useAppStore } from '@/store'

interface ModelViewerProps {
  modelUrl: string | null
  contextModelUrl?: string | null
  designId: string
  color?: string
}

export function ModelViewer({ modelUrl, contextModelUrl, designId }: ModelViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const viewerReady = useRef(false)
  const pendingUrl = useRef<string | null>(null)
  const pendingContextUrl = useRef<string | null | undefined>(undefined)
  const hasLoadedFirst = useRef(false)
  const viewerSettings = useAppStore((s) => s.viewerSettings)

  const postToViewer = useCallback((msg: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(msg, '*')
  }, [])

  // Listen for "ready" signal from the iframe viewer
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'viewerReady') {
        viewerReady.current = true
        hasLoadedFirst.current = false
        // Send current settings immediately
        postToViewer({ type: 'updateSettings', settings: viewerSettings })
        // Send context model first (sets reference coordinate space)
        if (pendingContextUrl.current !== undefined) {
          postToViewer({ type: 'loadContext', url: pendingContextUrl.current ?? '' })
          pendingContextUrl.current = undefined
        }
        // Send any pending design model URL
        if (pendingUrl.current !== null) {
          postToViewer({ type: 'loadModel', url: pendingUrl.current, preserveCamera: false })
          if (pendingUrl.current) hasLoadedFirst.current = true
          pendingUrl.current = null
        }
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [postToViewer, viewerSettings])

  // Send model URL to iframe whenever it changes
  useEffect(() => {
    const url = modelUrl || ''
    if (viewerReady.current) {
      postToViewer({ type: 'loadModel', url, preserveCamera: hasLoadedFirst.current })
      if (url) hasLoadedFirst.current = true
    } else {
      pendingUrl.current = url
    }
  }, [modelUrl, postToViewer])

  // Send context model URL to iframe whenever it changes
  useEffect(() => {
    const url = contextModelUrl ?? ''
    if (viewerReady.current) {
      postToViewer({ type: 'loadContext', url })
    } else {
      pendingContextUrl.current = contextModelUrl
    }
  }, [contextModelUrl, postToViewer])

  // Send settings to iframe whenever they change
  useEffect(() => {
    if (viewerReady.current) {
      postToViewer({ type: 'updateSettings', settings: viewerSettings })
    }
  }, [viewerSettings, postToViewer])

  // Listen for resetCamera custom event from toolbar
  useEffect(() => {
    function onReset() {
      if (viewerReady.current) {
        postToViewer({ type: 'resetCamera' })
      }
    }
    window.addEventListener('viewer:resetCamera', onReset)
    return () => window.removeEventListener('viewer:resetCamera', onReset)
  }, [postToViewer])

  return (
    <div className="h-full w-full relative">
      <iframe
        ref={iframeRef}
        src="/viewer.html"
        className="absolute inset-0 w-full h-full border-0"
        allow="autoplay"
      />
      {!modelUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground select-none z-10 pointer-events-none bg-background/80">
          <Box className="h-12 w-12 mb-3 opacity-20" />
          <p className="text-xs">No 3D model available for {designId}</p>
        </div>
      )}
    </div>
  )
}

export default ModelViewer
