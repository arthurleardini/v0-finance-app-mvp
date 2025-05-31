"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PlusCircle, Pencil, Trash2, Wallet, Droplet, DropletIcon as DropletHalf, DollarSign } from "lucide-react"
import { SmartValueInput } from "@/components/smart-value-input"
import type { FinancialData, Asset, LiquidityType } from "@/types/financial-data"
import { formatCurrency, formatDate, generateId } from "@/lib/utils"

interface AssetsTabProps {
  data: FinancialData
  totalAssets: number
  totalHighLiquidityAssets: number
  totalLowLiquidityAssets: number
  saveData: (data: FinancialData) => Promise<void>
  updateGamification: () => Promise<void>
}

export function AssetsTab({
  data,
  totalAssets,
  totalHighLiquidityAssets,
  totalLowLiquidityAssets,
  saveData,
  updateGamification,
}: AssetsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [assetFilter, setAssetFilter] = useState<"all" | "high" | "low" | string>("all")

  const [newAsset, setNewAsset] = useState<Omit<Asset, "id">>({
    name: "",
    amount: 0,
    type: "bank",
    liquidity: "high",
    notes: "",
    lastUpdated: new Date().toISOString().split("T")[0],
    isActive: true,
  })

  const assetTypes = [
    {
      value: "bank",
      label: "Conta Bancária",
      icon: "🏦",
      color: "bg-blue-500",
      description: "Conta corrente ou poupança",
    },
    {
      value: "investment",
      label: "Investimento",
      icon: "📈",
      color: "bg-emerald-500",
      description: "Ações, fundos, títulos",
    },
    {
      value: "receivable",
      label: "A Receber",
      icon: "⏰",
      color: "bg-amber-500",
      description: "Valores a receber",
    },
    {
      value: "reserve",
      label: "Reserva",
      icon: "🛡️",
      color: "bg-purple-500",
      description: "Reserva de emergência",
    },
    {
      value: "cash",
      label: "Dinheiro",
      icon: "💵",
      color: "bg-green-500",
      description: "Dinheiro em espécie",
    },
  ]

  const handleAddAsset = async () => {
    if (newAsset.name.trim() === "") return

    try {
      if (editingId !== null) {
        const updatedAssets = data.assets.map((asset) =>
          asset.id === editingId ? { ...newAsset, id: editingId } : asset,
        )

        await saveData({
          ...data,
          assets: updatedAssets,
        })
      } else {
        const assetToAdd = {
          ...newAsset,
          id: generateId(),
        }

        await saveData({
          ...data,
          assets: [...data.assets, assetToAdd],
        })
      }

      await updateGamification()

      setNewAsset({
        name: "",
        amount: 0,
        type: "bank",
        liquidity: "high",
        notes: "",
        lastUpdated: new Date().toISOString().split("T")[0],
        isActive: true,
      })
      setEditingId(null)
      setDialogOpen(false)
    } catch (error) {
      console.error("Erro ao salvar ativo:", error)
    }
  }

  const handleEditAsset = (asset: Asset) => {
    setNewAsset({
      name: asset.name,
      amount: asset.amount,
      type: asset.type,
      liquidity: asset.liquidity,
      notes: asset.notes || "",
      lastUpdated: asset.lastUpdated,
      isActive: asset.isActive,
    })
    setEditingId(asset.id)
    setDialogOpen(true)
  }

  const handleDeleteAsset = async (id: string) => {
    try {
      const isUsed =
        data.transactions.some((t) => t.assetId === id || t.targetAssetId === id) ||
        data.plannedIncomes.some((i) => i.assetId === id) ||
        data.plannedExpenses.some((e) => e.assetId === id)

      if (isUsed) {
        const updatedAssets = data.assets.map((asset) => (asset.id === id ? { ...asset, isActive: false } : asset))

        await saveData({
          ...data,
          assets: updatedAssets,
        })
      } else {
        const updatedAssets = data.assets.filter((asset) => asset.id !== id)
        await saveData({
          ...data,
          assets: updatedAssets,
        })
      }

      await updateGamification()
    } catch (error) {
      console.error("Erro ao excluir ativo:", error)
    }
  }

  const filteredAssets = data.assets.filter((asset) => {
    if (!asset.isActive) return false
    if (assetFilter === "all") return true
    if (assetFilter === "high" || assetFilter === "low") return asset.liquidity === assetFilter
    return asset.type === assetFilter
  })

  const getAssetTypeInfo = (type: string) => {
    return assetTypes.find((t) => t.value === type) || assetTypes[0]
  }

  const getHealthScore = () => {
    const liquidityRatio = totalAssets > 0 ? (totalHighLiquidityAssets / totalAssets) * 100 : 0
    if (liquidityRatio >= 70) return { score: 100, label: "Excelente", color: "text-emerald-600", emoji: "🌟" }
    if (liquidityRatio >= 50) return { score: 80, label: "Bom", color: "text-blue-600", emoji: "👍" }
    if (liquidityRatio >= 30) return { score: 60, label: "Regular", color: "text-amber-600", emoji: "⚠️" }
    return { score: 40, label: "Precisa melhorar", color: "text-red-600", emoji: "🚨" }
  }

  const healthScore = getHealthScore()

  return (
    <div className="space-y-6 py-4">
      {/* Header com estilo Duolingo */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Meus Ativos</h2>
            <p className="text-gray-600 dark:text-gray-400">Gerencie seu patrimônio financeiro</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => {
                setNewAsset({
                  name: "",
                  amount: 0,
                  type: "bank",
                  liquidity: "high",
                  notes: "",
                  lastUpdated: new Date().toISOString().split("T")[0],
                  isActive: true,
                })
                setEditingId(null)
              }}
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Novo Ativo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">
                {editingId !== null ? "✏️ Editar Ativo" : "✨ Novo Ativo"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="asset-name" className="text-sm font-semibold">
                  Nome do Ativo
                </Label>
                <Input
                  id="asset-name"
                  placeholder="Ex: Conta Nubank, Tesouro Direto"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="rounded-xl border-2 focus:border-emerald-500"
                />
              </div>

              <SmartValueInput
                id="asset-amount"
                label="💰 Valor Atual"
                value={newAsset.amount}
                onChange={(value) => setNewAsset({ ...newAsset, amount: value })}
              />

              <div className="space-y-2">
                <Label htmlFor="asset-type" className="text-sm font-semibold">
                  Tipo de Ativo
                </Label>
                <Select value={newAsset.type} onValueChange={(value) => setNewAsset({ ...newAsset, type: value })}>
                  <SelectTrigger className="rounded-xl border-2">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{type.icon}</span>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset-liquidity" className="text-sm font-semibold">
                  💧 Liquidez
                </Label>
                <Select
                  value={newAsset.liquidity}
                  onValueChange={(value) => setNewAsset({ ...newAsset, liquidity: value as LiquidityType })}
                >
                  <SelectTrigger className="rounded-xl border-2">
                    <SelectValue placeholder="Selecione a liquidez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <Droplet className="h-4 w-4 text-blue-500" />
                        <span>Alta Liquidez</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <DropletHalf className="h-4 w-4 text-amber-500" />
                        <span>Baixa Liquidez</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset-last-updated" className="text-sm font-semibold">
                  📅 Última Atualização
                </Label>
                <Input
                  id="asset-last-updated"
                  type="date"
                  value={newAsset.lastUpdated}
                  onChange={(e) => setNewAsset({ ...newAsset, lastUpdated: e.target.value })}
                  className="rounded-xl border-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset-notes" className="text-sm font-semibold">
                  📝 Observações
                </Label>
                <Textarea
                  id="asset-notes"
                  placeholder="Observações adicionais sobre este ativo"
                  value={newAsset.notes}
                  onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
                  className="rounded-xl border-2 resize-none"
                  rows={3}
                />
              </div>

              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={handleAddAsset}
              >
                {editingId !== null ? "✅ Atualizar" : "🚀 Adicionar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Estatísticas estilo Duolingo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total de Ativos</p>
                <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                  {formatCurrency(totalAssets)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Droplet className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Alta Liquidez</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  {formatCurrency(totalHighLiquidityAssets)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                <DropletHalf className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Baixa Liquidez</p>
                <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">
                  {formatCurrency(totalLowLiquidityAssets)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br ${healthScore.score >= 80 ? "from-emerald-50 to-emerald-100 border-emerald-200" : healthScore.score >= 60 ? "from-blue-50 to-blue-100 border-blue-200" : healthScore.score >= 40 ? "from-amber-50 to-amber-100 border-amber-200" : "from-red-50 to-red-100 border-red-200"} dark:from-gray-950/20 dark:to-gray-900/20`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 ${healthScore.score >= 80 ? "bg-emerald-500" : healthScore.score >= 60 ? "bg-blue-500" : healthScore.score >= 40 ? "bg-amber-500" : "bg-red-500"} rounded-full flex items-center justify-center`}
              >
                <span className="text-xl">{healthScore.emoji}</span>
              </div>
              <div>
                <p className={`text-sm font-medium ${healthScore.color}`}>Saúde Financeira</p>
                <p className={`text-2xl font-bold ${healthScore.color}`}>{healthScore.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros estilo Duolingo */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "🌟 Todos", color: "bg-purple-500" },
              { value: "high", label: "💧 Alta Liquidez", color: "bg-blue-500" },
              { value: "low", label: "🔒 Baixa Liquidez", color: "bg-amber-500" },
              { value: "bank", label: "🏦 Contas", color: "bg-blue-600" },
              { value: "investment", label: "📈 Investimentos", color: "bg-emerald-600" },
              { value: "cash", label: "💵 Dinheiro", color: "bg-green-600" },
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={assetFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setAssetFilter(filter.value as any)}
                className={`rounded-full font-semibold transition-all duration-200 ${
                  assetFilter === filter.value
                    ? `${filter.color} text-white shadow-lg hover:shadow-xl`
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Ativos estilo Duolingo */}
      <div className="space-y-4">
        {filteredAssets.length === 0 ? (
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                {data.assets.length === 0 ? "Nenhum ativo registrado" : "Nenhum ativo encontrado"}
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                {data.assets.length === 0
                  ? "Comece adicionando seu primeiro ativo!"
                  : "Tente ajustar os filtros para encontrar seus ativos."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAssets.map((asset) => {
              const typeInfo = getAssetTypeInfo(asset.type)
              return (
                <Card
                  key={asset.id}
                  className="bg-white dark:bg-gray-900 border-2 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 ${typeInfo.color} rounded-full flex items-center justify-center shadow-lg`}
                        >
                          <span className="text-xl">{typeInfo.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 dark:text-gray-200">{asset.name}</h3>
                          <p className="text-sm text-gray-500">{typeInfo.label}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAsset(asset)}
                          className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(asset.amount)}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={`${asset.liquidity === "high" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-700 border-amber-200"} font-semibold`}
                        >
                          {asset.liquidity === "high" ? (
                            <>
                              <Droplet className="h-3 w-3 mr-1" />
                              Alta Liquidez
                            </>
                          ) : (
                            <>
                              <DropletHalf className="h-3 w-3 mr-1" />
                              Baixa Liquidez
                            </>
                          )}
                        </Badge>
                      </div>

                      <div className="text-xs text-gray-500 space-y-1">
                        <p>📅 Atualizado em: {formatDate(asset.lastUpdated)}</p>
                        {asset.notes && <p className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">💭 {asset.notes}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Dica estilo Duolingo */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-2">Dica de Ouro!</h3>
              <p className="text-blue-700 dark:text-blue-300 mb-3">
                Mantenha pelo menos 60% dos seus ativos em alta liquidez para ter flexibilidade financeira. Isso te
                ajuda a lidar com emergências e oportunidades!
              </p>
              <div className="flex items-center gap-2">
                <Progress
                  value={totalAssets > 0 ? (totalHighLiquidityAssets / totalAssets) * 100 : 0}
                  className="flex-1 h-3"
                />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {totalAssets > 0 ? Math.round((totalHighLiquidityAssets / totalAssets) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
