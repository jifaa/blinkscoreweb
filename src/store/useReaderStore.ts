import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CalibrationThresholds {
  highThreshold: number
  lowThreshold: number
  winkDuration: number
  cooldown: number
}

export interface CameraSettings {
  deviceId: string | null
  mirrored: boolean
  showOverlay: boolean
  showDebugScores: boolean
}

export interface NavigationSettings {
  soundEnabled: boolean
  visualFeedback: boolean
}

export interface ReaderSettings {
  calibration: CalibrationThresholds
  camera: CameraSettings
  navigation: NavigationSettings
  isCalibrated: boolean
}

interface ReaderState {
  // PDF state
  pdfUrl: string | null
  pdfFileName: string | null
  currentPage: number
  totalPages: number
  fitMode: 'width' | 'height' | 'auto'

  // Camera state
  isCameraActive: boolean
  cameraPermission: 'pending' | 'granted' | 'denied' | 'unavailable'

  // Performance mode
  isPerformanceMode: boolean
  isFullscreen: boolean

  // Settings
  settings: ReaderSettings

  // Actions
  setPdf: (url: string | null, fileName: string | null, totalPages: number) => void
  setCurrentPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setFitMode: (mode: 'width' | 'height' | 'auto') => void

  setCameraActive: (active: boolean) => void
  setCameraPermission: (permission: 'pending' | 'granted' | 'denied' | 'unavailable') => void

  setPerformanceMode: (enabled: boolean) => void
  setFullscreen: (enabled: boolean) => void

  updateCalibration: (calibration: Partial<CalibrationThresholds>) => void
  updateCameraSettings: (settings: Partial<CameraSettings>) => void
  updateNavigationSettings: (settings: Partial<NavigationSettings>) => void
  setCalibrated: (calibrated: boolean) => void
  resetSettings: () => void
}

const defaultSettings: ReaderSettings = {
  calibration: {
    highThreshold: 0.6,
    lowThreshold: 0.2,
    winkDuration: 200,
    cooldown: 800,
  },
  camera: {
    deviceId: null,
    mirrored: true,
    showOverlay: true,
    showDebugScores: false,
  },
  navigation: {
    soundEnabled: true,
    visualFeedback: true,
  },
  isCalibrated: false,
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      // Initial state
      pdfUrl: null,
      pdfFileName: null,
      currentPage: 1,
      totalPages: 0,
      fitMode: 'width',

      isCameraActive: false,
      cameraPermission: 'pending',

      isPerformanceMode: false,
      isFullscreen: false,

      settings: defaultSettings,

      // Actions
      setPdf: (url, fileName, totalPages) =>
        set({ pdfUrl: url, pdfFileName: fileName, totalPages, currentPage: 1 }),

      setCurrentPage: (page) => {
        const { totalPages } = get()
        if (page >= 1 && page <= totalPages) {
          set({ currentPage: page })
        }
      },

      nextPage: () => {
        const { currentPage, totalPages } = get()
        if (currentPage < totalPages) {
          set({ currentPage: currentPage + 1 })
        }
      },

      prevPage: () => {
        const { currentPage } = get()
        if (currentPage > 1) {
          set({ currentPage: currentPage - 1 })
        }
      },

      setFitMode: (mode) => set({ fitMode: mode }),

      setCameraActive: (active) => set({ isCameraActive: active }),

      setCameraPermission: (permission) => set({ cameraPermission: permission }),

      setPerformanceMode: (enabled) => set({ isPerformanceMode: enabled }),

      setFullscreen: (enabled) => set({ isFullscreen: enabled }),

      updateCalibration: (calibration) =>
        set((state) => ({
          settings: {
            ...state.settings,
            calibration: { ...state.settings.calibration, ...calibration },
          },
        })),

      updateCameraSettings: (cameraSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            camera: { ...state.settings.camera, ...cameraSettings },
          },
        })),

      updateNavigationSettings: (navigationSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            navigation: { ...state.settings.navigation, ...navigationSettings },
          },
        })),

      setCalibrated: (calibrated) =>
        set((state) => ({
          settings: { ...state.settings, isCalibrated: calibrated },
        })),

      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'blinkscore-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
)
