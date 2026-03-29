import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface ResizeHandleProps {
  onResize: (deltaY: number) => void
}

export function ResizeHandle({ onResize }: ResizeHandleProps) {
  const [dragging, setDragging] = useState(false)
  const lastY = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      lastY.current = e.clientY
      setDragging(true)
    },
    []
  )

  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - lastY.current
      lastY.current = e.clientY
      onResize(delta)
    }

    const handleMouseUp = () => setDragging(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, onResize])

  return (
    <div
      className={cn(
        'h-1.5 cursor-row-resize shrink-0 flex items-center justify-center group hover:bg-accent/50 transition-colors',
        dragging && 'bg-accent/50'
      )}
      onMouseDown={handleMouseDown}
    >
      <div
        className={cn(
          'h-0.5 w-12 rounded-full bg-border transition-colors group-hover:bg-primary/40',
          dragging && 'bg-primary/40'
        )}
      />
    </div>
  )
}
