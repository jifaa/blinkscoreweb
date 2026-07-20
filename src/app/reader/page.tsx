"use client"

import { useEffect, useState, useCallback } from "react"
import { Eye } from "lucide-react"
import { PdfViewer } from "~/components/reader/PdfViewer"
import { UnifiedUpload } from "~/components/reader/UnifiedUpload"
import { MidiScoreViewer } from "~/components/reader/MidiScoreViewer"
import { CameraPreview } from "~/components/reader/CameraPreview"
import { NavigationControls } from "~/components/reader/NavigationControls"
import { SettingsPanel } from "~/components/reader/SettingsPanel"
import { CalibrationWizard } from "~/components/reader/CalibrationWizard"
import { PerformanceMode } from "~/components/reader/PerformanceMode"
import { LibraryDialog, useLibrary } from "~/components/reader/Library"
import { CameraPermissionDialog, useCameraDevices } from "~/components/reader/CameraPermissionDialog"
import { WinkNavigator } from "~/components/reader/WinkNavigator"
import { Button } from "~/components/ui/button"
import { useReaderStore } from "~/store/useReaderStore"
import type { FaceBlinkScores } from "~/lib/faceTracking/types"
import type { QuantGrid } from "~/lib/midiToScore/types"
import {
  parseMidi,
  detectKey,
  quantizeNotes,
  chunkMeasures,
  buildMusicXml,
} from "~/lib/midiToScore"

