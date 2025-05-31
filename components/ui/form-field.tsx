"use client"

import type React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  id: string
  label: string
  error?: string
  required?: boolean
  className?: string
  children?: React.ReactNode
}

interface FormInputProps extends FormFieldProps {
  type?: string
  placeholder?: string
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  name?: string
}

interface FormTextareaProps extends FormFieldProps {
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number
  name?: string
}

interface FormSelectProps extends FormFieldProps {
  placeholder?: string
  value: string
  onValueChange: (value: string) => void
  options?: { value: string; label: string }[]
}

// Componente base para campos de formulário
export function FormField({ id, label, error, required, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="obrigatório">
            *
          </span>
        )}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  )
}

// Campo de input
export function FormInput({
  id,
  label,
  error,
  required,
  className,
  type = "text",
  placeholder,
  value,
  onChange,
  name,
}: FormInputProps) {
  return (
    <FormField id={id} label={label} error={error} required={required} className={className}>
      <Input
        id={id}
        name={name || id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn(error && "border-red-500 focus:border-red-500")}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </FormField>
  )
}

// Campo de textarea
export function FormTextarea({
  id,
  label,
  error,
  required,
  className,
  placeholder,
  value,
  onChange,
  rows = 3,
  name,
}: FormTextareaProps) {
  return (
    <FormField id={id} label={label} error={error} required={required} className={className}>
      <Textarea
        id={id}
        name={name || id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className={cn(error && "border-red-500 focus:border-red-500")}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </FormField>
  )
}

// Campo de select
export function FormSelect({
  id,
  label,
  error,
  required,
  className,
  placeholder,
  value,
  onValueChange,
  options = [],
  children,
}: FormSelectProps) {
  return (
    <FormField id={id} label={label} error={error} required={required} className={className}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          id={id}
          className={cn(error && "border-red-500 focus:border-red-500")}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
          {children}
        </SelectContent>
      </Select>
    </FormField>
  )
}
