"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, FileText, CheckCircle, AlertCircle, CreditCard, Building2, PlusCircle } from "lucide-react"
import type { FinancialData, Asset } from "@/types/financial-data"
import { generateId } from "@/lib/utils"

// 1. Import Fuse.js no início do arquivo
import Fuse from "fuse.js"

// Adicionar esta função helper no início do arquivo ou dentro do componente
function utf8ToBase64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)))
  } catch (e) {
    console.error("Erro ao converter para Base64:", e, "String original:", str)
    // Fallback para caracteres problemáticos, removendo-os ou substituindo-os
    // Esta é uma solução simples, pode precisar de ajustes mais finos dependendo dos dados
    const sanitizedStr = str.replace(/[^\x00-\x7F]/g, "") // Remove caracteres não-ASCII
    return btoa(sanitizedStr)
  }
}

interface ImportTabProps {
  data: FinancialData
  saveData: (data: FinancialData) => Promise<void>
  updateGamification: () => Promise<void>
}

export function ImportTab({ data, saveData, updateGamification }: ImportTabProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importType, setImportType] = useState<"bank" | "credit_card">("bank")
  const [selectedBankAccount, setSelectedBankAccount] = useState("")
  const [selectedCreditCard, setSelectedCreditCard] = useState("")
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
    imported: number
    duplicates: number
    pendingItems: number
  } | null>(null)

  const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false)
  const [newItemName, setNewItemName] = useState("")
  const [newItemType, setNewItemType] = useState<"bank" | "credit_card">("bank")

  const bankAccounts = data.assets.filter((asset) => asset.type === "bank" && asset.isActive)
  const creditCards = data.assets.filter((asset) => asset.type === "credit_card" && asset.isActive)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
      setImportResult(null)
    } else {
      alert("Por favor, selecione um arquivo CSV válido.")
    }
  }

  const getColumnIndex = (headers: string[], columnName: string, alternativeColumnNames: string[] = []): number => {
    const lowerCaseColumnName = columnName.toLowerCase().trim()
    let index = headers.findIndex((h) => h.toLowerCase().trim() === lowerCaseColumnName)
    if (index === -1 && alternativeColumnNames.length > 0) {
      for (const altName of alternativeColumnNames) {
        const lowerCaseAltName = altName.toLowerCase().trim()
        index = headers.findIndex((h) => h.toLowerCase().trim() === lowerCaseAltName)
        if (index !== -1) break
      }
    }
    return index
  }

  const handleImport = async () => {
    if (!file) return

    if (importType === "bank" && !selectedBankAccount) {
      alert("Por favor, selecione uma conta bancária.")
      return
    }

    if (importType === "credit_card" && !selectedCreditCard) {
      alert("Por favor, selecione um cartão de crédito.")
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length < 2) {
        throw new Error("Arquivo CSV inválido: poucas linhas.")
      }

      const rawHeaders = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

      let dateIndex: number, valueIndex: number, descriptionIndex: number, idIndex: number

      if (importType === "bank") {
        dateIndex = getColumnIndex(rawHeaders, "Data")
        valueIndex = getColumnIndex(rawHeaders, "Valor")
        idIndex = getColumnIndex(rawHeaders, "Identificador")
        descriptionIndex = getColumnIndex(rawHeaders, "Descrição")
        if (dateIndex === -1 || valueIndex === -1 || idIndex === -1 || descriptionIndex === -1) {
          throw new Error(
            "Formato de extrato bancário inválido. Colunas esperadas: Data, Valor, Identificador, Descrição.",
          )
        }
      } else {
        // credit_card
        dateIndex = getColumnIndex(rawHeaders, "date")
        descriptionIndex = getColumnIndex(rawHeaders, "title", ["descrição", "description"]) // Adicionando alternativas
        valueIndex = getColumnIndex(rawHeaders, "amount", ["valor"]) // Adicionando alternativas
        idIndex = -1 // Não há ID explícito para cartão, será gerado
        if (dateIndex === -1 || descriptionIndex === -1 || valueIndex === -1) {
          throw new Error(
            "Formato de fatura de cartão inválido. Colunas esperadas: date, title/descrição, amount/valor.",
          )
        }
      }

      const transactions = []
      let duplicates = 0
      const cardTransactionGroups = new Map()

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))

        if (values.length < Math.max(dateIndex, valueIndex, descriptionIndex, idIndex !== -1 ? idIndex : 0) + 1) {
          console.warn(`Linha ${i + 1} ignorada: número de colunas insuficiente.`)
          continue
        }

        const dateStr = values[dateIndex]
        const valueStr = values[valueIndex]
        const description = values[descriptionIndex]
        let id = importType === "bank" ? values[idIndex] : null

        if (!dateStr || !valueStr || !description) {
          console.warn(`Linha ${i + 1} ignorada: dados essenciais ausentes (data, valor ou descrição).`)
          continue
        }

        if (importType === "credit_card" && !id) {
          id =
            utf8ToBase64(`${dateStr}-${description}-${valueStr}`)
              .replace(/[^a-zA-Z0-9]/g, "") // Remove caracteres não alfanuméricos do Base64 resultante
              .substring(0, 16) + `_${i}`
        }

        const transactionHash = utf8ToBase64(`${dateStr}-${description}-${valueStr}`).replace(/[^a-zA-Z0-9]/g, "")

        const exists = data.transactions.some((t) => t.nubankId === id || t.transactionHash === transactionHash)
        if (exists) {
          duplicates++
          continue
        }

        let day: string, month: string, yearStr: string
        if (dateStr.includes("/")) {
          // Formato DD/MM/YYYY ou D/M/YY etc.
          const parts = dateStr.split("/")
          if (parts.length !== 3) {
            console.warn(`Linha ${i + 1} ignorada: formato de data com barras inválido "${dateStr}".`)
            continue
          }
          day = parts[0]
          month = parts[1]
          yearStr = parts[2]
        } else if (dateStr.includes("-")) {
          // Formato YYYY-MM-DD ou YY-M-D etc.
          const parts = dateStr.split("-")
          if (parts.length !== 3) {
            console.warn(`Linha ${i + 1} ignorada: formato de data com hífens inválido "${dateStr}".`)
            continue
          }
          yearStr = parts[0]
          month = parts[1]
          day = parts[2]
        } else {
          console.warn(`Linha ${i + 1} ignorada: formato de data irreconhecível "${dateStr}".`)
          continue
        }

        if (yearStr.length === 2) {
          yearStr = `20${yearStr}` // Assume século 21 para anos com 2 dígitos
        } else if (yearStr.length !== 4) {
          console.warn(`Linha ${i + 1} ignorada: formato de ano inválido "${yearStr}" na data "${dateStr}".`)
          continue
        }

        const date = `${yearStr}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
        // Verificar se a data resultante é válida (opcional, mas bom para robustez)
        if (isNaN(new Date(date).getTime())) {
          console.warn(`Linha ${i + 1} ignorada: data inválida após conversão "${date}" (original: "${dateStr}").`)
          continue
        }

        const parsedAmount = Number.parseFloat(valueStr.replace(",", "."))
        if (isNaN(parsedAmount)) {
          console.warn(`Linha ${i + 1} ignorada: formato de valor inválido "${valueStr}".`)
          continue
        }
        const amount = Math.abs(parsedAmount)

        const importedDescription = description || "Transação importada"
        let categoryIdToApply = "pending"

        // Tentar encontrar categoria com fuzzy matching
        if (data.userSettings.categoryMappings && Object.keys(data.userSettings.categoryMappings).length > 0) {
          const mappedDescriptions = Object.keys(data.userSettings.categoryMappings).map((desc) => ({
            description: desc,
          }))
          const fuse = new Fuse(mappedDescriptions, {
            keys: ["description"],
            threshold: 0.3, // Ajuste este valor (0.0 = exato, 1.0 = qualquer coisa)
            includeScore: true,
          })
          const results = fuse.search(importedDescription)
          if (results.length > 0 && results[0].score !== undefined && results[0].score < 0.3) {
            // Usar o mesmo threshold
            categoryIdToApply = data.userSettings.categoryMappings[results[0].item.description]
          }
        }

        if (importType === "credit_card") {
          // Para cartão de crédito, o valor original (com sinal) determina o tipo
          const originalAmount = parsedAmount // Não usar Math.abs ainda
          const transactionTypeForCard: "income" | "expense" = originalAmount < 0 ? "income" : "expense"
          const finalAmountForCard = Math.abs(originalAmount)

          if (transactionTypeForCard === "expense") {
            // Agrupar apenas despesas
            const groupKey = `${date}-${importedDescription.split(" ")[0]}` // Chave de agrupamento
            if (cardTransactionGroups.has(groupKey)) {
              const existingGroup = cardTransactionGroups.get(groupKey)
              existingGroup.amount += finalAmountForCard
              existingGroup.count += 1
              // Atualizar descrição do grupo se necessário, ex: manter a primeira ou a mais longa
              // existingGroup.description = `${importedDescription.split(" ")[0]} (${existingGroup.count}x)`;
            } else {
              cardTransactionGroups.set(groupKey, {
                date,
                description: importedDescription, // Usar a descrição completa da primeira transação do grupo
                amount: finalAmountForCard,
                count: 1,
                originalId: id, // ID da primeira transação do grupo
                transactionHash, // Hash da primeira transação do grupo
                type: "expense" as const, // Adicionar tipo ao grupo
                categoryId: categoryIdToApply, // Categoria (pode ser mapeada ou pending)
              })
            }
          } else {
            // Estornos (income) não são agrupados e são adicionados diretamente
            const transactionId = generateId()
            transactions.push({
              id: transactionId,
              date,
              description: importedDescription,
              amount: finalAmountForCard,
              type: "income",
              categoryId: categoryIdToApply,
              assetId: selectedCreditCard,
              status: "realized" as const,
              nubankId: id,
              transactionHash,
              originalImportType: "credit_card",
            })
          }
        } else {
          // Extrato Bancário
          let type: "income" | "expense"
          let assetId: string

          type = parsedAmount > 0 ? "income" : "expense"
          const finalAmountBank = Math.abs(parsedAmount)
          assetId = selectedBankAccount

          const transactionId = generateId()
          transactions.push({
            id: transactionId,
            date,
            description: importedDescription,
            amount: finalAmountBank,
            type,
            categoryId: categoryIdToApply,
            assetId,
            status: "realized" as const,
            nubankId: id,
            transactionHash,
            originalImportType: "bank",
          })
        }
      }

      if (importType === "credit_card") {
        for (const group of cardTransactionGroups.values()) {
          const transactionId = generateId()
          transactions.push({
            id: transactionId,
            date: group.date,
            description: group.count > 1 ? `${group.description} (${group.count}x)` : group.description,
            amount: group.amount,
            type: "expense" as const, // Os grupos são sempre de despesa
            categoryId: group.categoryId, // Usar a categoria do grupo (pode ser mapeada ou pending)
            assetId: selectedCreditCard,
            status: "realized" as const,
            nubankId: group.originalId, // Usar o ID da primeira transação do grupo
            transactionHash: group.transactionHash, // Usar o hash da primeira transação
            originalImportType: "credit_card",
          })
        }
      }

      await saveData({
        ...data,
        transactions: [...data.transactions, ...transactions],
      })

      setImportResult({
        success: true,
        message: `Importação de ${importType === "bank" ? "extrato bancário" : "fatura do cartão"} concluída! ${importType === "credit_card" ? "Transações similares foram agrupadas. " : ""}Transações que necessitam de categorização podem ser encontradas na aba 'Pendências'.`,
        imported: transactions.length,
        duplicates,
      })
      await updateGamification()
    } catch (error: any) {
      console.error("Erro na importação:", error)
      setImportResult({
        success: false,
        message: error.message || "Erro ao importar arquivo. Verifique o formato e tente novamente.",
        imported: 0,
        duplicates: 0,
      })
    } finally {
      setImporting(false)
    }
  }

  const handleOpenNewItemDialog = (type: "bank" | "credit_card") => {
    setNewItemType(type)
    setNewItemName("")
    setIsNewItemDialogOpen(true)
  }

  const handleCreateNewItem = async () => {
    if (!newItemName.trim()) {
      alert("Por favor, insira um nome para o novo item.")
      return
    }

    const newItem: Omit<Asset, "id" | "lastUpdated" | "isActive" | "amount"> = {
      name: newItemName.trim(),
      type: newItemType,
      assetType: newItemType === "bank" ? "asset" : "liability",
      liquidity: "high",
      notes: "Criado via importação",
    }

    const newAssetFull: Asset = {
      ...newItem,
      id: generateId(),
      amount: 0,
      lastUpdated: new Date().toISOString(),
      isActive: true,
    }

    const updatedData = {
      ...data,
      assets: [...data.assets, newAssetFull],
    }

    await saveData(updatedData)

    if (newItemType === "bank") {
      setSelectedBankAccount(newAssetFull.id)
    } else {
      setSelectedCreditCard(newAssetFull.id)
    }

    setIsNewItemDialogOpen(false)
    setNewItemName("")
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <span className="text-2xl">📥</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Importar Transações</h2>
            <p className="text-gray-600 dark:text-gray-400">Importe extratos bancários ou faturas de cartão</p>
          </div>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle>Tipo de Importação</CardTitle>
          <CardDescription>Escolha o tipo de arquivo que você está importando</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={importType} onValueChange={(value) => setImportType(value as "bank" | "credit_card")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bank" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Extrato Bancário
              </TabsTrigger>
              <TabsTrigger value="credit_card" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Fatura do Cartão
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bank" className="space-y-4 mt-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">📊 Extrato Bancário</h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Colunas esperadas: Data, Valor, Identificador, Descrição.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank-account">Conta Bancária</Label>
                <div className="flex gap-2">
                  <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount} disabled={importing}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione a conta bancária" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => handleOpenNewItemDialog("bank")} disabled={importing}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Nova
                  </Button>
                </div>
                {bankAccounts.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma conta bancária. Clique em "Nova" para criar.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="credit_card" className="space-y-4 mt-4">
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-lg">
                <h4 className="font-semibold text-rose-800 dark:text-rose-200 mb-2">💳 Fatura do Cartão</h4>
                <p className="text-sm text-rose-700 dark:text-rose-300">
                  Colunas esperadas: date, title (ou descrição), amount (ou valor).
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="credit-card">Cartão de Crédito</Label>
                <div className="flex gap-2">
                  <Select value={selectedCreditCard} onValueChange={setSelectedCreditCard} disabled={importing}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione o cartão de crédito" />
                    </SelectTrigger>
                    <SelectContent>
                      {creditCards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => handleOpenNewItemDialog("credit_card")} disabled={importing}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Novo
                  </Button>
                </div>
                {creditCards.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum cartão de crédito. Clique em "Novo" para criar.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload do Arquivo CSV</CardTitle>
          <CardDescription>
            Selecione o arquivo CSV {importType === "bank" ? "do extrato bancário" : "da fatura do cartão"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileSelect} disabled={importing} />
          </div>
          {file && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Arquivo selecionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
              </AlertDescription>
            </Alert>
          )}
          <Button
            onClick={handleImport}
            disabled={
              !file ||
              importing ||
              (importType === "bank" && !selectedBankAccount) ||
              (importType === "credit_card" && !selectedCreditCard)
            }
            className="w-full"
          >
            {importing ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar {importType === "bank" ? "Extrato" : "Fatura"}
              </>
            )}
          </Button>
          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processando arquivo...</span>
                <span>Aguarde</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Resultado da Importação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className={importResult.success ? "border-emerald-200" : "border-red-200"}>
              <AlertDescription>{importResult.message}</AlertDescription>
            </Alert>
            {importResult.success && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">{importResult.imported}</div>
                  <div className="text-sm text-emerald-700">Transações Importadas</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
                  <div className="text-sm text-yellow-700">Duplicatas Ignoradas</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog para criar novo item (conta/cartão) */}
      <Dialog open={isNewItemDialogOpen} onOpenChange={setIsNewItemDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Novo {newItemType === "bank" ? "Conta Bancária" : "Cartão de Crédito"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-item-name" className="text-right">
                Nome
              </Label>
              <Input
                id="new-item-name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="col-span-3"
                placeholder={newItemType === "bank" ? "Ex: Conta Principal" : "Ex: Cartão Principal"}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsNewItemDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateNewItem}>Criar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
