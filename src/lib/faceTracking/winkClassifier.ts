"use client"

import { useCallback, useEffect, useRef } from "react"
import type { FaceBlinkScores, CalibrationData, CalibrationResult } from "./types"
import { useReaderStore } from "~/store/useReaderStore"

const NEUTRAL_HIGH_THRESHOLD = 0.15 // Both eyes should be below this when neutral
const MIN_THRESHOLD_GAP = 0.1 // Minimum gap between high and low thresholds

export function useWinkClassifier() {
  const { settings } = useReaderStore()
  const { calibration } = settings
  const debugLoggedRef = useRef(false)

  // Debug: log calibration values on mount
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !debugLoggedRef.current) {
      console.debug('[winkClassifier] Calibration loaded:', {
        highThreshold: calibration.highThreshold,
        lowThreshold: calibration.lowThreshold,
        winkDuration: calibration.winkDuration,
        cooldown: calibration.cooldown,
        isCalibrated: settings.isCalibrated,
      })
      debugLoggedRef.current = true
    }
  }, [calibration.highThreshold, calibration.lowThreshold, calibration.winkDuration, calibration.cooldown, settings.isCalibrated])

  // Classify if current scores indicate a wink
  const classifyWink = useCallback(
    (scores: FaceBlinkScores): { direction: "left" | "right" | "none"; confidence: number } => {
      const { highThreshold, lowThreshold } = calibration

      const isRightHigh = scores.rightEye > highThreshold
      const isLeftHigh = scores.leftEye > highThreshold
      const isRightLow = scores.rightEye < lowThreshold
      const isLeftLow = scores.leftEye < lowThreshold

      // Both eyes high = natural blink, ignore
      if (isRightHigh && isLeftHigh) {
        return { direction: "none", confidence: 0 }
      }

      // Right eye high AND left eye low = right wink
      if (isRightHigh && isLeftLow) {
        const confidence = (scores.rightEye - lowThreshold) / (highThreshold - lowThreshold)
        return { direction: "right", confidence: Math.min(confidence, 1) }
      }

      // Left eye high AND right eye low = left wink
      if (isLeftHigh && isRightLow) {
        const confidence = (scores.leftEye - lowThreshold) / (highThreshold - lowThreshold)
        return { direction: "left", confidence: Math.min(confidence, 1) }
      }

      return { direction: "none", confidence: 0 }
    },
    [calibration]
  )

  // Check if current state is a valid wink (not just a normal blink)
  const isNaturalBlink = useCallback(
    (scores: FaceBlinkScores): boolean => {
      const { highThreshold } = calibration
      return scores.leftEye > highThreshold && scores.rightEye > highThreshold
    },
    [calibration]
  )

  return {
    classifyWink,
    isNaturalBlink,
    calibration,
  }
}

// Calibration helper
export function calculateCalibrationResult(data: CalibrationData): CalibrationResult {
  const { neutralSamples, leftWinkSamples, rightWinkSamples } = data

  // Validate we have enough samples
  const hasNeutral = neutralSamples.length > 0
  const hasLeftWink = leftWinkSamples.length > 0
  const hasRightWink = rightWinkSamples.length > 0

  // Calculate average scores for each state with division-by-zero protection
  const avgNeutral = {
    left: hasNeutral
      ? neutralSamples.reduce((sum, s) => sum + s.leftEye, 0) / neutralSamples.length
      : 0.1,
    right: hasNeutral
      ? neutralSamples.reduce((sum, s) => sum + s.rightEye, 0) / neutralSamples.length
      : 0.1,
  }

  const avgLeftWink = {
    left: hasLeftWink
      ? leftWinkSamples.reduce((sum, s) => sum + s.leftEye, 0) / leftWinkSamples.length
      : 0.8,
    right: hasLeftWink
      ? leftWinkSamples.reduce((sum, s) => sum + s.rightEye, 0) / leftWinkSamples.length
      : 0.1,
  }

  const avgRightWink = {
    left: hasRightWink
      ? rightWinkSamples.reduce((sum, s) => sum + s.leftEye, 0) / rightWinkSamples.length
      : 0.1,
    right: hasRightWink
      ? rightWinkSamples.reduce((sum, s) => sum + s.rightEye, 0) / rightWinkSamples.length
      : 0.8,
  }

  // Calculate thresholds
  // highThreshold: above this = eye is closed (wink)
  // lowThreshold: below this = eye is open
  let highThreshold = Math.max(
    NEUTRAL_HIGH_THRESHOLD,
    (avgLeftWink.left + avgRightWink.right) / 2
  )

  let lowThreshold = Math.min(avgNeutral.left, avgNeutral.right) + 0.1

  // Ensure we have a valid, non-overlapping threshold pair
  // If highThreshold <= lowThreshold + MIN_GAP, calibration failed - use safe defaults
  if (highThreshold <= lowThreshold + MIN_THRESHOLD_GAP) {
    console.warn(
      "[BlinkScore] Calibration produced invalid thresholds. " +
      `highThreshold (${highThreshold.toFixed(3)}) should be > lowThreshold + gap (${(lowThreshold + MIN_THRESHOLD_GAP).toFixed(3)}). ` +
      "This may indicate bad lighting, camera angle, or incomplete wink samples. Using safe defaults."
    )

    // Fall back to safe default thresholds
    highThreshold = 0.6
    lowThreshold = 0.2
  }

  // Cap and floor the final values
  highThreshold = Math.min(highThreshold, 0.8) // Cap at 0.8
  lowThreshold = Math.max(lowThreshold, 0.1) // Minimum 0.1

  return {
    highThreshold,
    lowThreshold,
    recommendedDuration: 200, // ms
  }
}
