"use client"

import type React from "react"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  PlusCircle,
  Pencil,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  RefreshCw,
  CheckCircle,
} from "lucide-react"
import { MonthSelector } from "@/components/month-selector"
import { SmartValueInput } from "@/components/smart-value-input"
import { Badge } from "@/components/ui/badge"
import type { FinancialData, PlannedIncome, PlannedExpense, RecurrenceType, Transaction } from "@/types/financial-data"
import { formatCurrency, formatDate, generateId } from "@/lib/utils"
import { RECURRENCE_OPTIONS } from "@/lib/constants"
import { useItemForm, type FormErrors } from "@/hooks/use-item-form"
import { useToast } from "@/hooks/use-toast"

type ItemType = "income" | "expense"

// Define a interface unificada para o formulário
interface PlannedItemFormData {
  id?: string
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

const initialPlannedItemFormState: PlannedItemFormData = {
  description: "",
  amount: 0,
  date: new Date().toISOString().split("T")[0],
  categoryId: "",
  assetId: "",
  recurrence: "none",
  isRealized: false,
}

interface PlanningTabProps {
  data: FinancialData
  filteredPlannedIncomes: PlannedIncome[]
  filteredPlannedExpenses: PlannedExpense[]
  totalPlannedIncome: number
  totalPlannedExpense: number
  plannedBalance: number
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  saveData: (data: FinancialData) => Promise<void>
  updateGamification: () => Promise<void>
}

export function PlanningTab({
  data: financialData,
  filteredPlannedIncomes,
  filteredPlannedExpenses,
  totalPlannedIncome,
  totalPlannedExpense,
  plannedBalance,
  selectedMonth,
  setSelectedMonth,
  saveData: saveFinancialData,
  updateGamification,
}: PlanningTabProps) {
  const { toast } = useToast()

  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [activeFormType, setActiveFormType] = useState<ItemType>("income")
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)

  const [markAsRealizedDialogOpen, setMarkAsRealizedDialogOpen] = useState(false)
  const [itemToRealize, setItemToRealize] = useState<{
    id: string
    type: ItemType
    amount: number
    description: string
    categoryId: string
    assetId: string
  } | null>(null)
  const [realizedAmount, setRealizedAmount] = useState(0)

  // Safe access to categories and assets with default empty arrays
  const incomeCategories = useMemo(
    () => (financialData?.userSettings?.categories || []).filter((cat) => cat?.type === "income"),
    [financialData?.userSettings?.categories],
  )
  const expenseCategories = useMemo(
    () => (financialData?.userSettings?.categories || []).filter((cat) => cat?.type === "expense"),
    [financialData?.userSettings?.categories],
  )
  const activeAssets = useMemo(
    () => (financialData?.assets || []).filter((asset) => asset?.isActive),
    [financialData?.assets],
  )

  const validatePlannedItemForm = (formData: PlannedItemFormData): FormErrors<PlannedItemFormData> => {
    const errors: FormErrors<PlannedItemFormData> = {}
    if (!formData.description?.trim()) errors.description = "Descrição é obrigatória."
    if (!formData.amount || formData.amount <= 0) errors.amount = "Valor deve ser maior que zero."
    if (!formData.categoryId) errors.categoryId = "Categoria é obrigatória."
    if (!formData.assetId) errors.assetId = "Ativo é obrigatório."
    if (!formData.date) errors.date = "Data é obrigatória."
    return errors
  }

  const { formData, formErrors, handleInputChange, setFieldValue, handleSubmit, resetForm, setFormData, isSubmitting } =
    useItemForm<PlannedItemFormData>({
      initialState: initialPlannedItemFormState,
      validateFunction: validatePlannedItemForm,
      onSubmitCallback: async (currentFormData) => {
        try {
          const itemToSave: PlannedIncome | PlannedExpense = {
            ...currentFormData,
            id: editingItemId || generateId(),
          }

          let updatedFinancialData: FinancialData

          if (activeFormType === "income") {
            const updatedItems = editingItemId
              ? (financialData.plannedIncomes || []).map((item) =>
                  item.id === editingItemId ? (itemToSave as PlannedIncome) : item,
                )
              : [...(financialData.plannedIncomes || []), itemToSave as PlannedIncome]
            updatedFinancialData = { ...financialData, plannedIncomes: updatedItems }
          } else {
            const updatedItems = editingItemId
              ? (financialData.plannedExpenses || []).map((item) =>
                  item.id === editingItemId ? (itemToSave as PlannedExpense) : item,
                )
              : [...(financialData.plannedExpenses || []), itemToSave as PlannedExpense]
            updatedFinancialData = { ...financialData, plannedExpenses: updatedItems }
          }

          await saveFinancialData(updatedFinancialData)
          await updateGamification()
          toast({
            title: "Sucesso",
            description: `${activeFormType === "income" ? "Entrada" : "Despesa"} planejada salva.`,
            variant: "success",
          })
          closeFormDialog()
        } catch (error) {
          console.error(`Error saving planned ${activeFormType}:`, error)
          toast({
            title: "Erro",
            description: `Não foi possível salvar o item planejado.`,
            variant: "error",
          })
        }
      },
    })

