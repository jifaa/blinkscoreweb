import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

/* Button variants based on Linear's button system (DESIGN.md) */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* PRIMARY - Lavender CTA per DESIGN.md button-primary */
        default: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-focus",
        /* DESTRUCTIVE - Red for destructive actions */
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        /* SECONDARY - Charcoal button per DESIGN.md button-secondary */
        secondary: "bg-surface-1 text-ink border border-hairline hover:bg-surface-2 hover:border-hairline-strong",
        /* TERTIARY - Plain text button per DESIGN.md button-tertiary */
        ghost: "bg-transparent text-ink hover:bg-surface-1",
        /* LINK - Text link with primary accent */
        link: "text-primary underline-offset-4 hover:underline",
        /* INVERSE - White-on-dark per DESIGN.md button-inverse */
        inverse: "bg-white text-black hover:bg-white/90",
      },
      size: {
        default: "h-9 px-4 py-2 text-button rounded-md",
        sm: "h-8 px-3 text-xs rounded-md",
        lg: "h-11 px-6 text-button rounded-md", /* >= 40px tap height per DESIGN.md */
        icon: "h-9 w-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
