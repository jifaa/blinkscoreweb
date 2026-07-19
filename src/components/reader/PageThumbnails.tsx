"use client"

import { useEffect, useState, useRef } from "react"
import * as pdfjsLib from "pdfjs-dist"
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist"
import { cn } from "~/lib/utils"
import { useReaderStore } from "~/store/useReaderStore"

interface PageThumbnailsProps {
  pdfUrl: string | null
  className?: string
}

export function PageThumbnails({ pdfUrl, className }: PageThumbnailsProps) {
  const [thumbnails, setThumbnails] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { currentPage, setCurrentPage } = useReaderStore()
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate thumbnails
  useEffect(() => {
    if (!pdfUrl) return

    const generateThumbnails = async () => {
      setIsLoading(true)
      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl)
        const pdf: PDFDocumentProxy = await loadingTask.promise
        const thumbs: string[] = []

        for (let i = 1; i <= pdf.numPages; i++) {
          const page: PDFPageProxy = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 0.2 })

          const canvas = document.createElement("canvas")
          canvas.width = viewport.width
          canvas.height = viewport.height

          const context = canvas.getContext("2d")
          if (context) {
            await page.render({
              canvasContext: context,
              viewport: viewport,
            }).promise
            thumbs.push(canvas.toDataURL())
          }
        }

        setThumbnails(thumbs)
      } catch (err) {
        console.error("Error generating thumbnails:", err)
      } finally {
        setIsLoading(false)
      }
    }

    generateThumbnails()
  }, [pdfUrl])

  // Scroll to current page thumbnail
  useEffect(() => {
    if (!containerRef.current) return
    const currentElement = containerRef.current.querySelector(`[data-page="${currentPage}"]`)
    if (currentElement) {
      currentElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }
  }, [currentPage])

  if (!pdfUrl) return null

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex gap-2 p-2 overflow-x-auto border-t bg-muted/30",
        className
      )}
      style={{ scrollbarWidth: "thin" }}
    >
      {thumbnails.map((thumb, index) => (
        <button
          key={index}
          data-page={index + 1}
          onClick={() => setCurrentPage(index + 1)}
          className={cn(
            "flex-shrink-0 p-1 rounded border-2 transition-colors hover:border-primary/50",
            currentPage === index + 1
              ? "border-primary bg-primary/10"
              : "border-transparent"
          )}
        >
          <img
            src={thumb}
            alt={`Page ${index + 1}`}
            className="w-12 h-auto rounded shadow-sm"
            style={{ aspectRatio: "3/4" }}
          />
        </button>
      ))}
    </div>
  )
}
