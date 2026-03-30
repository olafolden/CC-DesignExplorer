import { useState, useRef, useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'

export function DesignSelector() {
  const rawData = useAppStore((s) => s.rawData)
  const isDataLoaded = useAppStore((s) => s.isDataLoaded)
  const selectedDesignId = useAppStore((s) => s.selectedDesignId)
  const setSelectedDesignId = useAppStore((s) => s.setSelectedDesignId)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const allIds = useMemo(() => rawData.map((d) => d.id), [rawData])

  const filtered = useMemo(() => {
    if (!query) return allIds
    const q = query.toLowerCase()
    return allIds.filter((id) => id.toLowerCase().includes(q))
  }, [allIds, query])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!isDataLoaded) return null

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
        <input
          type="text"
          placeholder={selectedDesignId ?? 'Search designs...'}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className={cn(
            'w-full h-8 rounded-md border border-input bg-transparent pl-7 pr-3 text-xs',
            'placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring',
            selectedDesignId && !query && 'placeholder:text-foreground placeholder:font-mono'
          )}
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.map((id) => (
              <button
                key={id}
                onClick={() => {
                  setSelectedDesignId(id)
                  setQuery('')
                  setOpen(false)
                }}
                className={cn(
                  'w-full text-left rounded-sm px-2 py-1 text-xs font-mono',
                  'hover:bg-accent hover:text-accent-foreground',
                  id === selectedDesignId && 'bg-accent/50 text-accent-foreground'
                )}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
