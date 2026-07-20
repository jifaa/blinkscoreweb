"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay"
import { useReaderStore } from "~/store/useReaderStore"

export function MidiScoreViewer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null)
  const isReadyRef = useRef(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { midiChunks, currentPage } = useReaderStore()

  // Initialize OSMD
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Clean up previous instance
    if (osmdRef.current) {
      osmdRef.current.clear()
      osmdRef.current = null
    }

    isReadyRef.current = false

    // Create new OSMD instance
    const osmd = new OpenSheetMusicDisplay(container, {
      autoResize: false,
      backend: "svg",
      drawTitle: true,
      drawComposer: true,
      drawCredits: false,
      drawPartNames: true,
      drawMeasureNumbers: true,
      drawMeasureNumbersOnlyAtSystemStart: false,
    })

    osmdRef.current = osmd

    return () => {
      osmd.clear()
      osmdRef.current = null
      isReadyRef.current = false
    }
  }, [])

  // Render the current page
  useEffect(() => {
    const renderPage = async () => {
      if (!osmdRef.current || midiChunks.length === 0) return

      const chunkIndex = currentPage - 1
      if (chunkIndex < 0 || chunkIndex >= midiChunks.length) return

      setIsLoading(true)
      setError(null)
      isReadyRef.current = false

      try {
        const musicXml = midiChunks[chunkIndex]

        // Guard: ensure we have a real XML string before passing to OSMD
        if (typeof musicXml !== "string" || musicXml.length === 0) {
          throw new Error(`Chunk ${chunkIndex} is not a valid string (got ${typeof musicXml})`)
        }
        if (!musicXml.includes("<score-partwise")) {
          throw new Error(`Chunk ${chunkIndex} missing <score-partwise>. Preview: ${musicXml.substring(0, 200)}`)
        }

        console.log("DEBUG chunk", chunkIndex, "length:", musicXml.length, "preview:", musicXml.substring(0, 300))

        // Clear previous content
        osmdRef.current.clear()

        await osmdRef.current.load(musicXml)
        osmdRef.current.render()

        isReadyRef.current = true

        // Auto-scale to fit height after a short delay
        setTimeout(() => {
          applyFitToHeight()
        }, 100)
      } catch (err) {
        console.error("Error rendering MusicXML:", err)
        setError("Failed to render the sheet music. Please try a different file.")
      } finally {
        setIsLoading(false)
      }
    }

    renderPage()
  }, [currentPage, midiChunks])

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current || !osmdRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      if (osmdRef.current && isReadyRef.current) {
        osmdRef.current.render()
        applyFitToHeight()
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [currentPage, midiChunks])

  // Apply fit-to-height scaling
  const applyFitToHeight = useCallback(() => {
    if (!osmdRef.current || !containerRef.current) return

    const container = containerRef.current
    const containerHeight = container.clientHeight

    const svg = container.querySelector("svg")
    if (!svg) return

    const bbox = svg.getBoundingClientRect()
    if (bbox.height === 0) return

    const zoom = Math.min(1, containerHeight / bbox.height)
    osmdRef.current.zoom = zoom
  }, [])

  if (midiChunks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">No MIDI content loaded</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Rendering sheet music...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-3 text-center p-4 max-w-sm">
            <p className="text-destructive font-medium">{error}</p>
            <p className="text-xs text-muted-foreground">
              If you loaded this from the library, try re-uploading the MIDI file — cached data may be outdated.
            </p>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden bg-background"
      />
    </div>
  )
}
