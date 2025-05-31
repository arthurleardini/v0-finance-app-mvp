"use client"

import type { FinancialData } from "@/types/financial-data"
import { createDefaultCategories } from "@/lib/default-categories"
import { generateId } from "@/lib/utils"

// Simulação de banco de dados usando IndexedDB para persistência real
class FinancialDatabase {
  private dbName = "FinancialAppDB"
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Criar object store para dados financeiros
        if (!db.objectStoreNames.contains("financialData")) {
          db.createObjectStore("financialData", { keyPath: "id" })
        }
      }
    })
  }

  async saveData(data: FinancialData): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["financialData"], "readwrite")
      const store = transaction.objectStore("financialData")

      const request = store.put({ id: "main", ...data })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async loadData(): Promise<FinancialData | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["financialData"], "readonly")
      const store = transaction.objectStore("financialData")

      const request = store.get("main")

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        if (result) {
          const { id, ...data } = result
          resolve(data as FinancialData)
        } else {
          resolve(null)
        }
      }
    })
  }

  async migrateFromLocalStorage(): Promise<FinancialData> {
    // Tentar carregar dados existentes do localStorage
    const existingData = localStorage.getItem("financial-data")

    if (existingData) {
      try {
        const parsed = JSON.parse(existingData)

        // Migrar para nova estrutura
        const migratedData: FinancialData = {
          plannedIncomes:
            parsed.plannedIncomes?.map((income: any) => ({
              ...income,
              categoryId: income.category || "default-salary",
              assetId: "pending-asset",
              isRealized: false,
            })) || [],
          plannedExpenses:
            parsed.plannedExpenses?.map((expense: any) => ({
              ...expense,
              categoryId: expense.category || "default-others",
              assetId: "pending-asset",
              isRealized: false,
            })) || [],
          transactions:
            parsed.transactions?.map((transaction: any) => ({
              ...transaction,
              categoryId: transaction.category || "default-others",
              assetId: "pending-asset",
              status: "realized" as const,
            })) || [],
          assets: parsed.assets || [],
          pendingItems: [],
          gamificationState: {
            currentLevel: 1,
            lastInteraction: new Date().toISOString(),
            streak: 0,
            totalInteractions: 0,
            cityState: {
              buildings: 1,
              population: 100,
              happiness: 50,
            },
          },
          userSettings: {
            currency: "BRL",
            categories: createDefaultCategories(),
            gamificationEnabled: true,
            categoryMappings: parsed.userSettings?.categoryMappings || {},
          },
        }

        // Salvar dados migrados
        await this.saveData(migratedData)

        // Limpar localStorage antigo
        localStorage.removeItem("financial-data")

        return migratedData
      } catch (error) {
        console.error("Erro na migração:", error)
      }
    }

    // Criar dados iniciais se não existir nada
    const initialData: FinancialData = {
      plannedIncomes: [],
      plannedExpenses: [],
      transactions: [],
      assets: [
        {
          id: generateId(),
          name: "Carteira",
          amount: 0,
          type: "cash",
          liquidity: "high",
          notes: "Dinheiro em espécie",
          lastUpdated: new Date().toISOString(),
          isActive: true,
        },
      ],
      pendingItems: [],
      gamificationState: {
        currentLevel: 1,
        lastInteraction: new Date().toISOString(),
        streak: 0,
        totalInteractions: 0,
        cityState: {
          buildings: 1,
          population: 100,
          happiness: 50,
        },
      },
      userSettings: {
        currency: "BRL",
        categories: createDefaultCategories(),
        gamificationEnabled: true,
        categoryMappings: {},
      },
    }

    await this.saveData(initialData)
    return initialData
  }
}

export const financialDB = new FinancialDatabase()
