// Parser simples para expressões matemáticas
export function evaluateExpression(expression: string): number | null {
  try {
    // Remove espaços e substitui vírgulas por pontos
    const cleanExpression = expression.replace(/\s/g, "").replace(/,/g, ".")

    // Validar se contém apenas números e operadores permitidos
    const validPattern = /^[0-9+\-*/.()]+$/
    if (!validPattern.test(cleanExpression)) {
      return null
    }

    // Avaliar a expressão usando Function (mais seguro que eval)
    const result = new Function(`"use strict"; return (${cleanExpression})`)()

    // Verificar se o resultado é um número válido
    if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
      return Math.round(result * 100) / 100 // Arredondar para 2 casas decimais
    }

    return null
  } catch (error) {
    return null
  }
}

export function formatExpressionResult(expression: string): string {
  const result = evaluateExpression(expression)
  if (result !== null) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(result)
  }
  return ""
}
