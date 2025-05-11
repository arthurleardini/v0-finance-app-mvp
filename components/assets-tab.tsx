"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  PlusCircle,
  Pencil,
  Trash2,
  Wallet,
  Landmark,
  BarChart3,
  Clock,
  Droplet,
  DropletIcon as DropletHalf,
} from "lucide-react"
import type { Asset, LiquidityType } from "@/types/financial-data"
import { formatCurrency, formatDate } from "@/lib/utils"

interface AssetsTabProps {
  assets: Asset[]
  addAsset: (asset: Omit<Asset, "id">) => void
  updateAsset: (id: string, asset: Omit<Asset, "id">) => void
  deleteAsset: (id: string) => void
  totalAssets: number
  totalHighLiquidityAssets: number
  totalLowLiquidityAssets: number
}

export function AssetsTab({
  assets,
  addAsset,
  updateAsset,
  deleteAsset,
  totalAssets,
  totalHighLiquidityAssets,
  totalLowLiquidityAssets,
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
  })

  const assetTypes = [
    { value: "bank", label: "Conta Bancária", icon: <Landmark className="h-4 w-4 mr-2" /> },
    { value: "investment", label: "Investimento", icon: <BarChart3 className="h-4 w-4 mr-2" /> },
    { value: "receivable", label: "Conta a Receber", icon: <Clock className="h-4 w-4 mr-2" /> },
    { value: "reserve", label: "Reserva", icon: <Wallet className="h-4 w-4 mr-2" /> },
  ]

  const liquidityTypes = [
    { value: "high", label: "Alta Liquidez", icon: <Droplet className="h-4 w-4 mr-2" /> },
    { value: "low", label: "Baixa Liquidez", icon: <DropletHalf className="h-4 w-4 mr-2" /> },
  ]

  const handleAddAsset = () => {
    if (newAsset.name.trim() === "" || newAsset.amount <= 0) return

    if (editingId !== null) {
      updateAsset(editingId, newAsset)
      setEditingId(null)
    } else {
      addAsset(newAsset)
    }

    setNewAsset({
      name: "",
      amount: 0,
      type: "bank",
      liquidity: "high",
      notes: "",
      lastUpdated: new Date().toISOString().split("T")[0],
    })
    setDialogOpen(false)
  }

  const handleEditAsset = (asset: Asset) => {
    setNewAsset({
      name: asset.name,
      amount: asset.amount,
      type: asset.type,
      liquidity: asset.liquidity,
      notes: asset.notes || "",
      lastUpdated: asset.lastUpdated,
    })
    setEditingId(asset.id)
    setDialogOpen(true)
  }

  const filteredAssets = assets.filter((asset) => {
    if (assetFilter === "all") return true
    if (assetFilter === "high" || assetFilter === "low") return asset.liquidity === assetFilter
    return asset.type === assetFilter
  })

  const getAssetTypeLabel = (type: string) => {
    const assetType = assetTypes.find((t) => t.value === type)
    return assetType ? assetType.label : type
  }

  const getAssetTypeIcon = (type: string) => {
    const assetType = assetTypes.find((t) => t.value === type)
    return assetType ? assetType.icon : <Wallet className="h-4 w-4 mr-2" />
  }

  const getLiquidityIcon = (liquidity: LiquidityType) => {
    return liquidity === "high" ? (
      <Droplet className="h-4 w-4 text-blue-500" />
    ) : (
      <DropletHalf className="h-4 w-4 text-amber-500" />
    )
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ativos</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setNewAsset({
                  name: "",
                  amount: 0,
                  type: "bank",
                  liquidity: "high",
                  notes: "",
                  lastUpdated: new Date().toISOString().split("T")[0],
                })
                setEditingId(null)
              }}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Novo Ativo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId !== null ? "Editar Ativo" : "Adicionar Ativo"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="asset-name">Nome</Label>
                <Input
                  id="asset-name"
                  placeholder="Ex: Conta Nubank, Tesouro Direto"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset-amount">Valor (R$)</Label>
                <Input
                  id="asset-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={newAsset.amount || ""}
                  onChange={(e) => setNewAsset({ ...newAsset, amount: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset-type">Tipo</Label>
                <Select value={newAsset.type} onValueChange={(value) => setNewAsset({ ...newAsset, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center">
                          {type.icon}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset-liquidity">Liquidez</Label>
                <Select
                  value={newAsset.liquidity}
                  onValueChange={(value) => setNewAsset({ ...newAsset, liquidity: value as LiquidityType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a liquidez" />
                  </SelectTrigger>
                  <SelectContent>
                    {liquidityTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center">
                          {type.icon}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset-last-updated">Data da Última Atualização</Label>
                <Input
                  id="asset-last-updated"
                  type="date"
                  value={newAsset.lastUpdated}
                  onChange={(e) => setNewAsset({ ...newAsset, lastUpdated: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset-notes">Observações</Label>
                <Textarea
                  id="asset-notes"
                  placeholder="Observações adicionais sobre este ativo"
                  value={newAsset.notes}
                  onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
                />
              </div>

              <Button className="w-full" onClick={handleAddAsset}>
                {editingId !== null ? "Atualizar" : "Adicionar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo de Ativos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total de Ativos</CardTitle>
            <CardDescription>Valor total de todos os ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAssets)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Droplet className="h-5 w-5 text-blue-500" />
              Alta Liquidez
            </CardTitle>
            <CardDescription>Ativos facilmente conversíveis em dinheiro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalHighLiquidityAssets)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DropletHalf className="h-5 w-5 text-amber-500" />
              Baixa Liquidez
            </CardTitle>
            <CardDescription>Ativos com restrições para conversão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalLowLiquidityAssets)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>Seus Ativos</CardTitle>
          <CardDescription>Gerencie seus ativos financeiros</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Tabs defaultValue="all" onValueChange={setAssetFilter}>
              <TabsList className="grid grid-cols-6">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="high">Alta Liquidez</TabsTrigger>
                <TabsTrigger value="low">Baixa Liquidez</TabsTrigger>
                <TabsTrigger value="bank">Contas</TabsTrigger>
                <TabsTrigger value="investment">Investimentos</TabsTrigger>
                <TabsTrigger value="reserve">Reservas</TabsTrigger>
              </TabsList>
            </Tabs>

            {filteredAssets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {assets.length === 0
                    ? "Nenhum ativo registrado. Adicione um!"
                    : "Nenhum ativo encontrado com o filtro atual."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        {getAssetTypeIcon(asset.type)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{asset.name}</span>
                          {getLiquidityIcon(asset.liquidity)}
                        </div>
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                          <span>{getAssetTypeLabel(asset.type)}</span>
                          <span>Atualizado em: {formatDate(asset.lastUpdated)}</span>
                        </div>
                        {asset.notes && (
                          <div className="text-sm text-muted-foreground">
                            <span>Obs: {asset.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(asset.amount)}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleEditAsset(asset)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteAsset(asset.id)}>
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