export default function ReaderPage() {
  const {
    contentType,
    pdfUrl,
    pdfFileName,
    midiScoreName,
    currentPage,
    totalPages,
    settings,
    cameraPermission,
    setPdf,
    setMidi,
    clearContent,
    setCameraPermission,
    setCurrentPage,
  } = useReaderStore()

  const isCalibrated = settings.isCalibrated

  const { saveToLibrary, loadFromLibrary } = useLibrary()
  const { isSupported: cameraSupported } = useCameraDevices()

  // Local state
  const [blinkScores, setBlinkScores] = useState<FaceBlinkScores | null>(null)
  const [showCalibration, setShowCalibration] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState("")

  // Handle camera permission
  const handleCameraPermissionGranted = useCallback(() => {
    setCameraPermission("granted")
  }, [setCameraPermission])

  const handleCameraPermissionDenied = useCallback(() => {
    setCameraPermission("denied")
  }, [setCameraPermission])

  // Show calibration on first visit
  useEffect(() => {
    if ((pdfUrl || contentType === "midi") && !isCalibrated && cameraPermission === "granted") {
      const timer = setTimeout(() => {
        setShowCalibration(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [pdfUrl, contentType, isCalibrated, cameraPermission])

  // Handle PDF file selection
  const handlePdfSelect = useCallback(
    async (file: File) => {
      const url = URL.createObjectURL(file)
      setPdf(url, file.name, 0)

      try {
        await saveToLibrary(file, 0)
      } catch (err) {
        console.error("Error saving to library:", err)
      }
    },
    [setPdf, saveToLibrary]
  )

  // Handle MIDI file selection and processing
  const handleMidiSelect = useCallback(
    async (file: File, grid: QuantGrid) => {
      setIsProcessing(true)
      setProcessingProgress(0)
      setProcessingStatus("Reading MIDI file...")

      try {
        // Step 1: Parse MIDI
        setProcessingProgress(10)
        setProcessingStatus("Parsing MIDI data...")
        const buffer = await file.arrayBuffer()
        const midi = await parseMidi(buffer)
        console.log("Parsed MIDI:", { name: midi.name, trackCount: midi.tracks.length, totalNotes: midi.tracks.reduce((sum, t) => sum + t.notes.length, 0) })

        // Step 2: Detect key
        setProcessingProgress(25)
        setProcessingStatus("Detecting key signature...")
        const allNotes = midi.tracks.flatMap((t) => t.notes)
        const keySignature = detectKey(allNotes)
        console.log("Detected key:", keySignature)

        // Step 3: Quantize
        setProcessingProgress(40)
        setProcessingStatus("Quantizing notes...")
        const { parts } = quantizeNotes(midi, grid)
        console.log("Quantized parts:", parts.length, "parts")

        // Step 4: Chunk measures
        setProcessingProgress(60)
        setProcessingStatus("Creating pages...")
        const chunks = chunkMeasures(parts, 1, {}, midi.ppq)
        console.log("Created", chunks.length, "chunks")

        // Step 5: Generate MusicXML for each chunk
        setProcessingProgress(70)
        const musicXmlChunks: string[] = []
        for (let i = 0; i < chunks.length; i++) {
          setProcessingProgress(70 + Math.round((i / chunks.length) * 25))
          const chunk = chunks[i]
          const xml = buildMusicXml({
            ...chunk,
            title: midi.name || file.name.replace(/\.(mid|midi)$/i, ""),
          })
          musicXmlChunks.push(xml)
        }
        console.log("Generated", musicXmlChunks.length, "chunks, first chunk length:", musicXmlChunks[0]?.length)

        // Step 6: Set in store
        setProcessingProgress(95)
        setProcessingStatus("Finalizing...")
        setMidi(
          musicXmlChunks,
          keySignature,
          midi.name || file.name.replace(/\.(mid|midi)$/i, ""),
          grid
        )

        // Save to library
        setProcessingProgress(98)
        try {
          const { saveMidiToLibrary, cacheMidiChunks } = await import("~/lib/storage/db")
          const scoreId = await saveMidiToLibrary(file, {
            name: midi.name || file.name,
            totalPages: musicXmlChunks.length,
            keySignature,
            quantGrid: grid,
          })
          await cacheMidiChunks(scoreId, musicXmlChunks)
        } catch (err) {
          console.error("Error saving to library:", err)
        }

        setProcessingProgress(100)
        setProcessingStatus("Done!")
      } catch (err) {
        console.error("Error processing MIDI:", err)
        alert("Failed to process MIDI file. Please try a different file.")
      } finally {
        setIsProcessing(false)
      }
    },
    [setMidi]
  )

  // Handle total pages from PdfViewer
  const handleTotalPages = useCallback(
    (total: number) => {
      if (total > 0) {
        useReaderStore.setState({
          totalPages: total,
        })
      }
    },
    []
  )

  // Handle wink detection
  const handleBlinkScores = useCallback((scores: FaceBlinkScores) => {
    setBlinkScores(scores)
  }, [])

  // Handle back button
  const handleBack = useCallback(() => {
    clearContent()
    setCurrentPage(1)
  }, [clearContent, setCurrentPage])

  const showPermissionDialog = cameraPermission === "pending" && cameraSupported
  const contentTitle = contentType === "pdf" ? pdfFileName : contentType === "midi" ? midiScoreName : null

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <CameraPermissionDialog
        open={showPermissionDialog}
        onOpenChange={(open) => {
          if (!open && cameraPermission === "pending") {
            setCameraPermission("denied")
          }
        }}
        onPermissionGranted={handleCameraPermissionGranted}
        onPermissionDenied={handleCameraPermissionDenied}
      />

      <CalibrationWizard
        open={showCalibration}
        onOpenChange={setShowCalibration}
        onComplete={() => setShowCalibration(false)}
      />

      <SettingsPanel
        open={showSettings}
        onOpenChange={setShowSettings}
        onRecalibrate={() => {
          setShowSettings(false)
          setShowCalibration(true)
        }}
      />

      <LibraryDialog
        open={showLibrary}
        onOpenChange={setShowLibrary}
        onSelectScore={async (id) => {
          await loadFromLibrary(id)
          setShowLibrary(false)
        }}
      />

      <WinkNavigator blinkScores={blinkScores} />

      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-50">
          <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-lg border border-border shadow-lg min-w-[300px]">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">{processingStatus}</p>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{processingProgress}%</p>
          </div>
        </div>
      )}

      {contentType === "pdf" && (
        <>
          <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-background">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>← Back</Button>
              <span className="font-medium text-sm text-muted-foreground truncate max-w-[200px] font-mono">
                {contentTitle || "Untitled"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <NavigationControls />
              <div className="border-l pl-4 flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setShowLibrary(true)} aria-label="Open from Library">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} aria-label="Settings">
                  ⚙️
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 flex flex-col overflow-hidden relative">
            <PdfViewer pdfUrl={pdfUrl} onTotalPages={handleTotalPages} />
            {cameraPermission === "granted" && (
              <div className="absolute bottom-20 right-4 w-52 h-40 rounded-lg overflow-hidden border border-border bg-secondary">
                <CameraPreview onBlinkScores={handleBlinkScores} />
                <div className="absolute top-2 right-2 flex items-center gap-2 px-2 py-1 bg-black/60 rounded text-xs">
                  <span className="w-2 h-2 bg-[#10b981] rounded-full animate-tracking-pulse"></span>
                  <span className="text-foreground font-mono text-xs">Tracking</span>
                </div>
              </div>
            )}
          </main>
          <footer className="border-t border-border bg-card">
            {totalPages > 0 && (
              <div className="h-24 overflow-hidden">
                <div className="p-2 text-center text-xs text-muted-foreground font-mono">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            )}
          </footer>
          <PerformanceMode />
        </>
      )}

      {contentType === "midi" && (
        <>
          <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-background">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>← Back</Button>
              <span className="font-medium text-sm text-muted-foreground truncate max-w-[200px] font-mono">
                {contentTitle || "Untitled"}
              </span>
              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">MIDI</span>
            </div>
            <div className="flex items-center gap-2">
              <NavigationControls />
              <div className="border-l pl-4 flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setShowLibrary(true)} aria-label="Open from Library">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} aria-label="Settings">
                  ⚙️
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 flex flex-col overflow-hidden relative">
            <MidiScoreViewer />
            {cameraPermission === "granted" && (
              <div className="absolute bottom-20 right-4 w-52 h-40 rounded-lg overflow-hidden border border-border bg-secondary">
                <CameraPreview onBlinkScores={handleBlinkScores} />
                <div className="absolute top-2 right-2 flex items-center gap-2 px-2 py-1 bg-black/60 rounded text-xs">
                  <span className="w-2 h-2 bg-[#10b981] rounded-full animate-tracking-pulse"></span>
                  <span className="text-foreground font-mono text-xs">Tracking</span>
                </div>
              </div>
            )}
          </main>
          <footer className="border-t border-border bg-card">
            {totalPages > 0 && (
              <div className="h-24 overflow-hidden">
                <div className="p-2 text-center text-xs text-muted-foreground font-mono">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            )}
          </footer>
          <PerformanceMode />
        </>
      )}

      {!contentType && (
        <main className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
          <div className="w-full max-w-2xl space-y-8">
            <UnifiedUpload onPdfSelect={handlePdfSelect} onMidiSelect={handleMidiSelect} />
            <div className="text-center">
              <Button variant="secondary" className="border-border bg-secondary hover:bg-muted" onClick={() => setShowLibrary(true)}>
                Open from Library
              </Button>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-[#10b981] rounded-full"></span>
                All processing happens locally in your browser.
              </p>
              <p>No video or data is ever uploaded.</p>
            </div>
          </div>
        </main>
      )}
    </div>
  )
}
