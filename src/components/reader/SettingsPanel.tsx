"use client"

import { Settings, Sliders, Camera, Eye, Volume2, VolumeX } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Slider } from "~/components/ui/slider"
import { Switch } from "~/components/ui/switch"
import { Label } from "~/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet"
import { useReaderStore } from "~/store/useReaderStore"
import { useCameraDevices } from "~/components/reader/CameraPermissionDialog"

interface SettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRecalibrate: () => void
}

export function SettingsPanel({ open, onOpenChange, onRecalibrate }: SettingsPanelProps) {
  const {
    settings,
    updateCalibration,
    updateCameraSettings,
    updateNavigationSettings,
    resetSettings,
  } = useReaderStore()

  const { calibration, camera, navigation, isCalibrated } = settings
  const { devices, isLoading: devicesLoading } = useCameraDevices()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </SheetTitle>
          <SheetDescription>Configure camera, calibration, and navigation settings.</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="camera" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="camera" className="flex-1">
              <Camera className="w-4 h-4 mr-2" />
              Camera
            </TabsTrigger>
            <TabsTrigger value="calibration" className="flex-1">
              <Sliders className="w-4 h-4 mr-2" />
              Wink
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex-1">
              Feedback
            </TabsTrigger>
          </TabsList>

          {/* Camera Settings */}
          <TabsContent value="camera" className="space-y-6 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="camera-select">Camera Device</Label>
                <select
                  id="camera-select"
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={camera.deviceId || ""}
                  onChange={(e) => updateCameraSettings({ deviceId: e.target.value || null })}
                  disabled={devicesLoading}
                >
                  <option value="">Default Camera</option>
                  {devices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mirror-toggle">Mirror Preview</Label>
                  <p className="text-sm text-muted-foreground">Flip the camera horizontally</p>
                </div>
                <Switch
                  id="mirror-toggle"
                  checked={camera.mirrored}
                  onCheckedChange={(checked) => updateCameraSettings({ mirrored: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="overlay-toggle">Show Landmark Overlay</Label>
                  <p className="text-sm text-muted-foreground">Display eye tracking points</p>
                </div>
                <Switch
                  id="overlay-toggle"
                  checked={camera.showOverlay}
                  onCheckedChange={(checked) => updateCameraSettings({ showOverlay: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="debug-toggle">Show Debug Scores</Label>
                  <p className="text-sm text-muted-foreground">Display eye blink values</p>
                </div>
                <Switch
                  id="debug-toggle"
                  checked={camera.showDebugScores}
                  onCheckedChange={(checked) => updateCameraSettings({ showDebugScores: checked })}
                />
              </div>
            </div>
          </TabsContent>

          {/* Wink/Calibration Settings */}
          <TabsContent value="calibration" className="space-y-6 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Calibration Status</Label>
                  <p className="text-sm text-muted-foreground">
                    {isCalibrated ? "Calibrated for your eyes" : "Not yet calibrated"}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={onRecalibrate}>
                  {isCalibrated ? "Recalibrate" : "Calibrate"}
                </Button>
              </div>

              <div className="pt-4 border-t space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Wink Threshold (High)</Label>
                    <span className="text-sm text-muted-foreground">{calibration.highThreshold.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[calibration.highThreshold]}
                    onValueChange={([value]) => updateCalibration({ highThreshold: value })}
                    min={0.3}
                    max={0.9}
                    step={0.05}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Eye is considered &quot;closed&quot; when above this value
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Wink Threshold (Low)</Label>
                    <span className="text-sm text-muted-foreground">{calibration.lowThreshold.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[calibration.lowThreshold]}
                    onValueChange={([value]) => updateCalibration({ lowThreshold: value })}
                    min={0.05}
                    max={0.4}
                    step={0.05}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Eye is considered &quot;open&quot; when below this value
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Wink Duration</Label>
                    <span className="text-sm text-muted-foreground">{calibration.winkDuration}ms</span>
                  </div>
                  <Slider
                    value={[calibration.winkDuration]}
                    onValueChange={([value]) => updateCalibration({ winkDuration: value })}
                    min={100}
                    max={500}
                    step={50}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    How long a wink must last before triggering
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Cooldown</Label>
                    <span className="text-sm text-muted-foreground">{calibration.cooldown}ms</span>
                  </div>
                  <Slider
                    value={[calibration.cooldown]}
                    onValueChange={([value]) => updateCalibration({ cooldown: value })}
                    min={300}
                    max={2000}
                    step={100}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Wait time between page turns
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Feedback Settings */}
          <TabsContent value="feedback" className="space-y-6 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="visual-toggle" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Visual Feedback
                  </Label>
                  <p className="text-sm text-muted-foreground">Show toast notification on page turn</p>
                </div>
                <Switch
                  id="visual-toggle"
                  checked={navigation.visualFeedback}
                  onCheckedChange={(checked) => updateNavigationSettings({ visualFeedback: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound-toggle" className="flex items-center gap-2">
                    {navigation.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    Sound Feedback
                  </Label>
                  <p className="text-sm text-muted-foreground">Play a subtle tone on page turn</p>
                </div>
                <Switch
                  id="sound-toggle"
                  checked={navigation.soundEnabled}
                  onCheckedChange={(checked) => updateNavigationSettings({ soundEnabled: checked })}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button variant="secondary" className="w-full" onClick={resetSettings}>
                Reset to Defaults
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
