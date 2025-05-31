"use client"
import { useToast } from "@/hooks/use-toast"
import { ToastComponent } from "@/components/ui/toast"

export function Toaster() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}
