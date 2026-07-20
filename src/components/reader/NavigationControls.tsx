"use client"

import { useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "~/components/ui/button"
import { useReaderStore } from "~/store/useReaderStore"

export function NavigationControls() {
  const { contentType, currentPage, totalPages, nextPage, prevPage, setFitMode, fitMode } = useReaderStore()

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault()
        nextPage()
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault()
        prevPage()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [nextPage, prevPage])

  // Fit mode is only relevant for PDF content
  const showFitMode = contentType === "pdf"

  return (
    <div className="flex items-center gap-2">
      {/* Previous Button - Stitch Ghost Style */}
      <Button
        variant="ghost"
        size="icon"
        className="border border-border hover:border-[#10b981] hover:text-primary"
        onClick={prevPage}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page Counter - JetBrains Mono for technical feel */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-sm min-w-[100px] justify-center">
        <span className="text-sm font-mono font-semibold text-foreground">{currentPage}</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-mono text-muted-foreground">{totalPages || "-"}</span>
      </div>

      {/* Next Button - Stitch Ghost Style */}
      <Button
        variant="ghost"
        size="icon"
        className="border border-border hover:border-[#10b981] hover:text-primary"
        onClick={nextPage}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Fit Mode Controls - only show for PDF content */}
      {showFitMode && (
        <div className="border-l border-border pl-4 flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">Fit:</span>
          <div className="flex gap-1 bg-secondary border border-border rounded-sm p-0.5">
            <Button
              variant={fitMode === "auto" ? "default" : "ghost"}
              size="sm"
              className={fitMode !== "auto" ? "text-muted-foreground hover:text-foreground" : ""}
              onClick={() => setFitMode("auto")}
              title="Fit entire page"
            >
              Auto
            </Button>
            <Button
              variant={fitMode === "width" ? "default" : "ghost"}
              size="sm"
              className={fitMode !== "width" ? "text-muted-foreground hover:text-foreground" : ""}
              onClick={() => setFitMode("width")}
              title="Fit to width"
            >
              Width
            </Button>
            <Button
              variant={fitMode === "height" ? "default" : "ghost"}
              size="sm"
              className={fitMode !== "height" ? "text-muted-foreground hover:text-foreground" : ""}
              onClick={() => setFitMode("height")}
              title="Fit to height"
            >
              Height
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
