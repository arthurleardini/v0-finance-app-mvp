"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, Search } from "lucide-react"
import { MonthSelector } from "@/components/month-selector"
import type { Transaction, PlannedIncome, PlannedExpense } from "@/types/financial-data"
import { formatCurrency, formatDate } from "@/lib/utils"

interface TransactionsTabProps {
  transactions: Transaction[]
  plannedIncomes: PlannedIncome[]
  plannedExpenses: PlannedExpense[]
  addTransaction: (transaction: Omit<Transaction, "id">) => void
  updateTransaction: (id: string, transaction: Omit<Transaction, "id">) => void
  deleteTransaction: (id: string) => void
  selectedMonth: string
  setSelectedMonth: (month: string) => void
}

export function TransactionsTab({
  transactions,
  plannedIncomes,
  plannedExpenses,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  selectedMonth,
  setSelectedMonth,
}: TransactionsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [transactionType, setTransactionType] = useState<"income" | "expense">("income")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all")

  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, "id">>({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: 0,
    type: "income",
    category: "",
  })

  const handleAddTransaction = () => {
    if (newTransaction.description.trim() === "" || newTransaction.amount <= 0 || newTransaction.category.trim() === "")
      return

    if (editingId !== null) {
      updateTransaction(editingId, newTransaction)
      setEditingId(null)
    } else {
      addTransaction(newTransaction)
    }

    setNewTransaction({
      date: new Date().toISOString().split("T")[0],
      description: "",
      amount: 0,
      type: "income",
      category: "",
    })
    setDialogOpen(false)
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setNewTransaction({
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
    })
    setTransactionType(transaction.type)
    setEditingId(transaction.id)
    setDialogOpen(true)
  }

  const filteredTransactions = transactions
    .filter((transaction) => {
      // Filtrar por tipo
      if (filterType !== "all" && transaction.type !== filterType) {
        return false
      }

      // Filtrar por termo de busca
      if (searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase()
        return (
          transaction.description.toLowerCase().includes(searchLower) ||
          transaction.category.toLowerCase().includes(searchLower)
        )
      }

      return true
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Obter categorias únicas para o select
  const incomeCategories = [...new Set(plannedIncomes.map((income) => income.category))]
  const expenseCategories = [...new Set(plannedExpenses.map((expense) => expense.category))]

  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transações</h2>
        <MonthSelector selectedMonth={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl">Registro de Transações</CardTitle>
            <CardDescription>Entradas e saídas reais</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setNewTransaction({
                    date: new Date().toISOString().split("T")[0],
                    description: "",
                    amount: 0,
                    type: "income",
                    category: "",
                  })
                  setTransactionType("income")
                  setEditingId(null)
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId !== null ? "Editar Transação" : "Adicionar Transação"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Tabs
                  value={transactionType}
                  onValueChange={(value) => {
                    setTransactionType(value as "income" | "expense")
                    setNewTransaction({
                      ...newTransaction,
                      type: value as "income" | "expense",
                      category: "",
                    })
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="income">Entrada</TabsTrigger>
                    <TabsTrigger value="expense">Saída</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="transaction-date">Data</Label>
                  <Input
                    id="transaction-date"
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transaction-description">Descrição</Label>
                  <Input
                    id="transaction-description"
                    placeholder="Ex: Pagamento de salário, Compra no supermercado"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transaction-category">Categoria</Label>
                  <Select
                    value={newTransaction.category}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {transactionType === "income" ? (
                        incomeCategories.length > 0 ? (
                          incomeCategories.map((category, index) => (
                            <SelectItem key={index} value={category}>
                              {category}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="Outros">Outros</SelectItem>
                        )
                      ) : expenseCategories.length > 0 ? (
                        expenseCategories.map((category, index) => (
                          <SelectItem key={index} value={category}>
                            {category}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="Outros">Outros</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transaction-amount">Valor (R$)</Label>
                  <Input
                    id="transaction-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={newTransaction.amount || ""}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, amount: Number.parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <Button className="w-full" onClick={handleAddTransaction}>
                  {editingId !== null ? "Atualizar" : "Adicionar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transações..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filtrar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="income">Entradas</SelectItem>
                  <SelectItem value="expense">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lista de Transações */}
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {transactions.length === 0
                    ? "Nenhuma transação registrada. Adicione uma!"
                    : "Nenhuma transação encontrada com os filtros atuais."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      {transaction.type === "income" ? (
                        <ArrowUpCircle className="h-5 w-5 text-emerald-500 mt-0.5 sm:mt-0" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5 text-rose-500 mt-0.5 sm:mt-0" />
                      )}
                      <div className="space-y-1">
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                          <span>{formatDate(transaction.date)}</span>
                          <span>Categoria: {transaction.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0 ml-8 sm:ml-0">
                      <span
                        className={`font-medium ${
                          transaction.type === "income" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => handleEditTransaction(transaction)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteTransaction(transaction.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
