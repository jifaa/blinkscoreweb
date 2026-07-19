"use client"

import { useEffect, useState, useCallback } from "react"
import { Eye } from "lucide-react"
import { PdfViewer } from "~/components/reader/PdfViewer"
import { PdfUpload } from "~/components/reader/PdfUpload"
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

export default function ReaderPage() {
  const {
    pdfUrl,
    pdfFileName,
    currentPage,
    totalPages,
    settings,
    cameraPermission,
    setPdf,
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

  // Handle camera permission
  const handleCameraPermissionGranted = useCallback(() => {
    setCameraPermission("granted")
  }, [setCameraPermission])

  const handleCameraPermissionDenied = useCallback(() => {
    setCameraPermission("denied")
  }, [setCameraPermission])

  // Show calibration on first visit
  useEffect(() => {
    if (pdfUrl && !isCalibrated && cameraPermission === "granted") {
      const timer = setTimeout(() => {
        setShowCalibration(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [pdfUrl, isCalibrated, cameraPermission])

  // Request camera permission on mount
  useEffect(() => {
    if (cameraPermission === "pending" && cameraSupported) {
      // The CameraPermissionDialog will handle the actual permission request
    }
  }, [cameraPermission, cameraSupported])

  // Handle PDF file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      const url = URL.createObjectURL(file)
      setPdf(url, file.name, 0) // Total pages will be set by PdfViewer

      // Save to library
      // Note: We save without totalPages first, then update after loading
      try {
        await saveToLibrary(file, 0)
      } catch (err) {
        console.error("Error saving to library:", err)
      }
    },
    [setPdf, saveToLibrary]
  )

  // Handle total pages from PdfViewer
  const handleTotalPages = useCallback(
    (total: number) => {
      if (total > 0) {
        useReaderStore.setState((state) => ({
          totalPages: total,
          pdfFileName: state.pdfFileName,
        }))
      }
    },
    []
  )

  // Handle wink detection
  const handleBlinkScores = useCallback((scores: FaceBlinkScores) => {
    setBlinkScores(scores)
  }, [])

  // Show camera permission dialog
  const showPermissionDialog = cameraPermission === "pending" && cameraSupported

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Permission Dialog */}
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

      {/* Calibration Wizard */}
      <CalibrationWizard
        open={showCalibration}
        onOpenChange={setShowCalibration}
        onComplete={() => {
          setShowCalibration(false)
        }}
      />

      {/* Settings Panel */}
      <SettingsPanel
        open={showSettings}
        onOpenChange={setShowSettings}
        onRecalibrate={() => {
          setShowSettings(false)
          setShowCalibration(true)
        }}
      />

      {/* Library Dialog */}
      <LibraryDialog
        open={showLibrary}
        onOpenChange={setShowLibrary}
        onSelectScore={async (id) => {
          await loadFromLibrary(id)
          setShowLibrary(false)
        }}
      />

      {/* Wink Navigator - handles wink detection and page navigation */}
      <WinkNavigator blinkScores={blinkScores} />

      {/* Main Content */}
      {pdfUrl ? (
        <>
          {/* Header with controls */}
          <header className="h-14 flex items-center justify-between px-4 border-b border-hairline bg-surface-1">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPdf(null, null, 0)
                  setCurrentPage(1)
                }}
              >
                ← Back
              </Button>
              <span className="font-medium text-sm truncate max-w-[200px]">
                {pdfFileName || "Untitled"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <NavigationControls />

              <div className="border-l pl-4 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLibrary(true)}
                  title="Open from Library"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(true)}
                  title="Settings"
                >
                  ⚙️
                </Button>
              </div>
            </div>
          </header>

          {/* PDF Viewer */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <PdfViewer pdfUrl={pdfUrl} onTotalPages={handleTotalPages} />

            {/* Camera Preview (small overlay) */}
            {cameraPermission === "granted" && (
              <div className="absolute bottom-20 right-4 w-48 h-36 rounded-lg overflow-hidden shadow-lg border border-hairline">
                <CameraPreview onBlinkScores={handleBlinkScores} />
              </div>
            )}
          </main>

          {/* Page Thumbnails */}
          <footer className="border-t border-hairline bg-surface-1">
            {totalPages > 0 && (
              <div className="h-24 overflow-hidden">
                {/* Page thumbnails would go here */}
                <div className="p-2 text-center text-xs text-muted-foreground">
                  {currentPage} of {totalPages}
                </div>
              </div>
            )}
          </footer>

          {/* Performance Mode */}
          <PerformanceMode />
        </>
      ) : (
        /* Upload State */
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-2xl space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                <Eye className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold">Welcome to BlinkScore</h1>
              <p className="text-muted-foreground">
                Upload a PDF to get started with hands-free page turning
              </p>
            </div>

            <PdfUpload onFileSelect={handleFileSelect} className="min-h-[300px]" />

            <div className="text-center">
              <Button variant="secondary" onClick={() => setShowLibrary(true)}>
                Open from Library
              </Button>
            </div>

            {/* Privacy note */}
            <div className="text-center text-sm text-muted-foreground">
              <p>🔒 All processing happens locally in your browser.</p>
              <p>No video or data is ever uploaded.</p>
            </div>
          </div>
        </main>
      )}
    </div>
  )
}
