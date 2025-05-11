"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, Calendar, RefreshCw } from "lucide-react"
import { MonthSelector } from "@/components/month-selector"
import type { PlannedIncome, PlannedExpense, RecurrenceType } from "@/types/financial-data"
import { formatCurrency, formatDate } from "@/lib/utils"

interface PlanningTabProps {
  plannedIncomes: PlannedIncome[]
  plannedExpenses: PlannedExpense[]
  addPlannedIncome: (income: Omit<PlannedIncome, "id">) => void
  updatePlannedIncome: (id: string, income: Omit<PlannedIncome, "id">) => void
  deletePlannedIncome: (id: string) => void
  addPlannedExpense: (expense: Omit<PlannedExpense, "id">) => void
  updatePlannedExpense: (id: string, expense: Omit<PlannedExpense, "id">) => void
  deletePlannedExpense: (id: string) => void
  totalPlannedIncome: number
  totalPlannedExpense: number
  plannedBalance: number
  selectedMonth: string
  setSelectedMonth: (month: string) => void
}

export function PlanningTab({
  plannedIncomes,
  plannedExpenses,
  addPlannedIncome,
  updatePlannedIncome,
  deletePlannedIncome,
  addPlannedExpense,
  updatePlannedExpense,
  deletePlannedExpense,
  totalPlannedIncome,
  totalPlannedExpense,
  plannedBalance,
  selectedMonth,
  setSelectedMonth,
}: PlanningTabProps) {
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)

  const [newIncome, setNewIncome] = useState<Omit<PlannedIncome, "id">>({
    description: "",
    category: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    recurrence: "none",
  })

  const [newExpense, setNewExpense] = useState<Omit<PlannedExpense, "id">>({
    description: "",
    category: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    recurrence: "none",
  })

  const recurrenceOptions = [
    { value: "none", label: "Não recorrente" },
    { value: "daily", label: "Diário" },
    { value: "weekly", label: "Semanal" },
    { value: "monthly", label: "Mensal" },
    { value: "yearly", label: "Anual" },
  ]

  const handleAddIncome = () => {
    if (newIncome.description.trim() === "" || newIncome.amount <= 0 || newIncome.category.trim() === "") return

    if (editingIncomeId !== null) {
      updatePlannedIncome(editingIncomeId, newIncome)
      setEditingIncomeId(null)
    } else {
      addPlannedIncome(newIncome)
    }

    setNewIncome({
      description: "",
      category: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      recurrence: "none",
    })
    setIncomeDialogOpen(false)
  }

  const handleEditIncome = (income: PlannedIncome) => {
    setNewIncome({
      description: income.description,
      category: income.category,
      amount: income.amount,
      date: income.date,
      recurrence: income.recurrence,
    })
    setEditingIncomeId(income.id)
    setIncomeDialogOpen(true)
  }

  const handleAddExpense = () => {
    if (newExpense.description.trim() === "" || newExpense.amount <= 0 || newExpense.category.trim() === "") return

    if (editingExpenseId !== null) {
      updatePlannedExpense(editingExpenseId, newExpense)
      setEditingExpenseId(null)
    } else {
      addPlannedExpense(newExpense)
    }

    setNewExpense({
      description: "",
      category: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      recurrence: "none",
    })
    setExpenseDialogOpen(false)
  }

  const handleEditExpense = (expense: PlannedExpense) => {
    setNewExpense({
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      recurrence: expense.recurrence,
    })
    setEditingExpenseId(expense.id)
    setExpenseDialogOpen(true)
  }

  const getRecurrenceLabel = (recurrence: RecurrenceType) => {
    const option = recurrenceOptions.find((opt) => opt.value === recurrence)
    return option ? option.label : "Não recorrente"
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Planejamento Financeiro</h2>
        <MonthSelector selectedMonth={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Entradas Planejadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xl">Entradas Planejadas</CardTitle>
              <CardDescription>Fontes de renda para o mês</CardDescription>
            </div>
            <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setNewIncome({
                      description: "",
                      category: "",
                      amount: 0,
                      date: new Date().toISOString().split("T")[0],
                      recurrence: "none",
                    })
                    setEditingIncomeId(null)
                  }}
                >
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingIncomeId !== null ? "Editar Entrada" : "Adicionar Entrada"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="income-date">Data Planejada</Label>
                    <Input
                      id="income-date"
                      type="date"
                      value={newIncome.date}
                      onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="income-description">Descrição</Label>
                    <Input
                      id="income-description"
                      placeholder="Ex: Salário, Freelance"
                      value={newIncome.description}
                      onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="income-category">Categoria</Label>
                    <Input
                      id="income-category"
                      placeholder="Ex: Salário, Investimentos"
                      value={newIncome.category}
                      onChange={(e) => setNewIncome({ ...newIncome, category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="income-amount">Valor (R$)</Label>
                    <Input
                      id="income-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={newIncome.amount || ""}
                      onChange={(e) => setNewIncome({ ...newIncome, amount: Number.parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="income-recurrence">Recorrência</Label>
                    <Select
                      value={newIncome.recurrence}
                      onValueChange={(value) => setNewIncome({ ...newIncome, recurrence: value as RecurrenceType })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a recorrência" />
                      </SelectTrigger>
                      <SelectContent>
                        {recurrenceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={handleAddIncome}>
                    {editingIncomeId !== null ? "Atualizar" : "Adicionar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plannedIncomes.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhuma entrada planejada. Adicione uma!</p>
              ) : (
                <div className="space-y-2">
                  {plannedIncomes.map((income) => (
                    <div key={income.id} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
                        <div className="flex flex-col">
                          <span>{income.description}</span>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(income.date)}
                            </span>
                            {income.recurrence !== "none" && (
                              <span className="flex items-center gap-1">
                                <RefreshCw className="h-3 w-3" />
                                {getRecurrenceLabel(income.recurrence)}
                              </span>
                            )}
                            <span>Categoria: {income.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-emerald-600">{formatCurrency(income.amount)}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleEditIncome(income)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deletePlannedIncome(income.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total de Entradas:</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(totalPlannedIncome)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Despesas Planejadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xl">Despesas Planejadas</CardTitle>
              <CardDescription>Categorias de gastos para o mês</CardDescription>
            </div>
            <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setNewExpense({
                      description: "",
                      category: "",
                      amount: 0,
                      date: new Date().toISOString().split("T")[0],
                      recurrence: "none",
                    })
                    setEditingExpenseId(null)
                  }}
                >
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingExpenseId !== null ? "Editar Despesa" : "Adicionar Despesa"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="expense-date">Data Planejada</Label>
                    <Input
                      id="expense-date"
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-description">Descrição</Label>
                    <Input
                      id="expense-description"
                      placeholder="Ex: Aluguel, Internet"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-category">Categoria</Label>
                    <Input
                      id="expense-category"
                      placeholder="Ex: Moradia, Alimentação"
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-amount">Valor (R$)</Label>
                    <Input
                      id="expense-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={newExpense.amount || ""}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: Number.parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-recurrence">Recorrência</Label>
                    <Select
                      value={newExpense.recurrence}
                      onValueChange={(value) => setNewExpense({ ...newExpense, recurrence: value as RecurrenceType })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a recorrência" />
                      </SelectTrigger>
                      <SelectContent>
                        {recurrenceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={handleAddExpense}>
                    {editingExpenseId !== null ? "Atualizar" : "Adicionar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plannedExpenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhuma despesa planejada. Adicione uma!</p>
              ) : (
                <div className="space-y-2">
                  {plannedExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <ArrowDownCircle className="h-5 w-5 text-rose-500" />
                        <div className="flex flex-col">
                          <span>{expense.description}</span>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(expense.date)}
                            </span>
                            {expense.recurrence !== "none" && (
                              <span className="flex items-center gap-1">
                                <RefreshCw className="h-3 w-3" />
                                {getRecurrenceLabel(expense.recurrence)}
                              </span>
                            )}
                            <span>Categoria: {expense.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-rose-600">{formatCurrency(expense.amount)}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleEditExpense(expense)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deletePlannedExpense(expense.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total de Despesas:</span>
                  <span className="font-bold text-rose-600">{formatCurrency(totalPlannedExpense)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saldo Planejado */}
      <Card className={`${plannedBalance >= 0 ? "bg-emerald-50" : "bg-rose-50"} dark:bg-background`}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-2">
            <h3 className="text-xl font-semibold">Saldo Planejado</h3>
            <p className={`text-3xl font-bold ${plannedBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatCurrency(plannedBalance)}
            </p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {plannedBalance >= 0
                ? "Seu planejamento está positivo! Você terá dinheiro sobrando no final do mês."
                : "Atenção! Seu planejamento está negativo. Você precisará ajustar suas despesas ou aumentar sua renda."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