  const openFormDialog = useCallback(
    (type: ItemType, itemToEdit?: PlannedIncome | PlannedExpense) => {
      setActiveFormType(type)
      if (itemToEdit) {
        setFormData({
          id: itemToEdit.id,
          description: itemToEdit.description || "",
          amount: itemToEdit.amount || 0,
          date: itemToEdit.date || new Date().toISOString().split("T")[0],
          categoryId: itemToEdit.categoryId || "",
          assetId: itemToEdit.assetId || "",
          recurrence: itemToEdit.recurrence || "none",
          isRealized: itemToEdit.isRealized || false,
          realizedAmount: (itemToEdit as PlannedIncome).realizedAmount,
          realizedDate: (itemToEdit as PlannedIncome).realizedDate,
          realizedTransactionId: (itemToEdit as PlannedIncome).realizedTransactionId,
        })
        setEditingItemId(itemToEdit.id)
      } else {
        resetForm(initialPlannedItemFormState)
        setEditingItemId(null)
      }
      setIsFormDialogOpen(true)
    },
    [resetForm, setFormData],
  )

  const closeFormDialog = useCallback(() => {
    setIsFormDialogOpen(false)
    setEditingItemId(null)
    resetForm(initialPlannedItemFormState)
  }, [resetForm])

  const handleDeleteItem = async (id: string, type: ItemType) => {
    try {
      let updatedPlannedItems
      let updatedFinancialData

      if (type === "income") {
        updatedPlannedItems = (financialData.plannedIncomes || []).filter((item) => item.id !== id)
        updatedFinancialData = { ...financialData, plannedIncomes: updatedPlannedItems }
      } else {
        updatedPlannedItems = (financialData.plannedExpenses || []).filter((item) => item.id !== id)
        updatedFinancialData = { ...financialData, plannedExpenses: updatedPlannedItems }
      }
      await saveFinancialData(updatedFinancialData)
      await updateGamification()
      toast({ title: "Sucesso", description: "Item planejado excluído.", variant: "success" })
    } catch (error) {
      console.error(`Error deleting planned ${type}:`, error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item planejado.",
        variant: "error",
      })
    }
  }

  const openMarkAsRealizedDialog = (item: PlannedIncome | PlannedExpense, type: ItemType) => {
    setItemToRealize({
      id: item.id,
      type,
      amount: item.amount || 0,
      description: item.description || "",
      categoryId: item.categoryId || "",
      assetId: item.assetId || "",
    })
    setRealizedAmount(item.amount || 0)
    setMarkAsRealizedDialogOpen(true)
  }

  const handleConfirmRealization = async () => {
    if (!itemToRealize) return

    if (realizedAmount <= 0) {
      toast({
        title: "Erro de Validação",
        description: "O valor realizado deve ser maior que zero.",
        variant: "error",
      })
      return
    }

    try {
      const now = new Date().toISOString()
      const transactionId = generateId()

      const newTransaction: Transaction = {
        id: transactionId,
        date: now.split("T")[0],
        description: itemToRealize.description,
        amount: realizedAmount,
        type: itemToRealize.type,
        categoryId: itemToRealize.categoryId,
        assetId: itemToRealize.assetId,
        status: "realized",
        plannedItemId: itemToRealize.id,
      }

      let updatedPlannedItems
      const updatedAssets = [...(financialData.assets || [])]
      let updatedFinancialData = { ...financialData }

      const assetIndex = updatedAssets.findIndex((asset) => asset.id === itemToRealize.assetId)
      if (assetIndex !== -1) {
        const assetToUpdate = updatedAssets[assetIndex]
        const newBalance =
          itemToRealize.type === "income"
            ? assetToUpdate.amount + realizedAmount
            : assetToUpdate.amount - realizedAmount
        updatedAssets[assetIndex] = { ...assetToUpdate, amount: newBalance, lastUpdated: now }
      }

      updatedFinancialData = {
        ...updatedFinancialData,
        assets: updatedAssets,
        transactions: [...(financialData.transactions || []), newTransaction],
      }

      if (itemToRealize.type === "income") {
        updatedPlannedItems = (financialData.plannedIncomes || []).map((item) =>
          item.id === itemToRealize.id
            ? { ...item, isRealized: true, realizedAmount, realizedDate: now, realizedTransactionId: transactionId }
            : item,
        )
        updatedFinancialData = { ...updatedFinancialData, plannedIncomes: updatedPlannedItems }
      } else {
        updatedPlannedItems = (financialData.plannedExpenses || []).map((item) =>
          item.id === itemToRealize.id
            ? { ...item, isRealized: true, realizedAmount, realizedDate: now, realizedTransactionId: transactionId }
            : item,
        )
        updatedFinancialData = { ...updatedFinancialData, plannedExpenses: updatedPlannedItems }
      }

      await saveFinancialData(updatedFinancialData)
      await updateGamification()
      toast({ title: "Sucesso", description: "Item marcado como realizado.", variant: "success" })
      setMarkAsRealizedDialogOpen(false)
      setItemToRealize(null)
    } catch (error) {
      console.error("Error marking as realized:", error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar como realizado.",
        variant: "error",
      })
    }
  }

  const getRecurrenceLabel = (recurrence: RecurrenceType) =>
    RECURRENCE_OPTIONS.find((opt) => opt.value === recurrence)?.label || "Não recorrente"

  const getCategoryName = (categoryId: string) =>
    (financialData?.userSettings?.categories || []).find((cat) => cat.id === categoryId)?.name || "Sem categoria"

  const getAssetName = (assetId: string) =>
    (financialData?.assets || []).find((a) => a.id === assetId)?.name || "Sem ativo"

  const renderPlannedItem = (item: PlannedIncome | PlannedExpense, type: ItemType) => {
    // Add null checks for item properties
    if (!item) return null

    return (
      <div
        key={item.id}
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border ${
          item.isRealized
            ? type === "income"
              ? "bg-emerald-50 dark:bg-emerald-950/30"
              : "bg-rose-50 dark:bg-rose-950/30"
            : "bg-white dark:bg-gray-800"
        }`}
      >
        <div className="flex items-start sm:items-center gap-3 w-full sm:w-auto">
          {type === "income" ? (
            <ArrowUpCircle className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-1 sm:mt-0" />
          ) : (
            <ArrowDownCircle className="h-6 w-6 text-rose-500 flex-shrink-0 mt-1 sm:mt-0" />
          )}
          <div className="flex flex-col flex-grow">
            <span className="font-medium">{item.description || "Sem descrição"}</span>
            <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {item.date ? formatDate(item.date) : "Data não definida"}
              </span>
              {item.recurrence !== "none" && (
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  {getRecurrenceLabel(item.recurrence)}
                </span>
              )}
              <span>Cat: {getCategoryName(item.categoryId)}</span>
              <span>Ativo: {getAssetName(item.assetId)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0 self-end sm:self-center">
          <span className={`font-semibold ${type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
            {formatCurrency(item.amount || 0)}
          </span>
          {item.isRealized ? (
            <Badge
              variant="outline"
              className={`${type === "income" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"}`}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Realizado
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => openMarkAsRealizedDialog(item, type)}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Realizar
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openFormDialog(type, item)}
            aria-label={`Editar ${type === "income" ? "entrada" : "despesa"}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteItem(item.id, type)}
            aria-label={`Excluir ${type === "income" ? "entrada" : "despesa"}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-2xl" role="img" aria-label="Ícone de planejamento">
              📋
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Planejamento</h2>
            <p className="text-gray-600 dark:text-gray-400">Organize suas finanças para o mês selecionado</p>
          </div>
        </div>
        <MonthSelector selectedMonth={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-xl" role="img" aria-label="Ícone de dinheiro">
                  💰
                </span>
              </div>
              <div>
                <CardTitle className="text-xl">Entradas Planejadas</CardTitle>
                <CardDescription>Fontes de renda para o mês</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => openFormDialog("income")}
              aria-label="Adicionar nova entrada planejada"
            >
              <PlusCircle className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPlannedIncomes.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhuma entrada planejada. Adicione uma!</p>
              ) : (
                <div className="space-y-2">
                  {filteredPlannedIncomes.map((item) => renderPlannedItem(item, "income"))}
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

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/20 dark:to-rose-900/20 border-rose-200 dark:border-rose-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center">
                <span className="text-xl" role="img" aria-label="Ícone de gastos">
                  💸
                </span>
              </div>
              <div>
                <CardTitle className="text-xl">Despesas Planejadas</CardTitle>
                <CardDescription>Categorias de gastos para o mês</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => openFormDialog("expense")}
              aria-label="Adicionar nova despesa planejada"
            >
              <PlusCircle className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPlannedExpenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhuma despesa planejada. Adicione uma!</p>
              ) : (
                <div className="space-y-2">
                  {filteredPlannedExpenses.map((item) => renderPlannedItem(item, "expense"))}
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

      <Card
        className={`bg-gradient-to-br ${plannedBalance >= 0 ? "from-emerald-50 to-emerald-100 border-emerald-200" : "from-rose-50 to-rose-100 border-rose-200"} dark:bg-background`}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-4">
            <div
              className={`w-16 h-16 ${plannedBalance >= 0 ? "bg-emerald-500" : "bg-rose-500"} rounded-full flex items-center justify-center`}
            >
              <span
                className="text-2xl"
                role="img"
                aria-label={plannedBalance >= 0 ? "Ícone de positivo" : "Ícone de alerta"}
              >
                {plannedBalance >= 0 ? "✅" : "⚠️"}
              </span>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold">Saldo Planejado</h3>
              <p className={`text-3xl font-bold ${plannedBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatCurrency(plannedBalance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItemId ? "Editar" : "Adicionar"} {activeFormType === "income" ? "Entrada" : "Despesa"} Planejada
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="item-date">Data Planejada</Label>
              <Input
                id="item-date"
                type="date"
                name="date"
                value={formData.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue("date", e.target.value)}
              />
              {formErrors.date && <p className="text-xs text-red-500">{formErrors.date}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="item-description">Descrição</Label>
              <Input
                id="item-description"
                name="description"
                placeholder={activeFormType === "income" ? "Ex: Salário, Freelance" : "Ex: Aluguel, Internet"}
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue("description", e.target.value)}
              />
              {formErrors.description && <p className="text-xs text-red-500">{formErrors.description}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="item-category">Categoria</Label>
              <Select
                name="categoryId"
                value={formData.categoryId}
                onValueChange={(value) => setFieldValue("categoryId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {(activeFormType === "income" ? incomeCategories : expenseCategories).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.categoryId && <p className="text-xs text-red-500">{formErrors.categoryId}</p>}
            </div>

            <SmartValueInput
              id="item-amount"
              label="Valor (R$)"
              value={formData.amount}
              onChange={(value) => setFieldValue("amount", value)}
            />
            {formErrors.amount && <p className="text-xs text-red-500">{formErrors.amount}</p>}

            <div className="space-y-1">
              <Label htmlFor="item-asset">Ativo de {activeFormType === "income" ? "Destino" : "Origem"}</Label>
              <Select
                name="assetId"
                value={formData.assetId}
                onValueChange={(value) => setFieldValue("assetId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ativo" />
                </SelectTrigger>
                <SelectContent>
                  {activeAssets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.assetId && <p className="text-xs text-red-500">{formErrors.assetId}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="item-recurrence">Recorrência</Label>
              <Select
                name="recurrence"
                value={formData.recurrence}
                onValueChange={(value) => setFieldValue("recurrence", value as RecurrenceType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a recorrência" />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeFormDialog} className="w-full">
                Cancelar
              </Button>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : editingItemId ? "Atualizar" : "Adicionar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={markAsRealizedDialogOpen} onOpenChange={setMarkAsRealizedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Realizado</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleConfirmRealization()
            }}
            className="space-y-4 py-4"
          >
            {itemToRealize && (
              <>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Descrição</Label>
                  <div className="p-2 border rounded-md bg-muted/50 text-sm">{itemToRealize.description}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Categoria</Label>
                  <div className="p-2 border rounded-md bg-muted/50 text-sm">
                    {getCategoryName(itemToRealize.categoryId)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Ativo</Label>
                  <div className="p-2 border rounded-md bg-muted/50 text-sm">{getAssetName(itemToRealize.assetId)}</div>
                </div>
                <SmartValueInput
                  id="realized-amount"
                  label="Valor Realizado (R$)"
                  value={realizedAmount}
                  onChange={setRealizedAmount}
                  placeholder="Valor real da transação"
                />
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMarkAsRealizedDialogOpen(false)}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="w-full">
                    Confirmar
                  </Button>
                </div>
              </>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
