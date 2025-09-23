import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'sharp' | 'minimal' | 'section'
  }
>(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: "rounded-xl border bg-card text-card-foreground shadow",
    sharp: "border-2 bg-card text-card-foreground border-zinc-200 dark:border-zinc-800",
    minimal: "bg-card text-card-foreground",
    section: "border-l-4 border-l-blue-500 bg-card/30 text-card-foreground pl-6 py-4"
  }

  return (
    <div
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'sharp' | 'minimal'
  }
>(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: "flex flex-col space-y-1.5 p-6",
    sharp: "flex flex-col space-y-3 p-0 mb-6",
    minimal: "flex flex-col space-y-2 p-0 mb-4"
  }

  return (
    <div
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    />
  )
})
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'sharp' | 'minimal'
  }
>(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: "p-6 pt-0",
    sharp: "p-0",
    minimal: "p-0"
  }

  return (
    <div ref={ref} className={cn(variants[variant], className)} {...props} />
  )
})
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
