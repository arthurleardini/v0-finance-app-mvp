"use client"

import { useState } from "react"
import { PlanningTab } from "@/components/planning-tab"
import { TransactionsTab } from "@/components/transactions-tab"
import { ReportsTab } from "@/components/reports-tab"
import { PatrimonioTab } from "@/components/patrimonio-tab"
import { PendingTab } from "@/components/pending-tab"
import { ConfigTab } from "@/components/config-tab"
import { ImportTab } from "@/components/import-tab"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { GamificationCity } from "@/components/gamification-city"
import { useFinancialData } from "@/hooks/use-financial-data"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import type { Transaction } from "@/types/financial-data" // Assuming Transaction type is here

export function FinanceApp() {
  const { data, loading, error, saveData, updateGamification } = useFinancialData()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando dados financeiros...</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Erro ao carregar dados financeiros"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Safely filter data with null checks and default values
  const filteredPlannedIncomes = (data.plannedIncomes || []).filter((income) => {
    if (!income || !income.date) return false
    if (income.recurrence !== "none") return true
    return income.date.substring(0, 7) === selectedMonth
  })

  const filteredPlannedExpenses = (data.plannedExpenses || []).filter((expense) => {
    if (!expense || !expense.date) return false
    if (expense.recurrence !== "none") return true
    return expense.date.substring(0, 7) === selectedMonth
  })

  const filteredTransactions = (data.transactions || []).filter((transaction) => {
    if (!transaction || !transaction.date) return false
    return transaction.date.substring(0, 7) === selectedMonth
  })

  // Cálculos financeiros com valores seguros
  const totalPlannedIncome = filteredPlannedIncomes.reduce((sum, income) => {
    return sum + (income?.amount || 0)
  }, 0)

  const totalPlannedExpense = filteredPlannedExpenses.reduce((sum, expense) => {
    return sum + (expense?.amount || 0)
  }, 0)

  const plannedBalance = totalPlannedIncome - totalPlannedExpense

  const assets = (data.assets || []).filter((a) => a?.assetType === "asset" && a?.isActive)
  const liabilities = (data.assets || []).filter((a) => a?.assetType === "liability" && a?.isActive)

  const totalAssets = assets.reduce((sum, asset) => sum + (asset?.amount || 0), 0)
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + Math.abs(liability?.amount || 0), 0)
  const netWorth = totalAssets - totalLiabilities

  // Corrected pendingCount logic with null checks
  const pendingCount = (data.transactions || []).filter(
    (transaction: Transaction) => transaction?.categoryId === "pending",
  ).length

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} pendingCount={pendingCount} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 max-w-6xl">
            {/* Dashboard */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <GamificationCity
                  level={data.gamificationState?.currentLevel || 1}
                  cityState={data.gamificationState?.cityState || { buildings: 1, population: 100, happiness: 50 }}
                  streak={data.gamificationState?.streak || 0}
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-2xl">💰</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">Patrimônio Líquido</h3>
                          <p className="text-2xl font-bold text-emerald-600">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(netWorth)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 ${plannedBalance >= 0 ? "bg-blue-500" : "bg-rose-500"} rounded-full flex items-center justify-center`}
                        >
                          <span className="text-2xl">{plannedBalance >= 0 ? "📈" : "📉"}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-800 dark:text-blue-200">Saldo Planejado</h3>
                          <p
                            className={`text-2xl font-bold ${plannedBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                              plannedBalance,
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                          <span className="text-2xl">🔥</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-amber-800 dark:text-amber-200">Pendências</h3>
                          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Outras abas */}
            {activeTab === "planejamento" && (
              <PlanningTab
                data={data}
                filteredPlannedIncomes={filteredPlannedIncomes}
                filteredPlannedExpenses={filteredPlannedExpenses}
                totalPlannedIncome={totalPlannedIncome}
                totalPlannedExpense={totalPlannedExpense}
                plannedBalance={plannedBalance}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                saveData={saveData}
                updateGamification={updateGamification}
              />
            )}

            {activeTab === "transacoes" && (
              <TransactionsTab
                data={data}
                filteredTransactions={filteredTransactions}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                saveData={saveData}
                updateGamification={updateGamification}
              />
            )}

            {activeTab === "patrimonio" && (
              <PatrimonioTab
                financialData={data}
                saveFinancialData={saveData}
                triggerGamificationUpdate={updateGamification}
              />
            )}

            {activeTab === "relatorios" && (
              <ReportsTab
                data={data}
                filteredTransactions={filteredTransactions}
                filteredPlannedIncomes={filteredPlannedIncomes}
                filteredPlannedExpenses={filteredPlannedExpenses}
                totalPlannedIncome={totalPlannedIncome}
                totalPlannedExpense={totalPlannedExpense}
                plannedBalance={plannedBalance}
                totalAssets={totalAssets}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                handleEditTransaction={() => {}} // Add this missing prop
              />
            )}

            {activeTab === "pendencias" && (
              <PendingTab financialData={data} saveFinancialData={saveData} updateGamification={updateGamification} />
            )}

            {activeTab === "importar" && (
              <ImportTab data={data} saveData={saveData} updateGamification={updateGamification} />
            )}

            {activeTab === "config" && <ConfigTab data={data} saveData={saveData} />}
          </div>
        </main>
      </div>
    </div>
  )
}
