import type { RecurrenceType } from "@/types/financial-data"

export const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: "none", label: "Não recorrente" },
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "yearly", label: "Anual" },
]

export const DEFAULT_CATEGORY_COLOR = "#6B7280"

// Add other constants here as needed, for example:
// export const ASSET_TYPES = [...]
// export const ESSENTIAL_TYPES = [...]
