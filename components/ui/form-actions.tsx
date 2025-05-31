"use client"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormActionsProps {
  onCancel?: () => void
  onSubmit?: () => void
  isSubmitting?: boolean
  submitText?: string
  cancelText?: string
  submitVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  className?: string
  layout?: "horizontal" | "vertical"
  submitDisabled?: boolean
}

export function FormActions({
  onCancel,
  onSubmit,
  isSubmitting = false,
  submitText = "Salvar",
  cancelText = "Cancelar",
  submitVariant = "default",
  className,
  layout = "horizontal",
  submitDisabled = false,
}: FormActionsProps) {
  const containerClass = layout === "horizontal" ? "flex gap-2 pt-4" : "space-y-2 pt-4"

  return (
    <div className={cn(containerClass, className)}>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className={layout === "horizontal" ? "flex-1" : "w-full"}
        >
          {cancelText}
        </Button>
      )}
      {onSubmit && (
        <Button
          type="submit"
          variant={submitVariant}
          onClick={onSubmit}
          disabled={isSubmitting || submitDisabled}
          className={layout === "horizontal" ? "flex-1" : "w-full"}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            submitText
          )}
        </Button>
      )}
    </div>
  )
}
