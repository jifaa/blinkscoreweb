"use client"

import { useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "~/components/ui/button"
import { useReaderStore } from "~/store/useReaderStore"

export function NavigationControls() {
  const { currentPage, totalPages, nextPage, prevPage, setFitMode, fitMode } = useReaderStore()

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

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="icon"
        onClick={prevPage}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2 px-2 min-w-[120px] justify-center">
        <span className="text-sm font-medium">{currentPage}</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm text-muted-foreground">{totalPages || "-"}</span>
      </div>

      <Button
        variant="secondary"
        size="icon"
        onClick={nextPage}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <div className="ml-4 border-l pl-4 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Fit:</span>
        <div className="flex gap-1">
          <Button
            variant={fitMode === "width" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFitMode("width")}
          >
            Width
          </Button>
          <Button
            variant={fitMode === "height" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFitMode("height")}
          >
            Height
          </Button>
        </div>
      </div>
    </div>
  )
}
