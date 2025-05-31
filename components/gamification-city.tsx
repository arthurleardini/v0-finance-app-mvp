"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building, Users, Heart, Zap, Trophy, Star } from "lucide-react"

interface GamificationCityProps {
  level: number
  cityState: {
    buildings: number
    population: number
    happiness: number
  }
  streak: number
}

export function GamificationCity({ level, cityState, streak }: GamificationCityProps) {
  const getCityDescription = (level: number) => {
    if (level <= 5) return "Vila Financeira"
    if (level <= 10) return "Cidade Pequena"
    if (level <= 15) return "Cidade Média"
    if (level <= 20) return "Metrópole"
    if (level <= 25) return "Megalópole"
    return "Cidade Futurística"
  }

  const getCityIcon = (level: number) => {
    if (level <= 5) return Building
    if (level <= 10) return Building
    if (level <= 15) return Building
    if (level <= 20) return Building
    if (level <= 25) return Trophy
    return Star
  }

  const getStreakColor = (streak: number) => {
    if (streak >= 7) return "bg-emerald-500"
    if (streak >= 3) return "bg-blue-500"
    return "bg-gray-500"
  }

  const CityIcon = getCityIcon(level)

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-950/20 dark:to-emerald-950/20">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
            <CityIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">{getCityDescription(level)}</CardTitle>
            <CardDescription>Nível {level} de 30</CardDescription>
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-2">
          <Badge variant="secondary" className={`${getStreakColor(streak)} text-white`}>
            <Zap className="h-3 w-3 mr-1" />
            {streak} dias seguidos
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <Building className="h-6 w-6 mx-auto text-gray-600" />
            <div className="text-2xl font-bold">{cityState.buildings}</div>
            <div className="text-sm text-muted-foreground">Edifícios</div>
          </div>
          <div className="space-y-1">
            <Users className="h-6 w-6 mx-auto text-blue-600" />
            <div className="text-2xl font-bold">{cityState.population.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">População</div>
          </div>
          <div className="space-y-1">
            <Heart className="h-6 w-6 mx-auto text-red-500" />
            <div className="text-2xl font-bold">{cityState.happiness}%</div>
            <div className="text-sm text-muted-foreground">Felicidade</div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso do Nível</span>
            <span>{level}/30</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(level / 30) * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          {level < 30
            ? "Continue organizando suas finanças para fazer sua cidade crescer!"
            : "Parabéns! Você construiu a cidade financeira perfeita!"}
        </div>
      </CardContent>
    </Card>
  )
}
