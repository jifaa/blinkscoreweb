import * as React from "react"
import { cn } from "../../lib/utils"

/* Label with Stitch typography */
const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium text-[text-foreground] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
