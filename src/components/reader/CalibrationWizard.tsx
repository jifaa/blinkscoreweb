"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Eye, EyeOff, CheckCircle, ChevronRight } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Progress } from "~/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { useReaderStore } from "~/store/useReaderStore"
import { calculateCalibrationResult } from "~/lib/faceTracking/winkClassifier"
import type { FaceBlinkScores, CalibrationData } from "~/lib/faceTracking/types"

interface CalibrationWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

type CalibrationStep = "intro" | "neutral" | "rightWink" | "leftWink" | "complete"

const STEP_DURATION = 3000 // 3 seconds per step
const REQUIRED_SAMPLES = 10

export function CalibrationWizard({ open, onOpenChange, onComplete }: CalibrationWizardProps) {
  const [step, setStep] = useState<CalibrationStep>("intro")
  const [progress, setProgress] = useState(0)
  const [samples, setSamples] = useState<CalibrationData>({
    neutralSamples: [],
    leftWinkSamples: [],
    rightWinkSamples: [],
  })
  const [currentDirection, setCurrentDirection] = useState<"left" | "right" | "neutral">("neutral")
  const startTimeRef = useRef<number>(0)

  const { updateCalibration, setCalibrated } = useReaderStore()

  const handleBlinkScores = useCallback(
    (scores: FaceBlinkScores) => {
      if (step === "intro" || step === "complete") return

      // Only collect samples during the active sampling phase
      if (progress < 100) return

      const newSample = scores

      if (currentDirection === "neutral") {
        setSamples((prev) => ({
          ...prev,
          neutralSamples: [...prev.neutralSamples.slice(-REQUIRED_SAMPLES + 1), newSample],
        }))
      } else if (currentDirection === "right") {
        setSamples((prev) => ({
          ...prev,
          rightWinkSamples: [...prev.rightWinkSamples.slice(-REQUIRED_SAMPLES + 1), newSample],
        }))
      } else if (currentDirection === "left") {
        setSamples((prev) => ({
          ...prev,
          leftWinkSamples: [...prev.leftWinkSamples.slice(-REQUIRED_SAMPLES + 1), newSample],
        }))
      }
    },
    [step, progress, currentDirection]
  )

  // Expose the callback globally for the camera to use
  useEffect(() => {
    if (open) {
      (window as unknown as { __calibrationCallback?: (scores: FaceBlinkScores) => void }).__calibrationCallback =
        handleBlinkScores
    } else {
      delete (window as unknown as { __calibrationCallback?: (scores: FaceBlinkScores) => void }).__calibrationCallback
    }

    return () => {
      delete (window as unknown as { __calibrationCallback?: (scores: FaceBlinkScores) => void }).__calibrationCallback
    }
  }, [open, handleBlinkScores])

  // Progress timer for each step
  useEffect(() => {
    if (step === "intro" || step === "complete") return

    // Use a mutable ref for startTime to avoid re-creating the interval on each step change
    startTimeRef.current = Date.now()

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const newProgress = Math.min((elapsed / STEP_DURATION) * 100, 100)
      setProgress(newProgress)

      if (newProgress >= 100) {
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [step])

  const handleStartCalibration = () => {
    setStep("neutral")
    setCurrentDirection("neutral")
    setSamples({ neutralSamples: [], leftWinkSamples: [], rightWinkSamples: [] })
  }

  const handleNextStep = () => {
    if (step === "neutral") {
      setStep("rightWink")
      setCurrentDirection("right")
    } else if (step === "rightWink") {
      setStep("leftWink")
      setCurrentDirection("left")
    } else if (step === "leftWink") {
      // Calculate and apply calibration
      const result = calculateCalibrationResult(samples)
      updateCalibration({
        highThreshold: result.highThreshold,
        lowThreshold: result.lowThreshold,
        winkDuration: result.recommendedDuration,
      })
      setCalibrated(true)
      setStep("complete")
    } else if (step === "complete") {
      onComplete()
      onOpenChange(false)
    }
  }

  const getStepInstruction = () => {
    switch (step) {
      case "intro":
        return "We'll calibrate your eye wink detection. Follow the on-screen instructions."
      case "neutral":
        return "Keep your eyes open and relaxed. Look at the camera."
      case "rightWink":
        return "Wink your RIGHT eye a few times. Keep your left eye open."
      case "leftWink":
        return "Wink your LEFT eye a few times. Keep your right eye open."
      case "complete":
        return "Calibration complete! Your wink thresholds have been saved."
    }
  }

  const canProceed = () => {
    switch (step) {
      case "intro":
        return true
      case "neutral":
        return progress >= 100 && samples.neutralSamples.length >= REQUIRED_SAMPLES / 2
      case "rightWink":
        return progress >= 100 && samples.rightWinkSamples.length >= REQUIRED_SAMPLES / 2
      case "leftWink":
        return progress >= 100 && samples.leftWinkSamples.length >= REQUIRED_SAMPLES / 2
      case "complete":
        return true
      default:
        return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Stitch Surface Dialog */}
      <DialogContent className="sm:max-w-md bg-card-foreground border border-border rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Eye className="w-5 h-5 text-primary" />
            Eye Wink Calibration
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {getStepInstruction()}
          </DialogDescription>
        </DialogHeader>

        {/* Progress stepper - Stitch Style */}
        <div className="flex items-center justify-center gap-2 py-2">
          {["intro", "neutral", "rightWink", "leftWink", "complete"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  step === s
                    ? "bg-primary"
                    : ["intro", "neutral", "rightWink", "leftWink", "complete"].indexOf(step) > i
                    ? "bg-primary-hover"
                    : "bg-[#27272a]"
                }`}
              />
              {i < 4 && (
                <div className={`w-6 h-0.5 ${
                  ["intro", "neutral", "rightWink", "leftWink", "complete"].indexOf(step) > i
                    ? "bg-primary-hover"
                    : "bg-[#27272a]"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {step !== "intro" && step !== "complete" && (
          <div className="py-4">
            <Progress value={progress} className="h-1.5 bg-[#27272a] [&>div]:bg-primary" />
            <p className="text-xs text-muted-foreground text-center mt-2 font-mono">
              {progress < 100
                ? `Hold for ${Math.ceil((100 - progress) / 10) / 10}s...`
                : "✓ Sample collected!"}
            </p>
          </div>
        )}

        {/* Visual feedback for current step - Stitch Style */}
        <div className="flex justify-center py-6">
          {step === "complete" ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-glow">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <span className="font-semibold text-primary">Calibration Successful</span>
            </div>
          ) : step === "neutral" ? (
            <div className="flex items-center gap-4">
              <Eye className="w-12 h-12 text-primary" />
              <Eye className="w-12 h-12 text-primary" />
            </div>
          ) : step === "rightWink" ? (
            <div className="flex items-center gap-4">
              <Eye className="w-12 h-12 text-muted-foreground" />
              <EyeOff className="w-12 h-12 text-primary" />
            </div>
          ) : step === "leftWink" ? (
            <div className="flex items-center gap-4">
              <EyeOff className="w-12 h-12 text-primary" />
              <Eye className="w-12 h-12 text-muted-foreground" />
            </div>
          ) : null}
        </div>

        {/* Current thresholds preview - JetBrains Mono */}
        {step !== "intro" && (
          <div className="text-xs text-muted-foreground text-center font-mono bg-[#0c0e12] rounded p-2">
            Samples: Neutral {samples.neutralSamples.length} | Right {samples.rightWinkSamples.length} | Left{" "}
            {samples.leftWinkSamples.length}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "intro" ? (
            <>
              <Button
                variant="secondary"
                className="border-border bg-secondary hover:bg-muted"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold"
                onClick={handleStartCalibration}
              >
                Start Calibration
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                className="border-border bg-secondary hover:bg-muted"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold disabled:opacity-50"
                onClick={handleNextStep}
                disabled={!canProceed()}
              >
                {step === "complete" ? "Done" : "Next"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
