"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "../../lib/utils"

/* Switch with Stitch Performance Emerald design */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
      "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[bg-primary] focus-visible:ring-offset-2 focus-visible:ring-offset-[bg-background]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-[bg-primary] data-[state=unchecked]:bg-[bg-border]",
      className
    )}
    {...props}
    ref={ref}
  >
    {/* Thumb: dark circle with emerald glow when checked */}
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-[text-foreground] shadow-sm ring-0",
        "transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 data-[state=checked]:bg-[text-primary-foreground]",
        "data-[state=checked]:shadow-[0_0_8px_rgba(16,185,129,0.5)]"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
