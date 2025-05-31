"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { evaluateExpression, formatExpressionResult } from "@/lib/math-parser"
import { Calculator } from "lucide-react"

interface SmartValueInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  placeholder?: string
  id?: string
  className?: string
}

export function SmartValueInput({
  label,
  value,
  onChange,
  placeholder = "0,00 ou 100+50-10",
  id,
  className,
}: SmartValueInputProps) {
  const [inputValue, setInputValue] = useState<string>(value ? value.toString() : "")
  const [showResult, setShowResult] = useState<string>("")

  useEffect(() => {
    if (value && value !== 0) {
      setInputValue(value.toString())
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Mostrar resultado da expressão em tempo real (apenas visualmente)
    if (newValue.includes("+") || newValue.includes("-") || newValue.includes("*") || newValue.includes("/")) {
      const result = formatExpressionResult(newValue)
      setShowResult(result)
    } else {
      setShowResult("")
    }
  }

  const handleBlur = () => {
    // Ao sair do campo, avaliar a expressão e definir o valor final
    const result = evaluateExpression(inputValue)

    if (result !== null) {
      onChange(result)
      setInputValue(result.toString())
      setShowResult("")
    } else {
      // Se não for uma expressão válida, tentar converter para número
      const numValue = Number.parseFloat(inputValue.replace(",", "."))
      if (!isNaN(numValue)) {
        onChange(numValue)
        setInputValue(numValue.toString())
      }
      setShowResult("")
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2">
        <Calculator className="h-4 w-4" />
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={className}
        />
        {showResult && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground bg-background px-2 rounded border">
            = {showResult}
          </div>
        )}
      </div>
    </div>
  )
}
