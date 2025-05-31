"use client"

import type React from "react"
import { useState, useCallback } from "react"
import type { FormErrors } from "@/lib/validation"

export type { FormErrors }

interface UseItemFormConfig<T> {
  initialState: T
  validateFunction: (formData: T) => FormErrors<T>
  onSubmitCallback: (formData: T) => Promise<void>
}

export function useItemForm<T extends Record<string, any>>({
  initialState,
  validateFunction,
  onSubmitCallback,
}: UseItemFormConfig<T>) {
  const [formData, setFormData] = useState<T>(initialState)
  const [formErrors, setFormErrors] = useState<FormErrors<T>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = useCallback(
    (newInitialState?: T) => {
      const stateToUse = newInitialState || initialState
      setFormData(stateToUse)
      setFormErrors({})
      setIsSubmitting(false)
    },
    [initialState],
  )

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Limpar erro do campo quando ele é alterado
    setFormErrors((prev) => {
      if (prev[field]) {
        const { [field]: _, ...rest } = prev
        return rest
      }
      return prev
    })
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target

      let processedValue: any = value

      // Processar diferentes tipos de input
      if (type === "number") {
        processedValue = value === "" ? 0 : Number.parseFloat(value)
      } else if (type === "checkbox") {
        processedValue = (e.target as HTMLInputElement).checked
      } else if (type === "date") {
        processedValue = value
      }

      setFieldValue(name as keyof T, processedValue)
    },
    [setFieldValue],
  )

  const validateForm = useCallback(() => {
    const errors = validateFunction(formData)
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData, validateFunction])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }

      if (!validateForm()) {
        return false
      }

      setIsSubmitting(true)
      try {
        await onSubmitCallback(formData)
        return true
      } catch (error) {
        console.error("Erro ao enviar formulário:", error)
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, onSubmitCallback, validateForm],
  )

  return {
    formData,
    formErrors,
    isSubmitting,
    handleInputChange,
    setFieldValue,
    handleSubmit,
    resetForm,
    setFormData,
    validateForm,
  }
}
