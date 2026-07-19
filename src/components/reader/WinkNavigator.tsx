"use client"

import { useEffect, useRef, useCallback } from "react"
import { useReaderStore } from "~/store/useReaderStore"
import type { FaceBlinkScores, WinkDirection } from "~/lib/faceTracking/types"
import { useWinkClassifier } from "~/lib/faceTracking/winkClassifier"
import { toast } from "sonner"

interface WinkNavigatorProps {
  blinkScores: FaceBlinkScores | null
  onWinkDetected?: (direction: WinkDirection) => void
}

export function WinkNavigator({ blinkScores, onWinkDetected }: WinkNavigatorProps) {
  const { settings, nextPage, prevPage } = useReaderStore()
  const { calibration } = settings
  const { navigation } = settings

  const { classifyWink, isNaturalBlink } = useWinkClassifier()

  // State tracking for temporal filtering
  const stateStartRef = useRef<{ direction: WinkDirection; timestamp: number } | null>(null)
  const lastTriggerRef = useRef<number>(0)
  const isWinkingRef = useRef<boolean>(false)

  // Audio context ref - lazily created on first sound request
  const audioContextRef = useRef<AudioContext | null>(null)

  // Get or create audio context respecting browser autoplay policies
  const getAudioContext = useCallback((): AudioContext | null => {
    try {
      // Resume existing context if suspended (browser autoplay policy)
      if (audioContextRef.current) {
        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume()
        }
        return audioContextRef.current
      }

      // Create new context (this should only happen after user interaction)
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass()
        return audioContextRef.current
      }
      return null
    } catch {
      return null
    }
  }, [])

  // Play sound feedback
  const playSound = useCallback(
    (direction: WinkDirection) => {
      if (!navigation.soundEnabled) return

      try {
        const audioContext = getAudioContext()
        if (!audioContext) return

        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Different tones for left/right
        oscillator.frequency.value = direction === "right" ? 880 : 440
        oscillator.type = "sine"

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
      } catch (err) {
        console.error("Audio error:", err)
      }
    },
    [navigation.soundEnabled, getAudioContext]
  )

  // Show visual feedback
  const showVisualFeedback = useCallback(
    (direction: WinkDirection) => {
      if (!navigation.visualFeedback) return

      const directionText = direction === "right" ? "Next" : "Previous"
      toast(directionText, {
        duration: 500,
        position: direction === "right" ? "bottom-right" : "bottom-left",
      })
    },
    [navigation.visualFeedback]
  )

  // Handle wink detection
  const handleWink = useCallback(
    (direction: WinkDirection) => {
      const now = Date.now()

      // Check cooldown
      if (now - lastTriggerRef.current < calibration.cooldown) {
        return
      }

      lastTriggerRef.current = now

      // Navigate
      if (direction === "right") {
        nextPage()
      } else if (direction === "left") {
        prevPage()
      }

      // Feedback
      playSound(direction)
      showVisualFeedback(direction)
      onWinkDetected?.(direction)
    },
    [calibration.cooldown, nextPage, prevPage, playSound, showVisualFeedback, onWinkDetected]
  )

  // Process blink scores
  useEffect(() => {
    if (!blinkScores) {
      stateStartRef.current = null
      isWinkingRef.current = false
      return
    }

    // Check if it's a natural blink (both eyes closed)
    if (isNaturalBlink(blinkScores)) {
      stateStartRef.current = null
      isWinkingRef.current = false
      return
    }

    // Classify the wink
    const result = classifyWink(blinkScores)
    const { direction } = result

    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.debug('[WinkNavigator]', {
        leftEye: blinkScores.leftEye.toFixed(3),
        rightEye: blinkScores.rightEye.toFixed(3),
        direction,
        confidence: result.confidence.toFixed(3),
        isCalibrated: settings.isCalibrated,
        highThreshold: calibration.highThreshold.toFixed(3),
        lowThreshold: calibration.lowThreshold.toFixed(3),
        winkDuration: calibration.winkDuration,
      })
    }

    if (direction === "none") {
      // No wink detected, reset state
      stateStartRef.current = null
      isWinkingRef.current = false
      return
    }

    // Check if this is a new direction or continuation
    if (!stateStartRef.current || stateStartRef.current.direction !== direction) {
      // New wink direction detected
      stateStartRef.current = { direction, timestamp: Date.now() }
      isWinkingRef.current = false
      return
    }

    // Check if wink has persisted long enough
    const duration = Date.now() - stateStartRef.current.timestamp

    // Debug logging for duration check
    if (process.env.NODE_ENV === 'development') {
      console.debug('[WinkNavigator] Wink held:', {
        direction,
        duration: `${duration}ms`,
        required: `${calibration.winkDuration}ms`,
        canTrigger: duration >= calibration.winkDuration && !isWinkingRef.current,
        alreadyTriggered: isWinkingRef.current,
      })
    }

    if (duration >= calibration.winkDuration && !isWinkingRef.current) {
      isWinkingRef.current = true
      console.log('[WinkNavigator] WINK DETECTED:', direction)
      handleWink(direction)
    }
  }, [blinkScores, classifyWink, isNaturalBlink, calibration.winkDuration, calibration.highThreshold, calibration.lowThreshold, settings.isCalibrated, handleWink])

  return null // This component doesn't render anything
}
