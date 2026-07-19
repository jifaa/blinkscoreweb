"use client"

import { useState, useEffect, useCallback } from "react"
import { Library, Trash2, FileText, Clock, BookOpen } from "lucide-react"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { useReaderStore } from "~/store/useReaderStore"
import type { ScoreMetadata } from "~/lib/storage/db"

interface LibraryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectScore: (id: string) => void
}

export function LibraryDialog({ open, onOpenChange, onSelectScore }: LibraryDialogProps) {
  const [scores, setScores] = useState<ScoreMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Load scores when dialog opens
  useEffect(() => {
    if (!open) return

    const loadScores = async () => {
      setIsLoading(true)
      try {
        const { getAllScores } = await import("~/lib/storage/db")
        const allScores = await getAllScores()
        setScores(allScores)
      } catch (err) {
        console.error("Error loading scores:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadScores()
  }, [open])

  const handleDelete = async (id: string) => {
    try {
      const { deleteScore } = await import("~/lib/storage/db")
      await deleteScore(id)
      setScores((prev) => prev.filter((s) => s.id !== id))
      setDeleteConfirm(null)
    } catch (err) {
      console.error("Error deleting score:", err)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="w-5 h-5" />
            Your Score Library
          </DialogTitle>
          <DialogDescription>
            Access your previously saved sheet music. All data is stored locally on your device.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No scores in your library yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Upload a PDF to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {scores.map((score) => (
                <div
                  key={score.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-20 bg-muted rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {score.thumbnail ? (
                      <img
                        src={score.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{score.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {score.totalPages} pages
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(score.lastRead)}
                      </span>
                    </div>
                    {score.currentPage > 1 && (
                      <p className="text-xs text-primary mt-1">
                        Page {score.currentPage} of {score.totalPages}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      onClick={() => onSelectScore(score.id)}
                    >
                      Open
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(score.id)}
                      aria-label={`Delete ${score.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Score?</DialogTitle>
            <DialogDescription>
              This will permanently remove the score from your library. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

// Hook to manage library in reader
export function useLibrary() {
  const { setPdf } = useReaderStore()

  const saveToLibrary = useCallback(
    async (file: File, totalPages: number) => {
      try {
        const { saveScore, generateThumbnail } = await import("~/lib/storage/db")

        // Generate thumbnail
        const url = URL.createObjectURL(file)
        const thumbnail = await generateThumbnail(url, 1)
        URL.revokeObjectURL(url)

        await saveScore(file, {
          name: file.name.replace(".pdf", ""),
          totalPages,
          thumbnail: thumbnail || undefined,
        })
      } catch (err) {
        console.error("Error saving to library:", err)
      }
    },
    []
  )

  const loadFromLibrary = useCallback(
    async (id: string) => {
      try {
        const { getScore } = await import("~/lib/storage/db")
        const result = await getScore(id)

        if (result) {
          setPdf(result.pdfUrl, result.metadata.name, result.metadata.totalPages)
          useReaderStore.setState({ currentPage: result.metadata.currentPage })
          return true
        }
        return false
      } catch (err) {
        console.error("Error loading from library:", err)
        return false
      }
    },
    [setPdf]
  )

  return {
    saveToLibrary,
    loadFromLibrary,
  }
}
