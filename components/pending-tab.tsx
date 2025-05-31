"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, ArrowUpCircle, ArrowDownCircle, Plus, Building2, Calendar, DollarSign, Tag } from "lucide-react"
import type { FinancialData, Transaction, Category, Asset as FinancialAsset } from "@/types/financial-data"
import { formatCurrency, formatDate, generateId } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface PendingTabProps {
  financialData: FinancialData
  saveFinancialData: (data: FinancialData) => Promise<void>
  updateGamification: () => Promise<void>
}

export function PendingTab({ financialData, saveFinancialData, updateGamification }: PendingTabProps) {
  const { toast } = useToast()

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form fields
  const [formDescription, setFormDescription] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formCategoryId, setFormCategoryId] = useState("")
  const [formAssetId, setFormAssetId] = useState("")
  const [formTargetAssetId, setFormTargetAssetId] = useState("")
  const [formIsInternal, setFormIsInternal] = useState(false)

  // New category/asset dialogs
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false)
  const [isNewAssetDialogOpen, setIsNewAssetDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newAssetName, setNewAssetName] = useState("")

  // Safe data access
  const transactions = financialData?.transactions || []
  const assets = financialData?.assets || []
  const categories = financialData?.userSettings?.categories || []

  const pendingTransactions = transactions.filter((t) => t && (t.categoryId === "pending" || t.status === "pending"))

  const incomeCategories = categories.filter((cat) => cat?.type === "income")
  const expenseCategories = categories.filter((cat) => cat?.type === "expense")
  const activeAssets = assets.filter((asset) => asset?.isActive)

  const resetForm = () => {
    setFormDescription("")
    setFormAmount("")
    setFormCategoryId("")
    setFormAssetId("")
    setFormTargetAssetId("")
    setFormIsInternal(false)
  }

  const openEditDialog = (transaction: Transaction) => {
    console.log("Opening dialog for transaction:", transaction)

    setEditingTransaction(transaction)
    setFormDescription(transaction.description || "")
    setFormAmount((transaction.amount || 0).toString())
    setFormCategoryId(transaction.categoryId === "pending" ? "" : transaction.categoryId || "")
    setFormAssetId(transaction.assetId === "pending" ? "" : transaction.assetId || "")
    setFormTargetAssetId(transaction.targetAssetId || "")
    setFormIsInternal(transaction.type === "transfer" || transaction.isInternal || false)
    setIsEditDialogOpen(true)
  }

  const closeEditDialog = () => {
    setIsEditDialogOpen(false)
    setEditingTransaction(null)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingTransaction) return

    const numericAmount = Number.parseFloat(formAmount.replace(",", "."))

    // Basic validation
    if (!formDescription.trim()) {
      toast({ title: "Erro", description: "Descrição é obrigatória.", variant: "destructive" })
      return
    }
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({ title: "Erro", description: "Valor deve ser um número maior que zero.", variant: "destructive" })
      return
    }
    if (!formAssetId) {
      toast({ title: "Erro", description: "Ativo é obrigatório.", variant: "destructive" })
      return
    }
    if (formIsInternal && !formTargetAssetId) {
      toast({
        title: "Erro",
        description: "Ativo de destino é obrigatório para transferências.",
        variant: "destructive",
      })
      return
    }
    if (formIsInternal && formAssetId === formTargetAssetId) {
      toast({ title: "Erro", description: "Ativo de origem e destino devem ser diferentes.", variant: "destructive" })
      return
    }
    if (!formIsInternal && !formCategoryId) {
      toast({ title: "Erro", description: "Categoria é obrigatória.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)

    try {
      const now = new Date().toISOString()
      const finalType = formIsInternal ? "transfer" : editingTransaction.type
      const finalCategoryId = formIsInternal ? "internal" : formCategoryId

      const updatedTransaction: Transaction = {
        ...editingTransaction,
        description: formDescription,
        amount: numericAmount,
        categoryId: finalCategoryId,
        assetId: formAssetId,
        targetAssetId: formIsInternal ? formTargetAssetId : undefined,
        isInternal: formIsInternal,
        type: finalType,
        status: "realized",
      }

      const updatedTransactions = transactions.map((t) => (t?.id === editingTransaction.id ? updatedTransaction : t))

      const updatedAssets = [...assets]

      // Apply transaction impact to assets
      if (finalType === "transfer" || formIsInternal) {
        // Source asset (subtract)
        const sourceAssetIndex = updatedAssets.findIndex((a) => a?.id === formAssetId)
        if (sourceAssetIndex >= 0) {
          updatedAssets[sourceAssetIndex] = {
            ...updatedAssets[sourceAssetIndex],
            amount: updatedAssets[sourceAssetIndex].amount - numericAmount,
            lastUpdated: now,
          }
        }
        // Target asset (add)
        const targetAssetIndex = updatedAssets.findIndex((a) => a?.id === formTargetAssetId)
        if (targetAssetIndex >= 0) {
          updatedAssets[targetAssetIndex] = {
            ...updatedAssets[targetAssetIndex],
            amount: updatedAssets[targetAssetIndex].amount + numericAmount,
            lastUpdated: now,
          }
        }
      } else if (finalType === "income") {
        const assetIndex = updatedAssets.findIndex((a) => a?.id === formAssetId)
        if (assetIndex >= 0) {
          updatedAssets[assetIndex] = {
            ...updatedAssets[assetIndex],
            amount: updatedAssets[assetIndex].amount + numericAmount,
            lastUpdated: now,
          }
        }
      } else if (finalType === "expense") {
        const assetIndex = updatedAssets.findIndex((a) => a?.id === formAssetId)
        if (assetIndex >= 0) {
          const asset = updatedAssets[assetIndex]
          const isLiabilityExpense = asset.assetType === "liability"
          updatedAssets[assetIndex] = {
            ...asset,
            amount: isLiabilityExpense ? asset.amount + numericAmount : asset.amount - numericAmount,
            lastUpdated: now,
          }
        }
      }

      await saveFinancialData({
        ...financialData,
        transactions: updatedTransactions,
        assets: updatedAssets,
      })

      await updateGamification()
      toast({ title: "Sucesso", description: `Transação "${formDescription}" resolvida.` })
      closeEditDialog()
    } catch (error) {
      console.error("Erro ao salvar transação:", error)
      toast({ title: "Erro", description: "Não foi possível resolver a transação.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim() || !editingTransaction) return

    const newCategory: Category = {
      id: generateId(),
      name: newCategoryName.trim(),
      type: formIsInternal ? "expense" : editingTransaction.type === "income" ? "income" : "expense",
      essential: "non-essential",
      color: "#6B7280",
      isDefault: false,
      createdAt: new Date().toISOString(),
    }

    const updatedCategories = [...categories, newCategory]
    await saveFinancialData({
      ...financialData,
      userSettings: {
        ...financialData.userSettings,
        categories: updatedCategories,
      },
    })

    setFormCategoryId(newCategory.id)
    setNewCategoryName("")
    setIsNewCategoryDialogOpen(false)
  }

  const handleAddNewAsset = async () => {
    if (!newAssetName.trim()) return

    const newAsset: FinancialAsset = {
      id: generateId(),
      name: newAssetName.trim(),
      amount: 0,
      type: "bank",
      assetType: "asset",
      liquidity: "high",
      notes: "Criado via aba de pendências",
      lastUpdated: new Date().toISOString(),
      isActive: true,
    }

    const updatedAssets = [...assets, newAsset]
    await saveFinancialData({ ...financialData, assets: updatedAssets })
    setFormAssetId(newAsset.id)
    setNewAssetName("")
    setIsNewAssetDialogOpen(false)
  }

  const getTransactionIcon = (type: string) => {
    if (type === "income") return <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
    if (type === "expense") return <ArrowDownCircle className="h-5 w-5 text-rose-500" />
    return <ArrowUpCircle className="h-5 w-5 text-blue-500 rotate-90" />
  }

  const getAssetName = (assetId: string) => {
    if (!assetId || assetId === "pending") return "Ativo Pendente"
    return assets.find((a) => a?.id === assetId)?.name || "Sem Ativo"
  }

  if (!financialData) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Carregando dados financeiros...</p>
      </div>
    )
  }

  if (pendingTransactions.length === 0) {
    return (
      <div className="space-y-6 py-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Transações Pendentes</h2>
              <p className="text-gray-600 dark:text-gray-400">Nenhuma transação aguardando categorização.</p>
            </div>
          </div>
        </CardHeader>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-emerald-200">
          <CardContent className="pt-6 text-center">
            <Building2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300 mb-2">🎉 Tudo em ordem!</h3>
            <p className="text-emerald-600 dark:text-emerald-400">
              Todas as suas transações importadas foram categorizadas.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Transações Pendentes</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {pendingTransactions.length} transaç{pendingTransactions.length !== 1 ? "ões precisam" : "ão precisa"}{" "}
                de atenção.
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <div className="space-y-3">
        {pendingTransactions.map((transaction) => {
          if (!transaction || !transaction.id) return null

          return (
            <Card key={transaction.id} className="border-l-4 border-orange-400 dark:border-orange-500">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.type || "expense")}
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {transaction.description || "N/A"}
                      </h3>
                      <Badge variant="outline">
                        {transaction.type === "income"
                          ? "Receita"
                          : transaction.type === "expense"
                            ? "Despesa"
                            : "Transferência"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <DollarSign size={14} /> {formatCurrency(transaction.amount || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> {formatDate(transaction.date || "")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag size={14} /> Ativo: {getAssetName(transaction.assetId || "")}
                      </span>
                    </div>
                  </div>
                  <Button onClick={() => openEditDialog(transaction)} size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Resolver
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resolver Transação Pendente</DialogTitle>
            <DialogDescription>Categorize e configure os detalhes da transação pendente.</DialogDescription>
          </DialogHeader>

          {editingTransaction && (
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  {getTransactionIcon(editingTransaction.type || "expense")}
                  <span className="font-medium text-sm">{editingTransaction.description || "N/A"}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(editingTransaction.amount || 0)} • {formatDate(editingTransaction.date || "")}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isInternal"
                  checked={formIsInternal}
                  onCheckedChange={(checked) => setFormIsInternal(!!checked)}
                />
                <Label htmlFor="isInternal" className="text-sm font-medium">
                  É uma transferência interna?
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descrição da transação"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0,00"
                />
              </div>

              {!formIsInternal && (
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Categoria</Label>
                  <div className="flex gap-2">
                    <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {(editingTransaction.type === "income" ? incomeCategories : expenseCategories).map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsNewCategoryDialogOpen(true)}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="assetId">{formIsInternal ? "Ativo de Origem" : "Ativo"}</Label>
                <div className="flex gap-2">
                  <Select value={formAssetId} onValueChange={setFormAssetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ativo" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeAssets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setIsNewAssetDialogOpen(true)}>
                    <Plus size={16} />
                  </Button>
                </div>
              </div>

              {formIsInternal && (
                <div className="space-y-2">
                  <Label htmlFor="targetAssetId">Ativo de Destino</Label>
                  <Select value={formTargetAssetId} onValueChange={setFormTargetAssetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ativo de destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeAssets
                        .filter((asset) => asset.id !== formAssetId)
                        .map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeEditDialog} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Salvando..." : "Salvar e Resolver"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* New Category Dialog */}
      <Dialog open={isNewCategoryDialogOpen} onOpenChange={setIsNewCategoryDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>Crie uma nova categoria para esta transação.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nome da Categoria"
            />
            <Button onClick={handleAddNewCategory} className="w-full">
              Criar Categoria
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Asset Dialog */}
      <Dialog open={isNewAssetDialogOpen} onOpenChange={setIsNewAssetDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Novo Ativo</DialogTitle>
            <DialogDescription>Crie um novo ativo para esta transação.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={newAssetName} onChange={(e) => setNewAssetName(e.target.value)} placeholder="Nome do Ativo" />
            <Button onClick={handleAddNewAsset} className="w-full">
              Criar Ativo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
