"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, Music, ArrowRight } from "lucide-react"
import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import type { QuantGrid } from "~/lib/midiToScore/types"

type ContentType = "pdf" | "midi" | null

interface UnifiedUploadProps {
  onPdfSelect: (file: File) => void
  onMidiSelect: (file: File, grid: QuantGrid) => void
  className?: string
}

export function UnifiedUpload({
  onPdfSelect,
  onMidiSelect,
  className,
}: UnifiedUploadProps) {
  const [selectedType, setSelectedType] = useState<ContentType>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return
      const file = acceptedFiles[0]

      if (selectedType === "pdf") {
        onPdfSelect(file)
      } else if (selectedType === "midi") {
        onMidiSelect(file, "auto")
      }
    },
    [selectedType, onPdfSelect, onMidiSelect]
  )

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
    accept:
      selectedType === "pdf"
        ? { "application/pdf": [".pdf"] }
        : selectedType === "midi"
          ? {
              "audio/midi": [".mid", ".midi"],
              "audio/x-midi": [".mid", ".midi"],
            }
          : {},
    maxFiles: 1,
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
    disabled: !selectedType,
  })

  return (
    <div className={cn("space-y-6", className)}>
      {/* Welcome text */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Welcome to BlinkScore</h2>
        <p className="text-muted-foreground text-sm">
          Upload a PDF or MIDI file to get started with hands-free page turning
        </p>
      </div>

      {/* Type selector */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setSelectedType("pdf")}
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 transition-all",
            selectedType === "pdf"
              ? "border-primary bg-primary/10"
              : "border-border bg-secondary hover:border-primary/50 hover:bg-muted"
          )}
        >
          <div
            className={cn(
              "p-3 rounded-full",
              selectedType === "pdf" ? "bg-primary/20" : "bg-muted"
            )}
          >
            <FileText
              className={cn(
                "w-8 h-8",
                selectedType === "pdf" ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
          <div className="text-center">
            <p className="font-medium">PDF Score</p>
            <p className="text-xs text-muted-foreground mt-1">
              Traditional sheet music PDF
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedType("midi")}
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 transition-all",
            selectedType === "midi"
              ? "border-primary bg-primary/10"
              : "border-border bg-secondary hover:border-primary/50 hover:bg-muted"
          )}
        >
          <div
            className={cn(
              "p-3 rounded-full",
              selectedType === "midi" ? "bg-primary/20" : "bg-muted"
            )}
          >
            <Music
              className={cn(
                "w-8 h-8",
                selectedType === "midi" ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
          <div className="text-center">
            <p className="font-medium">MIDI Score</p>
            <p className="text-xs text-muted-foreground mt-1">
              Convert MIDI to sheet music
            </p>
          </div>
        </button>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
          !selectedType && "opacity-50 cursor-not-allowed",
          selectedType && !isDragActive && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          isDragActive && selectedType && "border-primary bg-primary/5",
          !selectedType && "border-muted-foreground/25"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className={cn(
              "p-4 rounded-full transition-colors",
              isDragActive && selectedType && "bg-primary/10",
              !isDragActive && selectedType && "bg-muted",
              !selectedType && "bg-muted"
            )}
          >
            {isDragActive && selectedType ? (
              <ArrowRight className="w-10 h-10 text-primary" />
            ) : (
              <Upload
                className={cn(
                  "w-10 h-10 transition-colors",
                  selectedType ? "text-muted-foreground" : "text-muted-foreground/50"
                )}
              />
            )}
          </div>
          <div>
            <p className="text-lg font-medium">
              {!selectedType
                ? "Select a type above"
                : isDragActive
                  ? "Drop your file here"
                  : "Drag & drop your file here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {!selectedType
                ? "Choose PDF or MIDI to continue"
                : selectedType === "pdf"
                  ? "or click to browse (.pdf)"
                  : "or click to browse (.mid, .midi)"}
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>Use your eyes to turn pages — right eye = next, left eye = previous</p>
        <p>You can also use keyboard arrows or click the navigation buttons</p>
      </div>
    </div>
  )
}
