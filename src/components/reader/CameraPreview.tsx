"use client"

import { useEffect, useCallback } from "react"
import { Camera, CameraOff, RefreshCw } from "lucide-react"
import { Button } from "~/components/ui/button"
import { useFaceLandmarker } from "~/lib/faceTracking/useFaceLandmarker"
import { useReaderStore } from "~/store/useReaderStore"
import type { FaceBlinkScores } from "~/lib/faceTracking/types"

interface CameraPreviewProps {
  onBlinkScores?: (scores: FaceBlinkScores) => void
  className?: string
}

export function CameraPreview({ onBlinkScores, className }: CameraPreviewProps) {
  const { settings } = useReaderStore()
  const { camera } = settings

  const {
    isLoading,
    error,
    isSupported,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    blinkScores: liveBlinkScores,
  } = useFaceLandmarker({
    deviceId: camera.deviceId,
    mirrored: camera.mirrored,
    onBlinkScores: (scores) => {
      onBlinkScores?.(scores)
    },
  })

  // Start camera on mount
  useEffect(() => {
    if (isSupported && !isLoading) {
      startCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isSupported, isLoading, startCamera, stopCamera])

  const handleRestartCamera = useCallback(() => {
    stopCamera()
    setTimeout(startCamera, 100)
  }, [stopCamera, startCamera])

  if (!isSupported) {
    return (
      <div className={`p-4 bg-muted rounded-lg ${className}`}>
        <div className="flex items-center gap-2 text-destructive">
          <CameraOff className="w-5 h-5" />
          <span className="text-sm">Camera not supported</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Your browser doesn&apos;t support camera access.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`p-4 bg-muted rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Initializing camera...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 bg-muted rounded-lg ${className}`}>
        <div className="flex items-center gap-2 text-destructive">
          <CameraOff className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
        <Button variant="secondary" size="sm" className="mt-2" onClick={handleRestartCamera}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${camera.mirrored ? "scale-x-[-1]" : ""}`}
      />

      {/* Landmark overlay canvas - NOT mirrored via CSS, mirroring handled in JS */}
      {camera.showOverlay && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
      )}

      {/* Debug scores */}
      {camera.showDebugScores && liveBlinkScores && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs p-2 rounded">
          <div className="flex gap-4">
            <span>
              L: <span className={liveBlinkScores.leftEye > 0.5 ? "text-red-400" : "text-green-400"}>
                {liveBlinkScores.leftEye.toFixed(2)}
              </span>
            </span>
            <span>
              R: <span className={liveBlinkScores.rightEye > 0.5 ? "text-red-400" : "text-green-400"}>
                {liveBlinkScores.rightEye.toFixed(2)}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Camera indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <Camera className="w-3 h-3" />
      </div>
    </div>
  )
}
