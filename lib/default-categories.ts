import type { Category } from "@/types/financial-data"
import { generateId } from "@/lib/utils"

export function createDefaultCategories(): Category[] {
  const categories: Omit<Category, "id" | "createdAt">[] = [
    // Categorias de Receita
    { name: "Salário", type: "income", essential: "essential", color: "#10B981", isDefault: true },
    { name: "Freelance", type: "income", essential: "non-essential", color: "#059669", isDefault: true },
    { name: "Investimentos", type: "income", essential: "non-essential", color: "#047857", isDefault: true },
    { name: "Vendas", type: "income", essential: "non-essential", color: "#065F46", isDefault: true },
    { name: "Outros Recebimentos", type: "income", essential: "non-essential", color: "#064E3B", isDefault: true },

    // Categorias de Despesa Essenciais
    { name: "Moradia", type: "expense", essential: "essential", color: "#DC2626", isDefault: true },
    { name: "Alimentação", type: "expense", essential: "essential", color: "#B91C1C", isDefault: true },
    { name: "Transporte", type: "expense", essential: "essential", color: "#991B1B", isDefault: true },
    { name: "Saúde", type: "expense", essential: "essential", color: "#7F1D1D", isDefault: true },
    { name: "Educação", type: "expense", essential: "essential", color: "#EF4444", isDefault: true },
    { name: "Seguros", type: "expense", essential: "essential", color: "#F87171", isDefault: true },

    // Categorias de Despesa Não Essenciais
    { name: "Entretenimento", type: "expense", essential: "non-essential", color: "#F59E0B", isDefault: true },
    { name: "Compras", type: "expense", essential: "non-essential", color: "#D97706", isDefault: true },
    { name: "Viagens", type: "expense", essential: "non-essential", color: "#B45309", isDefault: true },
    { name: "Assinaturas", type: "expense", essential: "non-essential", color: "#92400E", isDefault: true },
    { name: "Presentes", type: "expense", essential: "non-essential", color: "#78350F", isDefault: true },
    { name: "Outros Gastos", type: "expense", essential: "non-essential", color: "#451A03", isDefault: true },
  ]

  return categories.map((category) => ({
    ...category,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }))
}
