import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glass hover:shadow-glow",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-glass-sm",
        outline: "border border-border bg-transparent hover:bg-secondary/50 text-foreground backdrop-blur-sm",
        secondary: "bg-secondary/80 text-secondary-foreground hover:bg-secondary backdrop-blur-sm border border-border/50",
        ghost: "hover:bg-secondary/60 text-muted-foreground hover:text-foreground backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-hero text-white shadow-glow hover:shadow-[0_0_60px_hsla(217,91%,60%,0.4)] hover:scale-[1.02] active:scale-[0.98] font-semibold",
        glow: "bg-primary text-primary-foreground shadow-glow hover:shadow-[0_0_60px_hsla(217,91%,60%,0.5)] animate-pulse-glow",
        glass: "glass text-foreground hover:bg-secondary/40 hover:border-primary/30",
        "glass-primary": "glass border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow-accent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg font-semibold",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
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
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
