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
import type { Transaction, PlannedIncome, PlannedExpense, Asset } from "@/types/financial-data"
import { formatCurrency } from "@/lib/utils"

interface ReportsTabProps {
  transactions: Transaction[]
  plannedIncomes: PlannedIncome[]
  plannedExpenses: PlannedExpense[]
  assets: Asset[]
  totalPlannedIncome: number
  totalPlannedExpense: number
  plannedBalance: number
  totalAssets: number
  selectedMonth: string
  setSelectedMonth: (month: string) => void
}

export function ReportsTab({
  transactions,
  plannedIncomes,
  plannedExpenses,
  assets,
  totalPlannedIncome,
  totalPlannedExpense,
  plannedBalance,
  totalAssets,
  selectedMonth,
  setSelectedMonth,
}: ReportsTabProps) {
  // Calcular totais reais
  const totalRealIncome = useMemo(
    () => transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  )

  const totalRealExpense = useMemo(
    () => transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  )

  const realBalance = totalRealIncome - totalRealExpense

  // Calcular gastos por categoria
  const expensesByCategory = useMemo(() => {
    const categories: Record<string, number> = {}

    transactions
      .filter((t) => t.type === "expense")
      .forEach((transaction) => {
        if (categories[transaction.category]) {
          categories[transaction.category] += transaction.amount
        } else {
          categories[transaction.category] = transaction.amount
        }
      })

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
    }))
  }, [transactions])

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
  const assetsByLiquidity = [
    {
      name: "Alta Liquidez",
      value: assets.filter((a) => a.liquidity === "high").reduce((sum, a) => sum + a.amount, 0),
    },
    {
      name: "Baixa Liquidez",
      value: assets.filter((a) => a.liquidity === "low").reduce((sum, a) => sum + a.amount, 0),
    },
  ]

  // Dados para o gráfico de ativos por tipo
  const assetsByType = useMemo(() => {
    const types: Record<string, number> = {}

    assets.forEach((asset) => {
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
              : "Reservas",
      value,
    }))
  }, [assets])

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
        <h2 className="text-2xl font-bold">Relatórios</h2>
        <MonthSelector selectedMonth={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Resumo Mensal</TabsTrigger>
          <TabsTrigger value="categories">Gastos por Categoria</TabsTrigger>
          <TabsTrigger value="comparison">Planejado vs. Realizado</TabsTrigger>
          <TabsTrigger value="assets">Ativos</TabsTrigger>
        </TabsList>

        {/* Resumo Mensal */}
        <TabsContent value="summary" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-emerald-50 dark:bg-emerald-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total de Entradas</CardTitle>
                <CardDescription>Valor total recebido</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRealIncome)}</div>
              </CardContent>
            </Card>

            <Card className="bg-rose-50 dark:bg-rose-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total de Saídas</CardTitle>
                <CardDescription>Valor total gasto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600">{formatCurrency(totalRealExpense)}</div>
              </CardContent>
            </Card>

            <Card
              className={`${realBalance >= 0 ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-rose-50 dark:bg-rose-950/20"}`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Saldo do Mês</CardTitle>
                <CardDescription>Resultado financeiro</CardDescription>
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
                                {((category.value / totalRealExpense) * 100).toFixed(1)}%
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
              {assets.length === 0 ? (
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
      </Tabs>
    </div>
  )
}
