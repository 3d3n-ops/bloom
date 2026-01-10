"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SheetContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextValue | undefined>(undefined)

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Sheet = ({ open: controlledOpen, onOpenChange, children }: SheetProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const handleOpenChange = onOpenChange ?? setInternalOpen

  return (
    <SheetContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </SheetContext.Provider>
  )
}

const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, children, onClick, ...props }, ref) => {
  const context = React.useContext(SheetContext)
  if (!context) throw new Error("SheetTrigger must be used within Sheet")

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context.onOpenChange(true)
    onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick, ref } as any)
  }

  return (
    <button ref={ref} onClick={handleClick} {...props}>
      {children}
    </button>
  )
})
SheetTrigger.displayName = "SheetTrigger"

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: "top" | "right" | "bottom" | "left" }
>(({ side = "right", className, children, ...props }, ref) => {
  const context = React.useContext(SheetContext)
  if (!context) throw new Error("SheetContent must be used within Sheet")

  if (!context.open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/80 animate-in fade-in-0"
        onClick={() => context.onOpenChange(false)}
      />
      <div
        ref={ref}
        className={cn(
          "fixed z-50 bg-white shadow-lg transition-transform duration-300",
          side === "right" && "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm animate-in slide-in-from-right",
          side === "left" && "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm animate-in slide-in-from-left",
          className
        )}
        {...props}
      >
        <button
          onClick={() => context.onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </>
  )
})
SheetContent.displayName = "SheetContent"

export { Sheet, SheetTrigger, SheetContent }

