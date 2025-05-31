"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MonthSelector } from "@/components/month-selector"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import type { FinancialData, Transaction, PlannedIncome, PlannedExpense } from "@/types/financial-data"
import { formatCurrency } from "@/lib/utils"

interface ReportsTabProps {
  data: FinancialData
  filteredTransactions: Transaction[]
  filteredPlannedIncomes: PlannedIncome[]
  filteredPlannedExpenses: PlannedExpense[]
  totalPlannedIncome: number
  totalPlannedExpense: number
  plannedBalance: number
  totalAssets: number
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  handleEditTransaction: (transaction: Transaction) => void
}

export function ReportsTab({
  data,
  filteredTransactions,
  filteredPlannedIncomes,
  filteredPlannedExpenses,
  totalPlannedIncome,
  totalPlannedExpense,
  plannedBalance,
  totalAssets,
  selectedMonth,
  setSelectedMonth,
  handleEditTransaction,
}: ReportsTabProps) {
  // Calcular totais reais
  const totalRealIncome = useMemo(
    () => filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions],
  )

  const totalRealExpense = useMemo(
    () => filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions],
  )

  const realBalance = totalRealIncome - totalRealExpense

  // Calcular gastos por categoria
  const expensesByCategory = useMemo(() => {
    const categories: Record<string, { value: number; name: string }> = {}

    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((transaction) => {
        const categoryId = transaction.categoryId
        const categoryName = data.userSettings.categories.find((c) => c.id === categoryId)?.name || "Sem categoria"

        if (categories[categoryId]) {
          categories[categoryId].value += transaction.amount
        } else {
          categories[categoryId] = {
            name: categoryName,
            value: transaction.amount,
          }
        }
      })

    return Object.values(categories)
  }, [filteredTransactions, data.userSettings.categories])

  // Dados para o gráfico de comparação planejado vs. realizado
  const comparisonData = [
    {
      name: "Entradas",
      Planejado: totalPlannedIncome,
      Realizado: totalRealIncome,
    },
    {
      name: "Saídas",
      Planejado: totalPlannedExpense,
      Realizado: totalRealExpense,
    },
    {
      name: "Saldo",
      Planejado: plannedBalance,
      Realizado: realBalance,
    },
  ]

  // Dados para o gráfico de ativos por liquidez
  const assetsByLiquidity = useMemo(
    () => [
      {
        name: "Alta Liquidez",
        value: data.assets.filter((a) => a.liquidity === "high" && a.isActive).reduce((sum, a) => sum + a.amount, 0),
      },
      {
        name: "Baixa Liquidez",
        value: data.assets.filter((a) => a.liquidity === "low" && a.isActive).reduce((sum, a) => sum + a.amount, 0),
      },
    ],
    [data.assets],
  )

  // Dados para o gráfico de ativos por tipo
  const assetsByType = useMemo(() => {
    const types: Record<string, number> = {}

    data.assets
      .filter((a) => a.isActive)
      .forEach((asset) => {
        if (types[asset.type]) {
          types[asset.type] += asset.amount
        } else {
          types[asset.type] = asset.amount
        }
      })

    return Object.entries(types).map(([name, value]) => ({
      name:
        name === "bank"
          ? "Contas"
          : name === "investment"
            ? "Investimentos"
            : name === "receivable"
              ? "A Receber"
              : name === "cash"
                ? "Dinheiro"
                : "Reservas",
      value,
    }))
  }, [data.assets])

  // Cores para o gráfico de pizza
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FF6B6B",
    "#6A7FDB",
    "#61DAFB",
    "#FF9AA2",
  ]

  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Relatórios</h2>
            <p className="text-gray-600 dark:text-gray-400">Analise suas finanças</p>
          </div>
        </div>
        <MonthSelector selectedMonth={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Resumo Mensal</TabsTrigger>
          <TabsTrigger value="categories">Gastos por Categoria</TabsTrigger>
          <TabsTrigger value="comparison">Planejado vs. Realizado</TabsTrigger>
          <TabsTrigger value="assets">Ativos</TabsTrigger>
          <TabsTrigger value="budget">Orçamento por Categoria</TabsTrigger>
        </TabsList>

        {/* Resumo Mensal */}
        <TabsContent value="summary" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-sm">💰</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">Total de Entradas</CardTitle>
                    <CardDescription>Valor total recebido</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRealIncome)}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/20 dark:to-rose-900/20 border-rose-200 dark:border-rose-800">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center">
                    <span className="text-sm">💸</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">Total de Saídas</CardTitle>
                    <CardDescription>Valor total gasto</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600">{formatCurrency(totalRealExpense)}</div>
              </CardContent>
            </Card>

            <Card
              className={`bg-gradient-to-br ${realBalance >= 0 ? "from-emerald-50 to-emerald-100 border-emerald-200" : "from-rose-50 to-rose-100 border-rose-200"} dark:from-gray-950/20 dark:to-gray-900/20`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 ${realBalance >= 0 ? "bg-emerald-500" : "bg-rose-500"} rounded-full flex items-center justify-center`}
                  >
                    <span className="text-sm">{realBalance >= 0 ? "✅" : "⚠️"}</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">Saldo do Mês</CardTitle>
                    <CardDescription>Resultado financeiro</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${realBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatCurrency(realBalance)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resultado Financeiro</CardTitle>
              <CardDescription>
                {realBalance >= 0
                  ? "Parabéns! Você teve um saldo positivo este mês."
                  : "Atenção! Você teve um saldo negativo este mês."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {realBalance >= 0
                    ? `Você economizou ${formatCurrency(realBalance)} este mês. Considere investir ou guardar este valor para objetivos futuros.`
                    : `Você gastou ${formatCurrency(Math.abs(realBalance))} a mais do que recebeu. Revise suas despesas para identificar onde pode economizar no próximo mês.`}
                </p>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Comparação com o Planejado:</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Entradas Planejadas:</span>
                      <span className="font-medium">{formatCurrency(totalPlannedIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entradas Realizadas:</span>
                      <span className="font-medium">{formatCurrency(totalRealIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Diferença:</span>
                      <span
                        className={`font-medium ${totalRealIncome >= totalPlannedIncome ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {formatCurrency(totalRealIncome - totalPlannedIncome)}
                      </span>
                    </div>

                    <div className="my-2 border-t pt-2"></div>

                    <div className="flex justify-between">
                      <span>Despesas Planejadas:</span>
                      <span className="font-medium">{formatCurrency(totalPlannedExpense)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Despesas Realizadas:</span>
                      <span className="font-medium">{formatCurrency(totalRealExpense)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Diferença:</span>
                      <span
                        className={`font-medium ${totalRealExpense <= totalPlannedExpense ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {formatCurrency(totalPlannedExpense - totalRealExpense)}
                      </span>
                    </div>

                    <div className="my-2 border-t pt-2"></div>

                    <div className="flex justify-between">
                      <span>Saldo Planejado:</span>
                      <span className={`font-medium ${plannedBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {formatCurrency(plannedBalance)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saldo Realizado:</span>
                      <span className={`font-medium ${realBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {formatCurrency(realBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gastos por Categoria */}
        <TabsContent value="categories" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoria</CardTitle>
              <CardDescription>Visualize para onde seu dinheiro foi</CardDescription>
            </CardHeader>
            <CardContent>
              {expensesByCategory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma despesa registrada ainda.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expensesByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {expensesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Detalhamento por Categoria:</h4>
                    <div className="space-y-1">
                      {expensesByCategory
                        .sort((a, b) => b.value - a.value)
                        .map((category, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span>{category.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-medium">{formatCurrency(category.value)}</span>
                              <span className="text-muted-foreground text-sm">
                                {totalRealExpense > 0 ? ((category.value / totalRealExpense) * 100).toFixed(1) : "0"}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Planejado vs. Realizado */}
        <TabsContent value="comparison" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Planejado vs. Realizado</CardTitle>
              <CardDescription>Compare seu planejamento com o resultado real</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `R$${value}`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="Planejado" fill="#8884d8" />
                    <Bar dataKey="Realizado" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-4 space-y-4">
                <h4 className="font-semibold">Análise Comparativa:</h4>

                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded-md">
                    <span>Entradas:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Planejado: {formatCurrency(totalPlannedIncome)}</span>
                      <span>vs.</span>
                      <span className="font-medium">Realizado: {formatCurrency(totalRealIncome)}</span>
                      <span
                        className={`${totalRealIncome >= totalPlannedIncome ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        ({totalPlannedIncome > 0 ? ((totalRealIncome / totalPlannedIncome) * 100 - 100).toFixed(1) : 0}
                        %)
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded-md">
                    <span>Saídas:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Planejado: {formatCurrency(totalPlannedExpense)}</span>
                      <span>vs.</span>
                      <span className="font-medium">Realizado: {formatCurrency(totalRealExpense)}</span>
                      <span
                        className={`${totalRealExpense <= totalPlannedExpense ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        (
                        {totalPlannedExpense > 0
                          ? ((totalRealExpense / totalPlannedExpense) * 100 - 100).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded-md">
                    <span>Saldo:</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${plannedBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        Planejado: {formatCurrency(plannedBalance)}
                      </span>
                      <span>vs.</span>
                      <span className={`font-medium ${realBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        Realizado: {formatCurrency(realBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-muted-foreground">
                    {realBalance >= plannedBalance
                      ? "Seu resultado real foi melhor que o planejado. Continue com o bom trabalho!"
                      : "Seu resultado real foi pior que o planejado. Revise suas despesas para o próximo mês."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ativos */}
        <TabsContent value="assets" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Ativos</CardTitle>
              <CardDescription>Visualize como seus ativos estão distribuídos</CardDescription>
            </CardHeader>
            <CardContent>
              {data.assets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum ativo registrado ainda.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-4 text-center">Por Liquidez</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={assetsByLiquidity}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              <Cell fill="#0088FE" />
                              <Cell fill="#FFBB28" />
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4 text-center">Por Tipo</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={assetsByType}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {assetsByType.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Resumo de Ativos:</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded-md">
                        <span>Total de Ativos:</span>
                        <span className="font-medium">{formatCurrency(totalAssets)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded-md">
                        <span>Alta Liquidez:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(assetsByLiquidity[0].value)}</span>
                          <span className="text-muted-foreground text-sm">
                            ({totalAssets > 0 ? ((assetsByLiquidity[0].value / totalAssets) * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded-md">
                        <span>Baixa Liquidez:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(assetsByLiquidity[1].value)}</span>
                          <span className="text-muted-foreground text-sm">
                            ({totalAssets > 0 ? ((assetsByLiquidity[1].value / totalAssets) * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orçamento por Categoria */}
        <TabsContent value="budget" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Orçamento por Categoria</CardTitle>
              <CardDescription>Análise de orçamento por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              {expensesByCategory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma despesa registrada ainda.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expensesByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {expensesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Detalhamento por Categoria:</h4>
                    <div className="space-y-1">
                      {expensesByCategory
                        .sort((a, b) => b.value - a.value)
                        .map((category, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span>{category.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-medium">{formatCurrency(category.value)}</span>
                              <span className="text-muted-foreground text-sm">
                                {totalRealExpense > 0 ? ((category.value / totalRealExpense) * 100).toFixed(1) : "0"}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
