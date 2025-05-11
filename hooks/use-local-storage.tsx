"use client"

import { useState, useEffect } from "react"

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Estado para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Inicializar o estado com o valor do localStorage (se disponível)
  useEffect(() => {
    // Verificar se estamos no navegador
    if (typeof window === "undefined") {
      return
    }

    try {
      const item = window.localStorage.getItem(key)
      // Analisar o item armazenado ou retornar initialValue
      setStoredValue(item ? JSON.parse(item) : initialValue)
    } catch (error) {
      console.log(error)
      setStoredValue(initialValue)
    }
  }, [key, initialValue])

  // Função para atualizar o valor no localStorage
  const setValue = (value: T) => {
    try {
      // Permitir que value seja uma função para seguir o mesmo padrão do useState
      const valueToStore = value instanceof Function ? value(storedValue) : value

      // Salvar no estado
      setStoredValue(valueToStore)

      // Salvar no localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.log(error)
    }
  }

  return [storedValue, setValue]
}
