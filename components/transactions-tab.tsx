"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, Search, Plus } from "lucide-react"
import { MonthSelector } from "@/components/month-selector"
import type { FinancialData, Transaction } from "@/types/financial-data"
import { formatCurrency, formatDate, generateId } from "@/lib/utils"
import { useItemForm } from "@/hooks/use-item-form"

interface TransactionsTabProps {
  data: FinancialData
  filteredTransactions: Transaction[]
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  saveData: (data: FinancialData) => Promise<void>
  updateGamification: () => Promise<void>
}

// Estado inicial para o formulário de transação
const initialTransactionFormState = {
  date: new Date().toISOString().split("T")[0],
  description: "",
  amount: 0,
  type: "income" as "income" | "expense" | "transfer",
  categoryId: "",
  assetId: "",
  targetAssetId: "",
  status: "realized" as "planned" | "realized" | "unplanned",
  notes: "",
}

export function TransactionsTab({
  data: financialData,
  filteredTransactions,
  selectedMonth,
  setSelectedMonth,
  saveData: saveFinancialData,
  updateGamification,
}: TransactionsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "transfer">("all")

  const [newCategoryName, setNewCategoryName] = useState("")
  const [newAssetName, setNewAssetName] = useState("")
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false)
  const [isNewAssetDialogOpen, setIsNewAssetDialogOpen] = useState(false)

  // Função de validação para o formulário de transação
  const validateTransactionForm = (formData: typeof initialTransactionFormState) => {
    const errors: Record<string, string> = {}

    if (!formData.date) {
      errors.date = "A data é obrigatória"
    }

    if (!formData.description.trim()) {
      errors.description = "A descrição é obrigatória"
    }

    if (formData.amount <= 0) {
      errors.amount = "O valor deve ser maior que zero"
    }

    if (!formData.assetId) {
      errors.assetId = formData.type === "income" ? "Selecione um ativo de destino" : "Selecione um ativo de origem"
    }

    if (formData.type !== "transfer" && !formData.categoryId) {
      errors.categoryId = "Selecione uma categoria"
    }

    if (formData.type === "transfer" && !formData.targetAssetId) {
      errors.targetAssetId = "Selecione um ativo de destino"
    }

    if (formData.type === "transfer" && formData.assetId === formData.targetAssetId) {
      errors.targetAssetId = "O ativo de destino deve ser diferente do ativo de origem"
    }

    return errors
  }

  // Inicialização do useItemForm
  const { formData, formErrors, handleChange, setFieldValue, handleSubmit, resetForm, setFormData, isSubmitting } =
    useItemForm({
      initialState: initialTransactionFormState,
      validateFunction: validateTransactionForm,
      onSubmitCallback: async (formData) => {
        try {
          const now = new Date().toISOString()

          if (editingId !== null) {
            // Primeiro, reverter a transação antiga
            const oldTransaction = financialData.transactions.find((t) => t.id === editingId)
            let updatedAssets = [...financialData.assets]

            if (oldTransaction) {
              updatedAssets = revertTransactionImpact(oldTransaction, updatedAssets, now)
            }

            // Depois aplicar a nova transação
            updatedAssets = applyTransactionImpact(formData, updatedAssets, now)

            // Atualizar mapeamento de categorias
            const newCategoryMappings = updateCategoryMappings(formData, financialData)

            const updatedTransactions = financialData.transactions.map((transaction) =>
              transaction.id === editingId ? { ...formData, id: editingId } : transaction,
            )

            await saveFinancialData({
              ...financialData,
              transactions: updatedTransactions,
              assets: updatedAssets,
              userSettings: {
                ...financialData.userSettings,
                categoryMappings: newCategoryMappings,
              },
            })
          } else {
            // Atualizar mapeamento de categorias
            const newCategoryMappings = updateCategoryMappings(formData, financialData)

            const transactionToAdd = {
              ...formData,
              id: generateId(),
            }

            // Atualizar saldo do ativo
            let updatedAssets = [...financialData.assets]
            updatedAssets = applyTransactionImpact(formData, updatedAssets, now)

            await saveFinancialData({
              ...financialData,
              transactions: [...financialData.transactions, transactionToAdd],
              assets: updatedAssets,
              userSettings: {
                ...financialData.userSettings,
                categoryMappings: newCategoryMappings,
              },
            })
          }

          await updateGamification()
          resetForm()
          setEditingId(null)
          setDialogOpen(false)

          // Aqui poderia ter um toast.success
          // toast.success(editingId ? "Transação atualizada com sucesso!" : "Transação adicionada com sucesso!")
        } catch (error) {
          console.error("Erro ao salvar transação:", error)
          // toast.error("Erro ao salvar transação")
        }
      },
    })

  // Função auxiliar para reverter o impacto de uma transação nos ativos
  const revertTransactionImpact = (transaction: Transaction, assets: FinancialData["assets"], timestamp: string) => {
    let updatedAssets = [...assets]

    if (transaction.type === "income") {
      updatedAssets = updatedAssets.map((asset) =>
        asset.id === transaction.assetId
          ? { ...asset, amount: asset.amount - transaction.amount, lastUpdated: timestamp }
          : asset,
      )
    } else if (transaction.type === "expense") {
      updatedAssets = updatedAssets.map((asset) =>
        asset.id === transaction.assetId
          ? { ...asset, amount: asset.amount + transaction.amount, lastUpdated: timestamp }
          : asset,
      )
    } else if (transaction.type === "transfer" && transaction.targetAssetId) {
      updatedAssets = updatedAssets.map((asset) => {
        if (asset.id === transaction.assetId) {
          return { ...asset, amount: asset.amount + transaction.amount, lastUpdated: timestamp }
        } else if (asset.id === transaction.targetAssetId) {
          return { ...asset, amount: asset.amount - transaction.amount, lastUpdated: timestamp }
        }
        return asset
      })
    }

    return updatedAssets
  }

  // Função auxiliar para aplicar o impacto de uma transação nos ativos
  const applyTransactionImpact = (transaction: typeof formData, assets: FinancialData["assets"], timestamp: string) => {
    let updatedAssets = [...assets]

    if (transaction.type === "income") {
      updatedAssets = updatedAssets.map((asset) =>
        asset.id === transaction.assetId
          ? { ...asset, amount: asset.amount + transaction.amount, lastUpdated: timestamp }
          : asset,
      )
    } else if (transaction.type === "expense") {
      updatedAssets = updatedAssets.map((asset) =>
        asset.id === transaction.assetId
          ? { ...asset, amount: asset.amount - transaction.amount, lastUpdated: timestamp }
          : asset,
      )
    } else if (transaction.type === "transfer" && transaction.targetAssetId) {
      updatedAssets = updatedAssets.map((asset) => {
        if (asset.id === transaction.assetId) {
          return { ...asset, amount: asset.amount - transaction.amount, lastUpdated: timestamp }
        } else if (asset.id === transaction.targetAssetId) {
          return { ...asset, amount: asset.amount + transaction.amount, lastUpdated: timestamp }
        }
        return asset
      })
    }

    return updatedAssets
  }

  // Função auxiliar para atualizar os mapeamentos de categoria
  const updateCategoryMappings = (transaction: typeof formData, data: FinancialData) => {
    const descriptionToMap = transaction.description
    const categoryToMap = transaction.categoryId
    const newCategoryMappings = { ...(data.userSettings.categoryMappings || {}) }

    if (categoryToMap && categoryToMap !== "pending" && categoryToMap !== "internal" && descriptionToMap) {
      newCategoryMappings[descriptionToMap] = categoryToMap
    }

    return newCategoryMappings
  }

  // Efeito para atualizar o categoryId quando o tipo de transação muda
  useEffect(() => {
    setFieldValue("categoryId", "")
  }, [formData.type, setFieldValue])

  const handleEditTransaction = (transaction: Transaction) => {
    setFormData({
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      categoryId: transaction.categoryId,
      assetId: transaction.assetId,
      targetAssetId: transaction.targetAssetId || "",
      status: transaction.status,
      notes: transaction.notes || "",
    })
    setEditingId(transaction.id)
    setDialogOpen(true)
  }

  const handleDeleteTransaction = async (transaction: Transaction) => {
    try {
      const updatedTransactions = financialData.transactions.filter((t) => t.id !== transaction.id)
      const now = new Date().toISOString()

      // Reverter o efeito da transação no saldo do ativo
      let updatedAssets = [...financialData.assets]
      updatedAssets = revertTransactionImpact(transaction, updatedAssets, now)

      await saveFinancialData({
        ...financialData,
        transactions: updatedTransactions,
        assets: updatedAssets,
      })
      await updateGamification()

      // toast.success("Transação excluída com sucesso!")
    } catch (error) {
      console.error("Erro ao excluir transação:", error)
      // toast.error("Erro ao excluir transação")
    }
  }

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      const newCategory = {
        id: generateId(),
        name: newCategoryName.trim(),
        type: formData.type === "income" ? ("income" as const) : ("expense" as const),
        essential: "non-essential" as const,
        color: "#6B7280",
        isDefault: false,
        createdAt: new Date().toISOString(),
      }

      const updatedCategories = [...financialData.userSettings.categories, newCategory]

      await saveFinancialData({
        ...financialData,
        userSettings: {
          ...financialData.userSettings,
          categories: updatedCategories,
        },
      })

      setFieldValue("categoryId", newCategory.id)
      setNewCategoryName("")
      setIsNewCategoryDialogOpen(false)

      // toast.success("Categoria criada com sucesso!")
    }
  }

  const handleAddAsset = async () => {
    if (newAssetName.trim()) {
      const newAsset = {
        id: generateId(),
        name: newAssetName.trim(),
        amount: 0,
        type: "bank",
        assetType: "asset" as const,
        liquidity: "high" as const,
        notes: "",
        lastUpdated: new Date().toISOString(),
        isActive: true,
      }

      const updatedAssets = [...financialData.assets, newAsset]

      await saveFinancialData({
        ...financialData,
        assets: updatedAssets,
      })

      // Atualizar o campo apropriado com base no contexto
      if (formData.type === "transfer" && !formData.assetId) {
        setFieldValue("assetId", newAsset.id)
      } else if (formData.type === "transfer" && !formData.targetAssetId) {
        setFieldValue("targetAssetId", newAsset.id)
      } else {
        setFieldValue("assetId", newAsset.id)
      }

      setNewAssetName("")
      setIsNewAssetDialogOpen(false)

      // toast.success("Ativo criado com sucesso!")
    }
  }

  const filteredAndSearchedTransactions = filteredTransactions
    .filter((transaction) => {
      // Filtrar por tipo
      if (filterType !== "all" && transaction.type !== filterType) {
        return false
      }

      // Filtrar por termo de busca
      if (searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase()
        const categoryName =
          financialData.userSettings.categories.find((cat) => cat.id === transaction.categoryId)?.name || ""
        return (
          transaction.description.toLowerCase().includes(searchLower) ||
          categoryName.toLowerCase().includes(searchLower)
        )
      }

      return true
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const getCategoryName = (categoryId: string) => {
    const category = financialData.userSettings.categories.find((cat) => cat.id === categoryId)
    return category ? category.name : "Sem categoria"
  }

  const getAssetName = (assetId: string) => {
    const asset = financialData.assets.find((a) => a.id === assetId)
    return asset ? asset.name : "Sem ativo"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planned":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/20">
            Planejado
          </Badge>
        )
      case "realized":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20">
            Realizado
          </Badge>
        )
      case "unplanned":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/20">
            Não Planejado
          </Badge>
        )
      default:
        return null
    }
  }

  // Filtrar categorias com base no tipo de transação
  const incomeCategories = financialData.userSettings.categories.filter((cat) => cat.type === "income")
  const expenseCategories = financialData.userSettings.categories.filter((cat) => cat.type === "expense")
  const activeCategories = formData.type === "income" ? incomeCategories : expenseCategories

  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-2xl">💳</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Transações</h2>
            <p className="text-gray-600 dark:text-gray-400">Registre suas movimentações</p>
          </div>
        </div>
        <MonthSelector selectedMonth={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <CardTitle className="text-xl">Registro de Transações</CardTitle>
              <CardDescription>Entradas e saídas reais</CardDescription>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm()
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
                  value={formData.type}
                  onValueChange={(value) => {
                    setFieldValue("type", value as "income" | "expense" | "transfer")
                    // Limpar categoryId quando mudar o tipo
                    setFieldValue("categoryId", "")
                  }}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="income">Entrada</TabsTrigger>
                    <TabsTrigger value="expense">Saída</TabsTrigger>
                    <TabsTrigger value="transfer">Transferência</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFieldValue("date", e.target.value)
                    }}
                  />
                  {formErrors.date && <p className="text-sm text-red-500">{formErrors.date}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    name="description"
                    type="text"
                    placeholder="Ex: Pagamento de salário, Compra no supermercado"
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFieldValue("description", e.target.value)
                    }}
                  />
                  {formErrors.description && <p className="text-sm text-red-500">{formErrors.description}</p>}
                </div>

                {formData.type !== "transfer" && (
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Categoria</Label>
                    <div className="flex gap-2">
                      <Select value={formData.categoryId} onValueChange={(value) => setFieldValue("categoryId", value)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Dialog open={isNewCategoryDialogOpen} onOpenChange={setIsNewCategoryDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm">
                          <DialogHeader>
                            <DialogTitle>Nova Categoria</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="newCategory">Nome da categoria</Label>
                              <Input
                                id="newCategory"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Ex: Alimentação"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleAddCategory} className="flex-1">
                                Criar
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setIsNewCategoryDialogOpen(false)}
                                className="flex-1"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    {formErrors.categoryId && <p className="text-sm text-red-500">{formErrors.categoryId}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="text"
                    placeholder="0,00 ou 100+50-10"
                    value={formData.amount === 0 ? "" : formData.amount.toString()}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "") {
                        setFieldValue("amount", 0)
                      } else {
                        try {
                          // Tenta converter para número se possível
                          const numValue = Number.parseFloat(value.replace(",", "."))
                          if (!isNaN(numValue)) {
                            setFieldValue("amount", numValue)
                          } else {
                            // Se não for um número, mantém como string para permitir expressões
                            setFieldValue("amount", value)
                          }
                        } catch (err) {
                          // Em caso de erro, mantém o valor como string
                          setFieldValue("amount", value)
                        }
                      }
                    }}
                  />
                  {formErrors.amount && <p className="text-sm text-red-500">{formErrors.amount}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assetId">
                    {formData.type === "income"
                      ? "Ativo de Destino"
                      : formData.type === "expense"
                        ? "Ativo de Origem"
                        : "Ativo de Origem"}
                  </Label>
                  <div className="flex gap-2">
                    <Select value={formData.assetId} onValueChange={(value) => setFieldValue("assetId", value)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione um ativo" />
                      </SelectTrigger>
                      <SelectContent>
                        {financialData.assets
                          .filter((asset) => asset.isActive)
                          .map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                              {asset.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={isNewAssetDialogOpen} onOpenChange={setIsNewAssetDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader>
                          <DialogTitle>Novo Ativo</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="newAsset">Nome do ativo</Label>
                            <Input
                              id="newAsset"
                              value={newAssetName}
                              onChange={(e) => setNewAssetName(e.target.value)}
                              placeholder="Ex: Conta Corrente"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleAddAsset} className="flex-1">
                              Criar
                            </Button>
                            <Button variant="outline" onClick={() => setIsNewAssetDialogOpen(false)} className="flex-1">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {formErrors.assetId && <p className="text-sm text-red-500">{formErrors.assetId}</p>}
                </div>

                {formData.type === "transfer" && (
                  <div className="space-y-2">
                    <Label htmlFor="targetAssetId">Ativo de Destino</Label>
                    <Select
                      value={formData.targetAssetId}
                      onValueChange={(value) => setFieldValue("targetAssetId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um ativo" />
                      </SelectTrigger>
                      <SelectContent>
                        {financialData.assets
                          .filter((asset) => asset.isActive && asset.id !== formData.assetId)
                          .map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                              {asset.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {formErrors.targetAssetId && <p className="text-sm text-red-500">{formErrors.targetAssetId}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFieldValue("status", value as "planned" | "realized" | "unplanned")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realized">Realizado</SelectItem>
                      <SelectItem value="planned">Planejado</SelectItem>
                      <SelectItem value="unplanned">Não Planejado</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.status && <p className="text-sm text-red-500">{formErrors.status}</p>}
                </div>

                <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : editingId !== null ? "Atualizar" : "Adicionar"}
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
                  <SelectItem value="transfer">Transferências</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lista de Transações */}
            {filteredAndSearchedTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {filteredTransactions.length === 0
                    ? "Nenhuma transação registrada. Adicione uma!"
                    : "Nenhuma transação encontrada com os filtros atuais."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAndSearchedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      {transaction.type === "income" ? (
                        <ArrowUpCircle className="h-5 w-5 text-emerald-500 mt-0.5 sm:mt-0" />
                      ) : transaction.type === "expense" ? (
                        <ArrowDownCircle className="h-5 w-5 text-rose-500 mt-0.5 sm:mt-0" />
                      ) : (
                        <ArrowUpCircle className="h-5 w-5 text-blue-500 mt-0.5 sm:mt-0 rotate-90" />
                      )}
                      <div className="space-y-1">
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                          <span>{formatDate(transaction.date)}</span>
                          {transaction.type !== "transfer" && (
                            <span>Categoria: {getCategoryName(transaction.categoryId)}</span>
                          )}
                          <span>
                            {transaction.type === "income"
                              ? `Destino: ${getAssetName(transaction.assetId)}`
                              : transaction.type === "expense"
                                ? `Origem: ${getAssetName(transaction.assetId)}`
                                : `${getAssetName(transaction.assetId)} → ${getAssetName(transaction.targetAssetId || "")}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0 ml-8 sm:ml-0">
                      <span
                        className={`font-medium ${
                          transaction.type === "income"
                            ? "text-emerald-600"
                            : transaction.type === "expense"
                              ? "text-rose-600"
                              : "text-blue-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : "↔"}
                        {formatCurrency(transaction.amount)}
                      </span>
                      {getStatusBadge(transaction.status)}
                      <Button variant="ghost" size="icon" onClick={() => handleEditTransaction(transaction)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(transaction)}>
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
