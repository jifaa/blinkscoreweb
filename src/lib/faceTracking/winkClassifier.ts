"use client"

import { useCallback } from "react"
import type { FaceBlinkScores, CalibrationData, CalibrationResult } from "./types"
import { useReaderStore } from "~/store/useReaderStore"

const NEUTRAL_HIGH_THRESHOLD = 0.15 // Both eyes should be below this when neutral

export function useWinkClassifier() {
  const { settings } = useReaderStore()
  const { calibration } = settings

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
  const highThreshold = Math.max(
    NEUTRAL_HIGH_THRESHOLD,
    (avgLeftWink.left + avgRightWink.right) / 2
  )

  const lowThreshold = Math.min(avgNeutral.left, avgNeutral.right) + 0.1

  return {
    highThreshold: Math.min(highThreshold, 0.8), // Cap at 0.8
    lowThreshold: Math.max(lowThreshold, 0.1), // Minimum 0.1
    recommendedDuration: 200, // ms
  }
}
