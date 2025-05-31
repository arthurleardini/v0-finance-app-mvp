export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly"
export type LiquidityType = "high" | "low"
export type TransactionStatus = "planned" | "realized" | "unplanned"
export type CategoryType = "income" | "expense"
export type EssentialType = "essential" | "non-essential"
export type AssetType = "asset" | "liability"

export interface Category {
  id: string
  name: string
  type: CategoryType
  essential: EssentialType
  color?: string
  isDefault: boolean
  createdAt: string
}

export interface PlannedIncome {
  id: string
  description: string
  amount: number
  date: string
  categoryId: string
  assetId: string
  recurrence: RecurrenceType
  isRealized: boolean
  realizedAmount?: number
  realizedDate?: string
  realizedTransactionId?: string
}

export interface PlannedExpense {
  id: string
  description: string
  categoryId: string
  assetId: string
  amount: number
  date: string
  recurrence: RecurrenceType
  isRealized: boolean
  realizedAmount?: number
  realizedDate?: string
  realizedTransactionId?: string
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: "income" | "expense" | "transfer"
  categoryId: string
  assetId: string
  targetAssetId?: string // Para transferências
  status: TransactionStatus
  plannedItemId?: string // Referência ao item planejado que originou esta transação
  nubankId?: string // ID do Nubank para evitar duplicatas
  transactionHash?: string // Hash para detecção de duplicatas unificada
  notes?: string
  isInternal?: boolean // Para marcar transações internas (transferências entre ativos próprios)
  originalImportType?: "bank" | "credit_card" // Adicionar esta linha
}

export interface Asset {
  id: string
  name: string
  amount: number
  type: string // "bank", "investment", "receivable", "reserve", "cash", "credit_card", "loan", "financing"
  assetType: AssetType // "asset" ou "liability"
  liquidity: LiquidityType
  notes?: string
  lastUpdated: string
  isActive: boolean
  dueDate?: string // Para passivos: data de vencimento mensal
}

export interface GamificationState {
  currentLevel: number
  lastInteraction: string
  streak: number
  totalInteractions: number
  cityState: {
    buildings: number
    population: number
    happiness: number
  }
}

export interface UserSettings {
  currency: string
  defaultAssetId?: string
  categories: Category[]
  gamificationEnabled: boolean
  categoryMappings?: Record<string, string> // { [description: string]: categoryId }
}

export interface FinancialData {
  plannedIncomes: PlannedIncome[]
  plannedExpenses: PlannedExpense[]
  transactions: Transaction[]
  assets: Asset[]
  gamificationState: GamificationState
  userSettings: UserSettings
}
