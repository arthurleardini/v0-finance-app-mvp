"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Home, Calendar, CreditCard, Wallet, BarChart3, AlertTriangle, Download, Settings, Menu, X } from "lucide-react"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  pendingCount: number
}

export function Sidebar({ activeTab, setActiveTab, pendingCount }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, emoji: "🏠" },
    { id: "planejamento", label: "Planejamento", icon: Calendar, emoji: "📋" },
    { id: "transacoes", label: "Transações", icon: CreditCard, emoji: "💳" },
    { id: "patrimonio", label: "Patrimônio", icon: Wallet, emoji: "💰" },
    { id: "relatorios", label: "Relatórios", icon: BarChart3, emoji: "📊" },
    {
      id: "pendencias",
      label: "Pendências",
      icon: AlertTriangle,
      emoji: "🔥",
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { id: "importar", label: "Importar", icon: Download, emoji: "📥" },
    { id: "config", label: "Configurações", icon: Settings, emoji: "⚙️" },
  ]

  return (
    <aside
      className={cn(
        "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg">FinanceApp</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="h-8 w-8">
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <nav className="px-2 pb-4">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start relative",
                isCollapsed ? "px-2" : "px-3",
                activeTab === item.id && "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
              )}
              onClick={() => setActiveTab(item.id)}
              aria-label={item.label}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.emoji}</span>
                {!isCollapsed && (
                  <>
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge
                        variant="destructive"
                        className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </div>
              {isCollapsed && item.badge && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </nav>
    </aside>
  )
}
