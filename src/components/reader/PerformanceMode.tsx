"use client"

import { useEffect, useState, useCallback } from "react"
import { Maximize2, Minimize2 } from "lucide-react"
import { Button } from "~/components/ui/button"
import { useReaderStore } from "~/store/useReaderStore"

export function useWakeLock() {
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null)
  // Initialize synchronously from navigator for SSR safety, no useEffect needed
  const isSupported = "wakeLock" in navigator

  const request = useCallback(async () => {
    if (!isSupported) return false

    try {
      const lock = await navigator.wakeLock.request("screen")
      setWakeLock(lock)
      return true
    } catch (err) {
      console.error("Wake Lock error:", err)
      return false
    }
  }, [isSupported])

  const release = useCallback(async () => {
    if (wakeLock) {
      await wakeLock.release()
      setWakeLock(null)
    }
  }, [wakeLock])

  // Re-request on visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && !wakeLock && isSupported) {
        await request()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [wakeLock, isSupported, request])

  // Release on unmount
  useEffect(() => {
    return () => {
      if (wakeLock) {
        wakeLock.release()
      }
    }
  }, [wakeLock])

  return { isSupported, isActive: !!wakeLock, request, release }
}

interface PerformanceModeProps {
  className?: string
}

export function PerformanceMode({ className: _className }: PerformanceModeProps) {
  const { isPerformanceMode, setPerformanceMode, isFullscreen, setFullscreen, pdfUrl } = useReaderStore()
  const { isSupported: wakeLockSupported, isActive: wakeLockActive, request: requestWakeLock, release: releaseWakeLock } = useWakeLock()
  const [showUI, setShowUI] = useState(true)
  const [hideTimeout, setHideTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  // Enter performance mode
  const enterPerformanceMode = useCallback(async () => {
    setPerformanceMode(true)
    setShowUI(false)

    // Request wake lock
    if (wakeLockSupported) {
      await requestWakeLock()
    }

    // Try to enter fullscreen
    if (document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen()
        setFullscreen(true)
      } catch (err) {
        console.error("Fullscreen error:", err)
      }
    }
  }, [wakeLockSupported, requestWakeLock, setPerformanceMode, setFullscreen])

  // Exit performance mode
  const exitPerformanceMode = useCallback(async () => {
    setPerformanceMode(false)
    setShowUI(true)

    // Release wake lock
    if (wakeLockActive) {
      await releaseWakeLock()
    }

    // Exit fullscreen
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch (err) {
        console.error("Exit fullscreen error:", err)
      }
    }
    setFullscreen(false)
  }, [wakeLockActive, releaseWakeLock, setPerformanceMode, setFullscreen])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      setFullscreen(false)
    } else if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen()
      setFullscreen(true)
    }
  }, [setFullscreen])

  // Show UI temporarily
  const showUITemporarily = useCallback(() => {
    setShowUI(true)
    if (hideTimeout) {
      clearTimeout(hideTimeout)
    }
    const timeout = setTimeout(() => {
      if (isPerformanceMode) {
        setShowUI(false)
      }
    }, 3000)
    setHideTimeout(timeout)
  }, [hideTimeout, isPerformanceMode])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to exit performance mode
      if (e.key === "Escape" && isPerformanceMode) {
        exitPerformanceMode()
      }
      // F to toggle fullscreen
      if (e.key === "f" && isPerformanceMode && !e.ctrlKey && !e.metaKey) {
        toggleFullscreen()
      }
      // Space or any key to show UI
      if (isPerformanceMode && !showUI) {
        showUITemporarily()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPerformanceMode, showUI, exitPerformanceMode, toggleFullscreen, showUITemporarily])

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [setFullscreen])

  if (!pdfUrl) return null

  return (
    <>
      {/* Performance mode toggle button */}
      {isPerformanceMode ? (
        <div
          className={`fixed inset-0 z-50 bg-background transition-opacity duration-300 ${
            showUI ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={showUITemporarily}
        >
          {/* Minimal UI overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={exitPerformanceMode}
                className="text-white hover:bg-white/20"
              >
                <Minimize2 className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={enterPerformanceMode}
          className="fixed bottom-4 right-4 z-40"
        >
          <Maximize2 className="h-4 w-4 mr-2" />
          Stage Mode
        </Button>
      )}
    </>
  )
}
