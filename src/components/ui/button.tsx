import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

/* Button variants based on Stitch Performance Emerald design system */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* PRIMARY - Performance Emerald CTA per Stitch design */
        default: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-focus font-semibold",
        /* DESTRUCTIVE - Red for destructive actions */
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        /* SECONDARY - Ghost border style per Stitch */
        secondary: "bg-secondary text-secondary-foreground border border-border hover:bg-accent hover:border-border",
        /* TERTIARY - Plain text button */
        ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary",
        /* LINK - Text link with emerald accent */
        link: "text-primary underline-offset-4 hover:underline",
        /* INVERSE - High contrast for special CTAs */
        inverse: "bg-foreground text-background hover:bg-foreground/90",
      },
      size: {
        default: "h-9 px-4 py-2 text-sm rounded-[4px]",
        sm: "h-8 px-3 text-xs rounded-[4px]",
        lg: "h-11 px-6 text-sm rounded-[4px]",
        icon: "h-9 w-9 rounded-[4px]",
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
