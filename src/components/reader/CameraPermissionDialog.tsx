"use client"

import { useState, useEffect } from "react"
import { Camera } from "lucide-react"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import type { CameraDevice } from "~/lib/faceTracking/types"

interface CameraPermissionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPermissionGranted: () => void
  onPermissionDenied: () => void
}

export function CameraPermissionDialog({
  open,
  onOpenChange,
  onPermissionGranted,
  onPermissionDenied,
}: CameraPermissionDialogProps) {
  const [error, setError] = useState<string | null>(null)

  const handleRequestPermission = async () => {
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      // Stop the stream immediately - we just wanted to check permission
      stream.getTracks().forEach((track) => track.stop())
      onPermissionGranted()
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError("Camera access was denied. Please allow camera access in your browser settings.")
          onPermissionDenied()
        } else if (err.name === "NotFoundError") {
          setError("No camera found. Please connect a camera and try again.")
          onPermissionDenied()
        } else {
          setError("Camera error: " + err.message)
        }
      } else {
        setError("An unknown error occurred while accessing the camera.")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Enable Camera Access
          </DialogTitle>
          <DialogDescription>
            BlinkScore needs camera access to detect your eye winks and turn pages hands-free.
            <br />
            <br />
            <strong>Privacy:</strong> All video processing happens entirely in your browser.
            No video or image data is ever uploaded to any server.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRequestPermission}>
            <Camera className="w-4 h-4 mr-2" />
            Enable Camera
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function useCameraDevices() {
  const [devices, setDevices] = useState<CameraDevice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Check if camera is supported in this browser
  const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  useEffect(() => {
    if (!isSupported) {
      setIsLoading(false)
      return
    }

    const loadDevices = async () => {
      try {
        // Request permission first to get device labels
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach((track) => track.stop())

        const deviceList = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = deviceList
          .filter((device) => device.kind === "videoinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          }))

        setDevices(videoDevices)
      } catch (err) {
        console.error("Error loading camera devices:", err)
        // Still try to get devices without labels
        const deviceList = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = deviceList
          .filter((device) => device.kind === "videoinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          }))
        setDevices(videoDevices)
      } finally {
        setIsLoading(false)
      }
    }

    loadDevices()
  }, [isSupported])

  return { devices, isLoading, isSupported }
}
