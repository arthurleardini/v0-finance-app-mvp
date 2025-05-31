"use client"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Toast } from "@/hooks/use-toast"

interface ToastProps {
  toast: Toast
  onRemove: (id: string) => void
}

const variantStyles = {
  default: "bg-white border-gray-200 text-gray-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  error: "bg-red-50 border-red-200 text-red-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
}

const variantIcons = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
}

export function ToastComponent({ toast, onRemove }: ToastProps) {
  const Icon = variantIcons[toast.variant || "default"]

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm w-full",
        "animate-in slide-in-from-right-full duration-300",
        variantStyles[toast.variant || "default"],
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        {toast.title && <h4 className="font-semibold text-sm">{toast.title}</h4>}
        <p className="text-sm">{toast.description}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 p-0 hover:bg-black/10"
        onClick={() => onRemove(toast.id)}
        aria-label="Fechar notificação"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
