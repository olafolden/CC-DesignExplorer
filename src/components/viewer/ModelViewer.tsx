import { useEffect, useRef } from 'react'
import { Box } from 'lucide-react'

interface ModelViewerProps {
  modelUrl: string | null
  designId: string
  color?: string
}

export function ModelViewer({ modelUrl, designId, color }: ModelViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const viewerReady = useRef(false)
  const pendingUrl = useRef<string | null>(null)

  // Listen for "ready" signal from the iframe viewer
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'viewerReady') {
        viewerReady.current = true
        // Send any pending URL that was set before the viewer was ready
        if (pendingUrl.current !== null) {
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'loadModel', url: pendingUrl.current },
            '*'
          )
          pendingUrl.current = null
        }
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Send model URL to iframe whenever it changes
  useEffect(() => {
    const url = modelUrl || ''

    if (viewerReady.current && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        { type: 'loadModel', url },
        '*'
      )
    } else {
      // Viewer not ready yet — store for when it signals ready
      pendingUrl.current = url
    }
  }, [modelUrl])

  // Reset ready state if iframe remounts
  const onIframeLoad = () => {
    // The viewer.html will send 'viewerReady' once its script runs
  }

  return (
    <div className="h-full w-full relative">
      <iframe
        ref={iframeRef}
        src="/viewer.html"
        className="absolute inset-0 w-full h-full border-0"
        allow="autoplay"
        onLoad={onIframeLoad}
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
