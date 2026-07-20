"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileUp, AlertTriangle, Music } from "lucide-react"
import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import type { QuantGrid } from "~/lib/midiToScore/types"

interface MidiUploadProps {
  onFileSelect: (file: File, grid: QuantGrid) => void
  className?: string
}

const GRID_OPTIONS: { value: QuantGrid; label: string; description: string }[] = [
  { value: "auto", label: "Auto", description: "Best resolution" },
  { value: "1/8", label: "1/8", description: "Quarter notes" },
  { value: "1/16", label: "1/16", description: "Eighth notes" },
  { value: "1/32", label: "1/32", description: "Sixteenth notes" },
]

export function MidiUpload({ onFileSelect, className }: MidiUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [selectedGrid, setSelectedGrid] = useState<QuantGrid>("auto")

  const isValidMidiFile = (file: File): boolean => {
    const validTypes = ["audio/midi", "audio/x-midi", "application/x-midi"]
    const validExtensions = [".mid", ".midi"]
    const hasValidType = validTypes.includes(file.type)
    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    )
    return hasValidType || hasValidExtension
  }

  const onDrop = useCallback(
    (acceptedFiles: File[], _rejectedFiles: unknown) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        if (isValidMidiFile(file)) {
          onFileSelect(file, selectedGrid)
        }
      }
    },
    [onFileSelect, selectedGrid]
  )

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "audio/midi": [".mid", ".midi"],
      "audio/x-midi": [".mid", ".midi"],
      "application/x-midi": [".mid", ".midi"],
    },
    maxFiles: 1,
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  })

  return (
    <div className={cn("space-y-6", className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
          "hover:border-primary/50 hover:bg-muted/50",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/5",
          !isDragActive && !isDragReject && "border-muted-foreground/25"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className={cn(
              "p-4 rounded-full transition-colors",
              isDragActive && !isDragReject && "bg-primary/10",
              isDragReject && "bg-destructive/10",
              !isDragActive && !isDragReject && "bg-muted"
            )}
          >
            {isDragReject ? (
              <FileUp className="w-10 h-10 text-destructive" />
            ) : (
              <Music
                className={cn(
                  "w-10 h-10 transition-colors",
                  isDragActive ? "text-primary" : "text-muted-foreground"
                )}
              />
            )}
          </div>
          <div>
            <p className="text-lg font-medium">
              {isDragReject
                ? "Only MIDI files are supported"
                : isDragActive
                  ? "Drop your MIDI here"
                  : "Drag & drop a MIDI file"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse (.mid, .midi)
            </p>
          </div>
        </div>
      </div>

      {/* Quantization Grid Selector */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Quantization Grid</span>
          <span className="text-xs text-muted-foreground">(for note timing)</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {GRID_OPTIONS.map(({ value, label, description }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedGrid(value)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-md border transition-colors",
                selectedGrid === value
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-secondary hover:bg-muted text-muted-foreground"
              )}
            >
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{description}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {selectedGrid === "auto"
            ? "Automatically selects the best resolution based on the MIDI content."
            : `Notes will be quantized to ${selectedGrid} note values.`}
        </p>
      </div>

      {/* Caveat */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-yellow-200">MIDI quality varies by source</p>
          <p className="mt-1 text-yellow-200/70">
            MIDI is a performance recording, not a score. Results depend entirely on how
            the MIDI was generated — studio recordings produce cleaner output than
            live-performance captures. Tempo changes, dynamics, and articulations may
            not be preserved.
          </p>
        </div>
      </div>
    </div>
  )
}
