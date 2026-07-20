"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist"
import { useReaderStore } from "~/store/useReaderStore"

// Set up the worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
}


interface PdfViewerProps {
  pdfUrl: string | null
  onTotalPages: (total: number) => void
}

export function PdfViewer({ pdfUrl, onTotalPages }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Track render state with refs to avoid stale closures
  const renderStateRef = useRef({
    isRendering: false,
    currentPdf: null as PDFDocumentProxy | null,
    currentPage: 1,
    currentFitMode: 'width' as 'width' | 'height' | 'auto',
    renderVersion: 0, // Increment to cancel stale renders
  })

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { currentPage, fitMode } = useReaderStore()

  // Load PDF document
  useEffect(() => {
    if (!pdfUrl) return

    const loadPdf = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl)
        const pdf = await loadingTask.promise
        setPdfDoc(pdf)
        renderStateRef.current.currentPdf = pdf
        onTotalPages(pdf.numPages)
      } catch (err) {
        console.error("Error loading PDF:", err)
        setError("Failed to load PDF. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadPdf()
  }, [pdfUrl, onTotalPages])

  // Cleanup effect for PDF document
  useEffect(() => {
    const currentPdf = renderStateRef.current.currentPdf
    return () => {
      if (currentPdf) {
        currentPdf.destroy()
        renderStateRef.current.currentPdf = null
      }
    }
  }, [])

  // Keep ref in sync with state
  useEffect(() => {
    if (pdfDoc) {
      renderStateRef.current.currentPdf = pdfDoc
    }
  }, [pdfDoc])

  // Render page function
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- refs require manual memo pattern
  const renderPage = useCallback(async () => {
    const state = renderStateRef.current
    const canvas = canvasRef.current
    const container = containerRef.current

    if (!canvas || !container || !state.currentPdf) return

    // If already rendering, this render will be superseded by the next call
    if (state.isRendering) {
      // Increment version to cancel this render when the current one completes
      state.renderVersion++
      return
    }

    state.isRendering = true
    const renderVersionAtStart = state.renderVersion
    const targetPage = state.currentPage

    try {
      const page: PDFPageProxy = await state.currentPdf.getPage(targetPage)
      const context = canvas.getContext("2d")
      if (!context) return

      // Check if this render is still valid (not superseded)
      if (renderVersionAtStart !== state.renderVersion) {
        state.isRendering = false
        return
      }

      const containerWidth = container.clientWidth || 800
      const containerHeight = container.clientHeight || 600

      let viewport = page.getViewport({ scale: 1 })
      let scale = 1

      // Always fit the whole page within the container (no scroll needed)
      if (state.currentFitMode === "width") {
        scale = containerWidth / viewport.width
      } else if (state.currentFitMode === "height") {
        scale = containerHeight / viewport.height
      } else {
        // 'auto': fit entire page — scale down to smallest dimension so nothing is cut off
        const scaleWidth = containerWidth / viewport.width
        const scaleHeight = containerHeight / viewport.height
        scale = Math.min(scaleWidth, scaleHeight)
      }

      viewport = page.getViewport({ scale })

      // Clear and resize canvas
      canvas.width = viewport.width
      canvas.height = viewport.height

      // Start render task
      const renderTask = page.render({
        canvasContext: context,
        viewport: viewport,
      })

      try {
        await renderTask.promise
      } catch (err) {
        // Ignore cancelled renders
        if ((err as Error).name !== "RenderingCancelledException") {
          console.error("Error rendering page:", err)
        }
      }
    } catch (err) {
      if ((err as Error).name !== "RenderingCancelledException") {
        console.error("Error loading page:", err)
      }
    } finally {
      state.isRendering = false

      // If a new render was requested while we were rendering, trigger it
      if (renderVersionAtStart !== state.renderVersion) {
        renderPage()
      }
    }
  }, [])

  // Sync store values to ref
  useEffect(() => {
    renderStateRef.current.currentPage = currentPage
    renderStateRef.current.currentFitMode = fitMode
  }, [currentPage, fitMode])

  // Trigger render on page/fit mode change
  useEffect(() => {
    // Small delay to ensure canvas is ready
    const timer = requestAnimationFrame(() => {
      renderPage()
    })
    return () => cancelAnimationFrame(timer)
  }, [currentPage, fitMode, renderPage])

  // Handle resize with debounce
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let resizeTimer: ReturnType<typeof setTimeout>

    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        renderPage()
      }, 100) // Debounce resize events
    })

    observer.observe(container)
    return () => {
      observer.disconnect()
      clearTimeout(resizeTimer)
    }
  }, [renderPage])

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No PDF loaded
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        {error}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center flex-1 min-h-0 w-full overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="shadow-lg"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  )
}
