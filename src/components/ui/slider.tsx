import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "../../lib/utils"

/* Slider with Stitch Performance Emerald design */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    {/* Track: subtle background */}
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[bg-border]">
      {/* Range: Performance Emerald */}
      <SliderPrimitive.Range className="absolute h-full bg-[bg-primary]" />
    </SliderPrimitive.Track>
    {/* Thumb: Stitch style with emerald focus */}
    <SliderPrimitive.Thumb className={cn(
      "block h-4 w-4 rounded-full border border-[bg-muted] bg-[bg-secondary]",
      "transition-all hover:border-[bg-primary] hover:shadow-[0_0_8px_rgba(16,185,129,0.3)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[bg-primary] focus-visible:ring-offset-2 focus-visible:ring-offset-[bg-background]",
      "disabled:pointer-events-none disabled:opacity-50"
    )} />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
