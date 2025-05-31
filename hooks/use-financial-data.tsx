"use client"

import { useState, useEffect, useCallback } from "react"
import { financialDB } from "@/lib/database"
import type { FinancialData } from "@/types/financial-data"

export function useFinancialData() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        let financialData = await financialDB.loadData()

        if (!financialData) {
          // Primeira vez ou migração necessária
          financialData = await financialDB.migrateFromLocalStorage()
        }

        setData(financialData)
      } catch (err) {
        setError("Erro ao carregar dados financeiros")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Salvar dados
  const saveData = useCallback(async (newData: FinancialData) => {
    try {
      await financialDB.saveData(newData)
      setData(newData)
    } catch (err) {
      setError("Erro ao salvar dados")
      console.error(err)
    }
  }, [])

  // Atualizar gamificação
  const updateGamification = useCallback(async () => {
    if (!data) return

    const now = new Date().toISOString()
    const lastInteraction = new Date(data.gamificationState.lastInteraction)
    const today = new Date()
    const daysSinceLastInteraction = Math.floor((today.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24))

    let newLevel = data.gamificationState.currentLevel
    let newStreak = data.gamificationState.streak

    // Se é a primeira interação do dia
    const isFirstInteractionToday = lastInteraction.toDateString() !== today.toDateString()

    if (isFirstInteractionToday) {
      if (daysSinceLastInteraction === 1) {
        // Sequência mantida
        newStreak += 1
        if (newLevel < 30) newLevel += 1
      } else if (daysSinceLastInteraction > 1) {
        // Perdeu dias - regride
        newLevel = Math.max(1, newLevel - daysSinceLastInteraction + 1)
        newStreak = 1
      }

      const updatedData = {
        ...data,
        gamificationState: {
          ...data.gamificationState,
          currentLevel: newLevel,
          lastInteraction: now,
          streak: newStreak,
          totalInteractions: data.gamificationState.totalInteractions + 1,
          cityState: {
            buildings: Math.min(30, Math.floor(newLevel / 2) + 1),
            population: newLevel * 50 + 50,
            happiness: Math.min(100, newLevel * 3 + 20),
          },
        },
      }

      await saveData(updatedData)
    }
  }, [data, saveData])

  return {
    data,
    loading,
    error,
    saveData,
    updateGamification,
  }
}
