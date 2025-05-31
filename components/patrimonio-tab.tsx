"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Pencil, Trash2, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { SmartValueInput } from "@/components/smart-value-input"
import type { FinancialData, Asset, LiquidityType, AssetType as ItemTypeEnum } from "@/types/financial-data" // Renomeado AssetType para ItemTypeEnum para evitar conflito
import { formatCurrency, formatDate, generateId } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast" // Assumindo que você tem um hook de toast
import { useItemForm } from "@/hooks/use-item-form"

interface PatrimonioTabProps {
  financialData: FinancialData // Renomeado de data para clareza
  saveFinancialData: (data: FinancialData) => Promise<void> // Renomeado de saveData
  triggerGamificationUpdate: () => Promise<void> // Renomeado de updateGamification
}

// Estado inicial para o formulário de item do patrimônio
const initialItemFormData: Omit<Asset, "id"> = {
  name: "",
  amount: 0,
  type: "bank", // Categoria específica do item (ex: bank, credit_card)
  assetType: "asset", // Se é 'asset' ou 'liability'
  liquidity: "high",
  notes: "",
  lastUpdated: new Date().toISOString().split("T")[0],
  isActive: true,
}

// Definições dos tipos de itens do patrimônio (ativos e passivos)
const patrimonyItemDefinitions = [
  // Ativos
  {
    value: "bank",
    label: "Conta Bancária",
    icon: "🏦",
    assetType: "asset" as ItemTypeEnum,
    description: "Conta corrente ou poupança",
  },
  {
    value: "investment",
    label: "Investimento",
    icon: "📈",
    assetType: "asset" as ItemTypeEnum,
    description: "Ações, fundos, títulos",
  },
  {
    value: "receivable",
    label: "A Receber",
    icon: "⏰",
    assetType: "asset" as ItemTypeEnum,
    description: "Valores a receber",
  },
  {
    value: "reserve",
    label: "Reserva",
    icon: "🛡️",
    assetType: "asset" as ItemTypeEnum,
    description: "Reserva de emergência",
  },
  {
    value: "cash",
    label: "Dinheiro",
    icon: "💵",
    assetType: "asset" as ItemTypeEnum,
    description: "Dinheiro em espécie",
  },
  {
    value: "property",
    label: "Imóvel",
    icon: "🏠",
    assetType: "asset" as ItemTypeEnum,
    description: "Propriedades e imóveis",
  },
  // Passivos
  {
    value: "credit_card",
    label: "Cartão de Crédito",
    icon: "💳",
    assetType: "liability" as ItemTypeEnum,
    description: "Fatura do cartão",
  },
  {
    value: "loan",
    label: "Empréstimo",
    icon: "🏛️",
    assetType: "liability" as ItemTypeEnum,
    description: "Empréstimos pessoais",
  },
  {
    value: "financing",
    label: "Financiamento",
    icon: "🚗",
    assetType: "liability" as ItemTypeEnum,
    description: "Financiamentos",
  },
  { value: "debt", label: "Dívida", icon: "📋", assetType: "liability" as ItemTypeEnum, description: "Outras dívidas" },
]

