import * as React from "react"
import { cn } from "../../lib/utils"

/* Text input based on Stitch's technical input design */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-sm bg-[bg-secondary] text-[text-foreground] placeholder:text-[text-muted-foreground]",
        "border border-[bg-border] px-3 py-1 text-sm transition-all font-mono",
        "focus:outline-none focus:border-[bg-primary] focus:ring-2 focus:ring-[bg-primary]/30 focus:ring-offset-1 focus:ring-offset-[bg-card-foreground]",
        "hover:border-[bg-muted]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
