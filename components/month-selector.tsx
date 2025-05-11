"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"

interface MonthSelectorProps {
  selectedMonth: string // YYYY-MM format
  onChange: (month: string) => void
}

export function MonthSelector({ selectedMonth, onChange }: MonthSelectorProps) {
  const [availableMonths, setAvailableMonths] = useState<string[]>([])

  // Generate a list of months from 12 months ago to 12 months in the future
  useEffect(() => {
    const months = []
    const currentDate = new Date()

    // Start from 12 months ago
    const startDate = new Date(currentDate)
    startDate.setMonth(currentDate.getMonth() - 12)

    // Go until 12 months in the future
    const endDate = new Date(currentDate)
    endDate.setMonth(currentDate.getMonth() + 12)

    const currentMonth = new Date(startDate)

    while (currentMonth <= endDate) {
      const year = currentMonth.getFullYear()
      const month = String(currentMonth.getMonth() + 1).padStart(2, "0")
      months.push(`${year}-${month}`)

      currentMonth.setMonth(currentMonth.getMonth() + 1)
    }

    setAvailableMonths(months)
  }, [])

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split("-")
    return `${monthNames[Number.parseInt(month) - 1]} ${year}`
  }

  const goToPreviousMonth = () => {
    const currentIndex = availableMonths.indexOf(selectedMonth)
    if (currentIndex > 0) {
      onChange(availableMonths[currentIndex - 1])
    }
  }

  const goToNextMonth = () => {
    const currentIndex = availableMonths.indexOf(selectedMonth)
    if (currentIndex < availableMonths.length - 1) {
      onChange(availableMonths[currentIndex + 1])
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={goToPreviousMonth}
        disabled={availableMonths.indexOf(selectedMonth) === 0}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Select value={selectedMonth} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue>{formatMonthDisplay(selectedMonth)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableMonths.map((month) => (
            <SelectItem key={month} value={month}>
              {formatMonthDisplay(month)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={goToNextMonth}
        disabled={availableMonths.indexOf(selectedMonth) === availableMonths.length - 1}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
