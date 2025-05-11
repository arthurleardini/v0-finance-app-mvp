export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly"
export type LiquidityType = "high" | "low"

export interface PlannedIncome {
  id: string
  description: string
  amount: number
  date: string
  category: string
  recurrence: RecurrenceType
}

export interface PlannedExpense {
  id: string
  description: string
  category: string
  amount: number
  date: string
  recurrence: RecurrenceType
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
}

export interface Asset {
  id: string
  name: string
  amount: number
  type: string // "bank", "investment", "receivable", "reserve"
  liquidity: LiquidityType
  notes?: string
  lastUpdated: string
}

export interface FinancialData {
  plannedIncomes: PlannedIncome[]
  plannedExpenses: PlannedExpense[]
  transactions: Transaction[]
  assets: Asset[]
}
