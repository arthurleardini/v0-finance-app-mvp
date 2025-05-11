"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlanningTab } from "@/components/planning-tab"
import { TransactionsTab } from "@/components/transactions-tab"
import { ReportsTab } from "@/components/reports-tab"
import { AssetsTab } from "@/components/assets-tab"
import { Header } from "@/components/header"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { generateId } from "@/lib/utils"
import type { FinancialData, PlannedIncome, PlannedExpense, Transaction, Asset } from "@/types/financial-data"

// Atualizar o initialFinancialData para incluir os novos campos
const initialFinancialData: FinancialData = {
  plannedIncomes: [],
  plannedExpenses: [],
  transactions: [],
  assets: [],
}

export function FinanceApp() {
  const [financialData, setFinancialData] = useLocalStorage<FinancialData>("financial-data", initialFinancialData)
  const [activeTab, setActiveTab] = useState("planejamento")
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date()
      .toISOString()
      .substring(0, 7), // YYYY-MM format
  )

  // Funções para manipular dados de planejamento
  const addPlannedIncome = (income: Omit<PlannedIncome, "id">) => {
    const newIncome: PlannedIncome = {
      ...income,
      id: generateId(),
    }
    setFinancialData({
      ...financialData,
      plannedIncomes: [...financialData.plannedIncomes, newIncome],
    })
  }

  const updatePlannedIncome = (id: string, income: Omit<PlannedIncome, "id">) => {
    const updatedIncomes = financialData.plannedIncomes.map((item) => (item.id === id ? { ...income, id } : item))
    setFinancialData({
      ...financialData,
      plannedIncomes: updatedIncomes,
    })
  }

  const deletePlannedIncome = (id: string) => {
    const updatedIncomes = financialData.plannedIncomes.filter((item) => item.id !== id)
    setFinancialData({
      ...financialData,
      plannedIncomes: updatedIncomes,
    })
  }

  const addPlannedExpense = (expense: Omit<PlannedExpense, "id">) => {
    const newExpense: PlannedExpense = {
      ...expense,
      id: generateId(),
    }
    setFinancialData({
      ...financialData,
      plannedExpenses: [...financialData.plannedExpenses, newExpense],
    })
  }

  const updatePlannedExpense = (id: string, expense: Omit<PlannedExpense, "id">) => {
    const updatedExpenses = financialData.plannedExpenses.map((item) => (item.id === id ? { ...expense, id } : item))
    setFinancialData({
      ...financialData,
      plannedExpenses: updatedExpenses,
    })
  }

  const deletePlannedExpense = (id: string) => {
    const updatedExpenses = financialData.plannedExpenses.filter((item) => item.id !== id)
    setFinancialData({
      ...financialData,
      plannedExpenses: updatedExpenses,
    })
  }

  // Funções para manipular transações
  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
    }
    setFinancialData({
      ...financialData,
      transactions: [...financialData.transactions, newTransaction],
    })
  }

  const updateTransaction = (id: string, transaction: Omit<Transaction, "id">) => {
    const updatedTransactions = financialData.transactions.map((item) =>
      item.id === id ? { ...transaction, id } : item,
    )
    setFinancialData({
      ...financialData,
      transactions: updatedTransactions,
    })
  }

  const deleteTransaction = (id: string) => {
    const updatedTransactions = financialData.transactions.filter((item) => item.id !== id)
    setFinancialData({
      ...financialData,
      transactions: updatedTransactions,
    })
  }

  // Funções para manipular ativos
  const addAsset = (asset: Omit<Asset, "id">) => {
    const newAsset: Asset = {
      ...asset,
      id: generateId(),
    }
    setFinancialData({
      ...financialData,
      assets: [...financialData.assets, newAsset],
    })
  }

  const updateAsset = (id: string, asset: Omit<Asset, "id">) => {
    const updatedAssets = financialData.assets.map((item) => (item.id === id ? { ...asset, id } : item))
    setFinancialData({
      ...financialData,
      assets: updatedAssets,
    })
  }

  const deleteAsset = (id: string) => {
    const updatedAssets = financialData.assets.filter((item) => item.id !== id)
    setFinancialData({
      ...financialData,
      assets: updatedAssets,
    })
  }

  // Filtrar planejamentos pelo mês selecionado ou recorrentes
  const filteredPlannedIncomes = financialData.plannedIncomes.filter((income) => {
    // Incluir se for recorrente (exceto "none")
    if (income.recurrence !== "none") return true

    // Incluir se o mês da data corresponder ao mês selecionado
    return income.date.substring(0, 7) === selectedMonth
  })

  const filteredPlannedExpenses = financialData.plannedExpenses.filter((expense) => {
    // Incluir se for recorrente (exceto "none")
    if (expense.recurrence !== "none") return true

    // Incluir se o mês da data corresponder ao mês selecionado
    return expense.date.substring(0, 7) === selectedMonth
  })

  // Filtrar transações pelo mês selecionado
  const filteredTransactions = financialData.transactions.filter(
    (transaction) => transaction.date.substring(0, 7) === selectedMonth,
  )

  // Cálculos financeiros
  const totalPlannedIncome = filteredPlannedIncomes.reduce((sum, income) => sum + income.amount, 0)
  const totalPlannedExpense = filteredPlannedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const plannedBalance = totalPlannedIncome - totalPlannedExpense

  // Total de ativos
  const totalAssets = financialData.assets.reduce((sum, asset) => sum + asset.amount, 0)
  const totalHighLiquidityAssets = financialData.assets
    .filter((asset) => asset.liquidity === "high")
    .reduce((sum, asset) => sum + asset.amount, 0)
  const totalLowLiquidityAssets = financialData.assets
    .filter((asset) => asset.liquidity === "low")
    .reduce((sum, asset) => sum + asset.amount, 0)

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <Header />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="planejamento">Planejamento</TabsTrigger>
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
          <TabsTrigger value="ativos">Ativos</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>
        <TabsContent value="planejamento">
          <PlanningTab
            plannedIncomes={filteredPlannedIncomes}
            plannedExpenses={filteredPlannedExpenses}
            addPlannedIncome={addPlannedIncome}
            updatePlannedIncome={updatePlannedIncome}
            deletePlannedIncome={deletePlannedIncome}
            addPlannedExpense={addPlannedExpense}
            updatePlannedExpense={updatePlannedExpense}
            deletePlannedExpense={deletePlannedExpense}
            totalPlannedIncome={totalPlannedIncome}
            totalPlannedExpense={totalPlannedExpense}
            plannedBalance={plannedBalance}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
          />
        </TabsContent>
        <TabsContent value="transacoes">
          <TransactionsTab
            transactions={filteredTransactions}
            plannedIncomes={filteredPlannedIncomes}
            plannedExpenses={filteredPlannedExpenses}
            addTransaction={addTransaction}
            updateTransaction={updateTransaction}
            deleteTransaction={deleteTransaction}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
          />
        </TabsContent>
        <TabsContent value="ativos">
          <AssetsTab
            assets={financialData.assets}
            addAsset={addAsset}
            updateAsset={updateAsset}
            deleteAsset={deleteAsset}
            totalAssets={totalAssets}
            totalHighLiquidityAssets={totalHighLiquidityAssets}
            totalLowLiquidityAssets={totalLowLiquidityAssets}
          />
        </TabsContent>
        <TabsContent value="relatorios">
          <ReportsTab
            transactions={filteredTransactions}
            plannedIncomes={filteredPlannedIncomes}
            plannedExpenses={filteredPlannedExpenses}
            assets={financialData.assets}
            totalPlannedIncome={totalPlannedIncome}
            totalPlannedExpense={totalPlannedExpense}
            plannedBalance={plannedBalance}
            totalAssets={totalAssets}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
