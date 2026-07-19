export interface FaceBlinkScores {
  leftEye: number
  rightEye: number
  timestamp: number
}

export interface EyeLandmarks {
  left: { x: number; y: number }[]
  right: { x: number; y: number }[]
}

export interface FaceDetectionResult {
  blendshapes: FaceBlinkScores
  landmarks: EyeLandmarks | null
  faceDetected: boolean
}

export type WinkDirection = 'left' | 'right' | 'none'

export interface WinkEvent {
  direction: WinkDirection
  confidence: number
  timestamp: number
}

export interface CalibrationData {
  neutralSamples: FaceBlinkScores[]
  leftWinkSamples: FaceBlinkScores[]
  rightWinkSamples: FaceBlinkScores[]
}

export interface CalibrationResult {
  highThreshold: number
  lowThreshold: number
  recommendedDuration: number
}

export interface CameraDevice {
  deviceId: string
  label: string
}