export function PatrimonioTab({ financialData, saveFinancialData, triggerGamificationUpdate }: PatrimonioTabProps) {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [activeFilterType, setActiveFilterType] = useState<"all" | "assets" | "liabilities">("all")

  const activeAssets = financialData.assets.filter((a) => a.assetType === "asset" && a.isActive)
  const activeLiabilities = financialData.assets.filter((a) => a.assetType === "liability" && a.isActive)

  const totalAssetsValue = activeAssets.reduce((sum, asset) => sum + asset.amount, 0)
  const totalLiabilitiesValue = activeLiabilities.reduce((sum, liability) => sum + Math.abs(liability.amount), 0)
  const netWorth = totalAssetsValue - totalLiabilitiesValue

  // Função de validação para itens do patrimônio
  const validatePatrimonyItemForm = (formData: Omit<Asset, "id">): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (formData.name.trim() === "") {
      errors.name = "O nome do item é obrigatório."
    }

    if (formData.assetType === "asset" && formData.amount < 0) {
      errors.amount = "Ativos devem ter valor positivo."
    }

    if (formData.assetType === "liability" && formData.amount > 0) {
      errors.amount = "Passivos devem ter valor negativo ou zero."
    }

    return errors
  }

  // Função de callback para submissão do formulário
  const onSubmitPatrimonyItem = async (formData: Omit<Asset, "id">) => {
    try {
      const itemToSave: Asset = {
        ...formData,
        id: editingItemId || generateId(),
        // Garante que o amount de passivos seja negativo se inserido como positivo
        amount: formData.assetType === "liability" && formData.amount > 0 ? -formData.amount : formData.amount,
      }

      const updatedItems = editingItemId
        ? financialData.assets.map((item) => (item.id === editingItemId ? itemToSave : item))
        : [...financialData.assets, itemToSave]

      await saveFinancialData({ ...financialData, assets: updatedItems })
      await triggerGamificationUpdate()
      toast({ title: "Sucesso!", description: `Item "${itemToSave.name}" salvo.` })
      resetFormAndCloseDialog()
    } catch (error) {
      console.error("Erro ao salvar item do patrimônio:", error)
      toast({ title: "Erro", description: "Não foi possível salvar o item.", variant: "destructive" })
    }
  }

  // Inicializar o hook useItemForm
  const { formData, formErrors, handleChange, setFieldValue, handleSubmit, resetForm, setFormData } = useItemForm<
    Omit<Asset, "id">
  >({
    initialState: initialItemFormData,
    validateFunction: validatePatrimonyItemForm,
    onSubmitCallback: onSubmitPatrimonyItem,
  })

  const resetFormAndCloseDialog = () => {
    resetForm()
    setEditingItemId(null)
    setIsDialogOpen(false)
  }

  const handleEditItem = (item: Asset) => {
    setFormData({
      name: item.name,
      amount: item.amount,
      type: item.type,
      assetType: item.assetType,
      liquidity: item.liquidity,
      notes: item.notes || "",
      lastUpdated: item.lastUpdated,
      isActive: item.isActive,
    })
    setEditingItemId(item.id)
    setIsDialogOpen(true)
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      const itemIsUsed =
        financialData.transactions.some((t) => t.assetId === itemId || t.targetAssetId === itemId) ||
        financialData.plannedIncomes.some((i) => i.assetId === itemId) ||
        financialData.plannedExpenses.some((e) => e.assetId === itemId)

      let updatedItems: Asset[]
      if (itemIsUsed) {
        updatedItems = financialData.assets.map((item) => (item.id === itemId ? { ...item, isActive: false } : item))
        toast({ title: "Item Desativado", description: "O item está em uso e foi marcado como inativo." })
      } else {
        updatedItems = financialData.assets.filter((item) => item.id !== itemId)
        toast({ title: "Item Excluído", description: "O item foi excluído com sucesso." })
      }

      await saveFinancialData({ ...financialData, assets: updatedItems })
      await triggerGamificationUpdate()
    } catch (error) {
      console.error("Erro ao excluir item do patrimônio:", error)
      toast({ title: "Erro", description: "Não foi possível excluir o item.", variant: "destructive" })
    }
  }

  const getItemDefinition = (type: string) => {
    return patrimonyItemDefinitions.find((def) => def.value === type) || patrimonyItemDefinitions[0]
  }

  const filteredPatrimonyItems = financialData.assets.filter((item) => {
    if (!item.isActive) return false
    if (activeFilterType === "all") return true
    return item.assetType === activeFilterType
  })

  // Efeito para atualizar campos dependentes quando assetType muda
  useEffect(() => {
    if (
      formData.assetType === "asset" &&
      !["bank", "investment", "receivable", "reserve", "cash", "property"].includes(formData.type)
    ) {
      setFieldValue("type", "bank")
    } else if (
      formData.assetType === "liability" &&
      !["credit_card", "loan", "financing", "debt"].includes(formData.type)
    ) {
      setFieldValue("type", "credit_card")
    }
  }, [formData.assetType, formData.type, setFieldValue])

  return (
    <div className="space-y-6 py-4">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Patrimônio</h2>
            <p className="text-gray-600 dark:text-gray-400">Gerencie seus ativos e passivos</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              onClick={() => {
                resetForm()
                setEditingItemId(null)
                setIsDialogOpen(true) // Explicitamente abrir o diálogo
              }}
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">
                {editingItemId ? "✏️ Editar Item" : "✨ Novo Item"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div>
                <Label htmlFor="item-name">Nome</Label>
                <Input
                  id="item-name"
                  placeholder="Ex: Conta Nubank, Cartão Visa"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue("name", e.target.value)}
                  name="name"
                  required
                />
                {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <Label htmlFor="item-assetType">Tipo (Ativo/Passivo)</Label>
                <Select
                  value={formData.assetType}
                  onValueChange={(value) => setFieldValue("assetType", value as ItemTypeEnum)}
                >
                  <SelectTrigger id="item-assetType">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <span>Ativo (O que você possui)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="liability">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span>Passivo (O que você deve)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.assetType && <p className="text-sm text-red-500 mt-1">{formErrors.assetType}</p>}
              </div>

              <div>
                <Label htmlFor="item-category">Categoria Específica</Label>
                <Select value={formData.type} onValueChange={(value) => setFieldValue("type", value)}>
                  <SelectTrigger id="item-category">
                    <SelectValue placeholder="Selecione a categoria específica" />
                  </SelectTrigger>
                  <SelectContent>
                    {patrimonyItemDefinitions
                      .filter((def) => def.assetType === formData.assetType)
                      .map((def) => (
                        <SelectItem key={def.value} value={def.value}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{def.icon}</span>
                            <div>
                              <div className="font-medium">{def.label}</div>
                              <div className="text-xs text-gray-500">{def.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {formErrors.type && <p className="text-sm text-red-500 mt-1">{formErrors.type}</p>}
              </div>

              <SmartValueInput
                id="item-amount"
                label={formData.assetType === "asset" ? "💰 Valor Atual" : "💳 Valor Devido"}
                value={formData.amount}
                onChange={(value) => setFieldValue("amount", value)}
              />
              {formErrors.amount && <p className="text-sm text-red-500 mt-1">{formErrors.amount}</p>}

              {formData.assetType === "asset" && (
                <div>
                  <Label htmlFor="item-liquidity">💧 Liquidez</Label>
                  <Select
                    value={formData.liquidity}
                    onValueChange={(value) => setFieldValue("liquidity", value as LiquidityType)}
                  >
                    <SelectTrigger id="item-liquidity">
                      <SelectValue placeholder="Selecione a liquidez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Alta Liquidez</SelectItem>
                      <SelectItem value="low">Baixa Liquidez</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.liquidity && <p className="text-sm text-red-500 mt-1">{formErrors.liquidity}</p>}
                </div>
              )}

              <div>
                <Label htmlFor="item-lastUpdated">📅 Última Atualização</Label>
                <Input
                  id="item-lastUpdated"
                  type="date"
                  value={formData.lastUpdated}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue("lastUpdated", e.target.value)}
                  name="lastUpdated"
                  required
                />
                {formErrors.lastUpdated && <p className="text-sm text-red-500 mt-1">{formErrors.lastUpdated}</p>}
              </div>

              <div>
                <Label htmlFor="item-notes">📝 Observações</Label>
                <Textarea
                  id="item-notes"
                  placeholder="Observações adicionais"
                  value={formData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFieldValue("notes", e.target.value)}
                  name="notes"
                  rows={3}
                />
                {formErrors.notes && <p className="text-sm text-red-500 mt-1">{formErrors.notes}</p>}
              </div>

              <Button type="submit" className="w-full">
                {editingItemId ? "✅ Atualizar Item" : "🚀 Adicionar Item"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* Cards de Resumo */}
      <section aria-labelledby="patrimonio-summary-heading" className="grid gap-4 md:grid-cols-4">
        <h2 id="patrimonio-summary-heading" className="sr-only">
          Resumo do Patrimônio
        </h2>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700">Total Ativos</p>
                <p className="text-2xl font-bold text-emerald-800">{formatCurrency(totalAssetsValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-700">Total Passivos</p>
                <p className="text-2xl font-bold text-red-800">{formatCurrency(totalLiabilitiesValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br ${netWorth >= 0 ? "from-blue-50 to-blue-100 border-blue-200" : "from-orange-50 to-orange-100 border-orange-200"}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 ${netWorth >= 0 ? "bg-blue-500" : "bg-orange-500"} rounded-full flex items-center justify-center`}
              >
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Patrimônio Líquido</p>
                <p className={`text-2xl font-bold ${netWorth >= 0 ? "text-blue-800" : "text-orange-800"}`}>
                  {formatCurrency(netWorth)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-xl">💧</span>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700">Alta Liquidez (Ativos)</p>
                <p className="text-2xl font-bold text-purple-800">
                  {formatCurrency(activeAssets.filter((a) => a.liquidity === "high").reduce((s, c) => s + c.amount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtrar Itens</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "🌟 Todos" },
              { value: "assets", label: "📈 Ativos" },
              { value: "liabilities", label: "📉 Passivos" },
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={activeFilterType === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilterType(filter.value as "all" | "assets" | "liabilities")}
                className="rounded-full"
                aria-pressed={activeFilterType === filter.value}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Itens */}
      <section aria-labelledby="patrimonio-list-heading">
        <h2 id="patrimonio-list-heading" className="sr-only">
          Lista de Itens do Patrimônio
        </h2>
        {filteredPatrimonyItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhum item encontrado</h3>
              <p className="text-gray-500">
                {financialData.assets.filter((a) => a.isActive).length === 0
                  ? "Comece adicionando seus ativos e passivos!"
                  : "Tente ajustar os filtros."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPatrimonyItems.map((item) => {
              const itemDef = getItemDefinition(item.type)
              const isAsset = item.assetType === "asset"
              return (
                <Card key={item.id} className="hover:shadow-lg transition-all duration-200 flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 ${isAsset ? "bg-emerald-500" : "bg-red-500"} rounded-full flex items-center justify-center`}
                        >
                          <span className="text-xl">{itemDef.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 dark:text-gray-200">{item.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{itemDef.label}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditItem(item)}
                          aria-label={`Editar ${item.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item.id)}
                          aria-label={`Excluir ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-grow flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${isAsset ? "text-emerald-600" : "text-red-600"}`}>
                          {formatCurrency(item.amount)}
                        </p>
                      </div>

                      {isAsset && (
                        <div className="flex items-center justify-center">
                          <Badge
                            variant="outline"
                            className={`text-xs ${item.liquidity === "high" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                          >
                            {item.liquidity === "high" ? "💧 Alta Liquidez" : "🔒 Baixa Liquidez"}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-3">
                      <p>📅 Atualizado: {formatDate(item.lastUpdated)}</p>
                      {item.notes && <p className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs">💭 {item.notes}</p>}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
