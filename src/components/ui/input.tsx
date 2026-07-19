import * as React from "react"
import { cn } from "../../lib/utils"

/* Text input based on Linear's text-input component (DESIGN.md) */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md bg-surface-1 text-ink placeholder:text-ink-tertiary",
        "border border-hairline px-3 py-1 text-sm transition-colors",
        "focus:outline-none focus:border-primary-focus focus:ring-2 focus:ring-primary-focus/50 focus:ring-offset-1 focus:ring-offset-canvas",
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
