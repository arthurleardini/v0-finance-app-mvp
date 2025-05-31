"use client"

import { useState, useCallback } from "react"

export interface Toast {
  id: string
  title?: string
  description: string
  variant?: "default" | "success" | "error" | "warning"
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

let toastCounter = 0

export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] })

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${++toastCounter}`
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    }

    setState((prev) => ({
      toasts: [...prev.toasts, newToast],
    }))

    // Auto remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setState((prev) => ({
      toasts: prev.toasts.filter((toast) => toast.id !== id),
    }))
  }, [])

  const toast = useCallback(
    (props: Omit<Toast, "id">) => {
      return addToast(props)
    },
    [addToast],
  )

  // Convenience methods
  const success = useCallback(
    (description: string, title?: string) => {
      return toast({ description, title, variant: "success" })
    },
    [toast],
  )

  const error = useCallback(
    (description: string, title?: string) => {
      return toast({ description, title, variant: "error" })
    },
    [toast],
  )

  const warning = useCallback(
    (description: string, title?: string) => {
      return toast({ description, title, variant: "warning" })
    },
    [toast],
  )

  return {
    toasts: state.toasts,
    toast,
    success,
    error,
    warning,
    removeToast,
  }
}
