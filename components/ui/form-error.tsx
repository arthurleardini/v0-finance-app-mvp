"use client"

import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormErrorProps {
  error?: string
  className?: string
  showIcon?: boolean
}

export function FormError({ error, className, showIcon = false }: FormErrorProps) {
  if (!error) return null

  return (
    <div className={cn("flex items-center gap-1 text-xs text-red-500 mt-1", className)} role="alert" aria-live="polite">
      {showIcon && <AlertCircle className="h-3 w-3 flex-shrink-0" />}
      <span>{error}</span>
    </div>
  )
}
