"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from "@mediapipe/tasks-vision"
import type { FaceBlinkScores, EyeLandmarks } from "./types"

interface UseFaceLandmarkerOptions {
  deviceId?: string | null
  mirrored?: boolean
  onBlinkScores?: (scores: FaceBlinkScores) => void
  onLandmarks?: (landmarks: EyeLandmarks | null) => void
  onFaceDetected?: (detected: boolean) => void
  throttledFps?: number
}

interface UseFaceLandmarkerReturn {
  isLoading: boolean
  error: string | null
  isSupported: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  startCamera: () => Promise<void>
  stopCamera: () => void
  blinkScores: FaceBlinkScores | null
}

const LEFT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
const RIGHT_EYE_INDICES = [33, 160, 158, 133, 153, 144]

export function useFaceLandmarker({
  deviceId,
  mirrored = false,
  onBlinkScores,
  onLandmarks,
  onFaceDetected,
  throttledFps = 15,
}: UseFaceLandmarkerOptions): UseFaceLandmarkerReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const [blinkScores, setBlinkScores] = useState<FaceBlinkScores | null>(null)

  const landmarkerRef = useRef<FaceLandmarker | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number>(0)

  // Ref to store latest callbacks - updated on each render to avoid stale closures
  const callbacksRef = useRef({
    onBlinkScores: undefined as ((scores: FaceBlinkScores) => void) | undefined,
    onLandmarks: undefined as ((landmarks: EyeLandmarks | null) => void) | undefined,
    onFaceDetected: undefined as ((detected: boolean) => void) | undefined,
    throttledFps,
    mirrored,
  })

  // Keep callbacks ref updated with latest values
  useEffect(() => {
    callbacksRef.current = {
      onBlinkScores,
      onLandmarks,
      onFaceDetected,
      throttledFps,
      mirrored,
    }
  }, [onBlinkScores, onLandmarks, onFaceDetected, throttledFps, mirrored])

  // Initialize Face Landmarker
  useEffect(() => {
    const initLandmarker = async () => {
      try {
        // Pin to exact version to prevent unexpected behavior changes from CDN updates
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm"
        )
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        })
        landmarkerRef.current = landmarker
        setIsLoading(false)
      } catch (err) {
        console.error("Failed to initialize face landmarker:", err)
        setError("Failed to initialize face detection. Please refresh the page.")
        setIsSupported(false)
        setIsLoading(false)
      }
    }

    initLandmarker()

    return () => {
      if (landmarkerRef.current) {
        landmarkerRef.current.close()
      }
    }
  }, [])

  // Extract blink scores from blendshapes
  const extractBlinkScores = useCallback((blendshapes: FaceLandmarkerResult): FaceBlinkScores | null => {
    if (!blendshapes.faceBlendshapes || blendshapes.faceBlendshapes.length === 0) {
      return null
    }

    const face = blendshapes.faceBlendshapes[0]
    const categories = face.categories

    let leftEye = 0
    let rightEye = 0

    for (const category of categories) {
      if (category.categoryName === "eyeBlinkLeft") {
        leftEye = category.score || 0
      } else if (category.categoryName === "eyeBlinkRight") {
        rightEye = category.score || 0
      }
    }

    return {
      leftEye,
      rightEye,
      timestamp: Date.now(),
    }
  }, [])

  // Extract eye landmarks
  const extractEyeLandmarks = useCallback(
    (landmarks: { x: number; y: number; z: number }[]): EyeLandmarks | null => {
      if (!landmarks || landmarks.length < 478) return null

      return {
        left: LEFT_EYE_INDICES.map((i) => ({
          x: landmarks[i].x,
          y: landmarks[i].y,
        })),
        right: RIGHT_EYE_INDICES.map((i) => ({
          x: landmarks[i].x,
          y: landmarks[i].y,
        })),
      }
    },
    []
  )

  // Draw landmarks on canvas
  const drawLandmarks = useCallback(
    (landmarks: EyeLandmarks | null, width: number, height: number) => {
      if (!canvasRef.current || !landmarks) return

      const ctx = canvasRef.current.getContext("2d")
      if (!ctx) return

      ctx.clearRect(0, 0, width, height)

      // Draw eye landmarks
      const drawEye = (points: { x: number; y: number }[], color: string) => {
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()

        for (let i = 0; i < points.length; i++) {
          const x = callbacksRef.current.mirrored ? (1 - points[i].x) * width : points[i].x * width
          const y = points[i].y * height

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.closePath()
        ctx.stroke()

        // Draw points
        ctx.fillStyle = color
        for (const point of points) {
          const x = callbacksRef.current.mirrored ? (1 - point.x) * width : point.x * width
          const y = point.y * height
          ctx.beginPath()
          ctx.arc(x, y, 3, 0, 2 * Math.PI)
          ctx.fill()
        }
      }

      drawEye(landmarks.left, "#22c55e") // Green for left eye
      drawEye(landmarks.right, "#3b82f6") // Blue for right eye
    },
    [] // No dependencies - uses callbacksRef
  )

  // Ref to store the processFrame function for self-recursion
  const processFrameRef = useRef<((timestamp: number) => void) | null>(null)

  // Process frame - defined as a plain function to allow self-reference
  const processFrame = useCallback(
    (timestamp: number) => {
      if (!landmarkerRef.current || !videoRef.current) return

      const { throttledFps: fps } = callbacksRef.current
      const frameInterval = 1000 / fps
      if (timestamp - lastFrameTimeRef.current < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(processFrameRef.current!)
        return
      }
      lastFrameTimeRef.current = timestamp

      const video = videoRef.current
      if (video.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(processFrameRef.current!)
        return
      }

      try {
        const result: FaceLandmarkerResult = landmarkerRef.current.detectForVideo(video, timestamp)

        // Extract and report blink scores
        const scores = extractBlinkScores(result)
        if (scores) {
          setBlinkScores(scores)
          callbacksRef.current.onBlinkScores?.(scores)
        }

        // Extract and report landmarks
        const faceLandmarks = result.faceLandmarks?.[0] || null
        if (faceLandmarks) {
          const eyeLandmarks = extractEyeLandmarks(faceLandmarks)
          callbacksRef.current.onLandmarks?.(eyeLandmarks)

          // Draw on canvas
          if (canvasRef.current && video) {
            canvasRef.current.width = video.videoWidth
            canvasRef.current.height = video.videoHeight
            drawLandmarks(eyeLandmarks, video.videoWidth, video.videoHeight)
          }

          callbacksRef.current.onFaceDetected?.(true)
        } else {
          callbacksRef.current.onLandmarks?.(null)
          callbacksRef.current.onFaceDetected?.(false)
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d")
            ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          }
        }
      } catch (err) {
        console.error("Error processing frame:", err)
      }

      animationFrameRef.current = requestAnimationFrame(processFrameRef.current!)
    },
    [extractBlinkScores, extractEyeLandmarks, drawLandmarks] // No reactive dependencies - uses refs
  )

  // Keep processFrameRef updated
  useEffect(() => {
    processFrameRef.current = processFrame
  }, [processFrame])

  // Start camera
  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera not supported in this browser")
      return
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { width: { ideal: 640 }, height: { ideal: 480 } },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Start processing loop
      if (processFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(processFrameRef.current)
      }
    } catch (err) {
      console.error("Camera error:", err)
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError("Camera access denied. Please allow camera access.")
        } else if (err.name === "NotFoundError") {
          setError("No camera found. Please connect a camera.")
        } else {
          setError("Camera error: " + err.message)
        }
      } else {
        setError("Failed to start camera")
      }
    }
  }, [deviceId])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    isLoading,
    error,
    isSupported,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    blinkScores,
  }
}
