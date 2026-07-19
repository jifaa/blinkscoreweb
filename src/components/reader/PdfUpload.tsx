"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileUp } from "lucide-react"
import { cn } from "~/lib/utils"

interface PdfUploadProps {
  onFileSelect: (file: File) => void
  className?: string
}

export function PdfUpload({ onFileSelect, className }: PdfUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        if (file.type === "application/pdf") {
          onFileSelect(file)
        }
      }
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
        isDragActive && !isDragReject && "border-primary bg-primary/5",
        isDragReject && "border-destructive bg-destructive/5",
        !isDragActive && !isDragReject && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4 text-center">
        <div className={cn(
          "p-4 rounded-full transition-colors",
          isDragActive && !isDragReject && "bg-primary/10",
          isDragReject && "bg-destructive/10",
          !isDragActive && !isDragReject && "bg-muted"
        )}>
          {isDragReject ? (
            <FileUp className="w-10 h-10 text-destructive" />
          ) : (
            <Upload className={cn(
              "w-10 h-10 transition-colors",
              isDragActive ? "text-primary" : "text-muted-foreground"
            )} />
          )}
        </div>
        <div>
          <p className="text-lg font-medium">
            {isDragReject
              ? "Only PDF files are supported"
              : isDragActive
              ? "Drop your PDF here"
              : "Drag & drop your PDF"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse
          </p>
        </div>
      </div>
    </div>
  )
}
