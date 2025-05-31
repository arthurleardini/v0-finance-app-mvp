"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Pencil, Trash2, Settings, Tag } from "lucide-react"
import type { FinancialData, Category, CategoryType, EssentialType } from "@/types/financial-data"
import { generateId } from "@/lib/utils"

interface ConfigTabProps {
  data: FinancialData
  saveData: (data: FinancialData) => Promise<void>
}

export function ConfigTab({ data, saveData }: ConfigTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState<Omit<Category, "id" | "createdAt">>({
    name: "",
    type: "expense",
    essential: "non-essential",
    color: "#6B7280",
    isDefault: false,
  })

  const incomeCategories = data.userSettings.categories.filter((cat) => cat.type === "income")
  const expenseCategories = data.userSettings.categories.filter((cat) => cat.type === "expense")

  const handleAddCategory = async () => {
    if (newCategory.name.trim() === "") return

    const categoryToAdd: Category = {
      ...newCategory,
      id: editingCategoryId || generateId(),
      createdAt: new Date().toISOString(),
    }

    let updatedCategories
    if (editingCategoryId) {
      updatedCategories = data.userSettings.categories.map((cat) =>
        cat.id === editingCategoryId ? categoryToAdd : cat,
      )
    } else {
      updatedCategories = [...data.userSettings.categories, categoryToAdd]
    }

    const updatedData = {
      ...data,
      userSettings: {
        ...data.userSettings,
        categories: updatedCategories,
      },
    }

    await saveData(updatedData)

    setNewCategory({
      name: "",
      type: "expense",
      essential: "non-essential",
      color: "#6B7280",
      isDefault: false,
    })
    setEditingCategoryId(null)
    setDialogOpen(false)
  }

  const handleEditCategory = (category: Category) => {
    setNewCategory({
      name: category.name,
      type: category.type,
      essential: category.essential,
      color: category.color || "#6B7280",
      isDefault: category.isDefault,
    })
    setEditingCategoryId(category.id)
    setDialogOpen(true)
  }

  const handleDeleteCategory = async (categoryId: string) => {
    // Verificar se a categoria está sendo usada
    const isUsed =
      data.transactions.some((t) => t.categoryId === categoryId) ||
      data.plannedIncomes.some((i) => i.categoryId === categoryId) ||
      data.plannedExpenses.some((e) => e.categoryId === categoryId)

    if (isUsed) {
      alert("Esta categoria não pode ser excluída pois está sendo usada em transações ou planejamentos.")
      return
    }

    const updatedCategories = data.userSettings.categories.filter((cat) => cat.id !== categoryId)

    const updatedData = {
      ...data,
      userSettings: {
        ...data.userSettings,
        categories: updatedCategories,
      },
    }

    await saveData(updatedData)
  }

  const getEssentialBadge = (essential: EssentialType) => {
    return essential === "essential" ? (
      <Badge variant="destructive" className="text-xs">
        Essencial
      </Badge>
    ) : (
      <Badge variant="secondary" className="text-xs">
        Não Essencial
      </Badge>
    )
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Configurações</h2>
            <p className="text-gray-600 dark:text-gray-400">Personalize seu app</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="categories">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="general">Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-6">
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                  <Tag className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Gerenciar Categorias</CardTitle>
                  <CardDescription>Configure suas categorias de receitas e despesas</CardDescription>
                </div>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setNewCategory({
                        name: "",
                        type: "expense",
                        essential: "non-essential",
                        color: "#6B7280",
                        isDefault: false,
                      })
                      setEditingCategoryId(null)
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Nova Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCategoryId ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="category-name">Nome</Label>
                      <Input
                        id="category-name"
                        placeholder="Ex: Alimentação, Salário"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category-type">Tipo</Label>
                      <Select
                        value={newCategory.type}
                        onValueChange={(value) => setNewCategory({ ...newCategory, type: value as CategoryType })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Receita</SelectItem>
                          <SelectItem value="expense">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category-essential">Classificação</Label>
                      <Select
                        value={newCategory.essential}
                        onValueChange={(value) => setNewCategory({ ...newCategory, essential: value as EssentialType })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a classificação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="essential">Essencial</SelectItem>
                          <SelectItem value="non-essential">Não Essencial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category-color">Cor</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="category-color"
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                          className="w-16 h-10"
                        />
                        <Input
                          value={newCategory.color}
                          onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                          placeholder="#6B7280"
                        />
                      </div>
                    </div>

                    <Button className="w-full" onClick={handleAddCategory}>
                      {editingCategoryId ? "Atualizar" : "Adicionar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Categorias de Receita */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-emerald-600">Categorias de Receita</h3>
                  <div className="space-y-2">
                    {incomeCategories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                          <div>
                            <span className="font-medium">{category.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              {getEssentialBadge(category.essential)}
                              {category.isDefault && (
                                <Badge variant="outline" className="text-xs">
                                  Padrão
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!category.isDefault && (
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Categorias de Despesa */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-rose-600">Categorias de Despesa</h3>
                  <div className="space-y-2">
                    {expenseCategories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                          <div>
                            <span className="font-medium">{category.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              {getEssentialBadge(category.essential)}
                              {category.isDefault && (
                                <Badge variant="outline" className="text-xs">
                                  Padrão
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!category.isDefault && (
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações Gerais
              </CardTitle>
              <CardDescription>Configure as preferências do aplicativo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Moeda</Label>
                <Select value={data.userSettings.currency} disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Gamificação</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={data.userSettings.gamificationEnabled ? "default" : "secondary"}>
                    {data.userSettings.gamificationEnabled ? "Ativada" : "Desativada"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Sistema de cidade e níveis para motivar o uso diário
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
