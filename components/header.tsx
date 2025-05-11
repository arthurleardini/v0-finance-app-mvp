import { WalletCards } from "lucide-react"

export function Header() {
  return (
    <header className="flex items-center justify-between py-4">
      <div className="flex items-center gap-2">
        <WalletCards className="h-8 w-8 text-emerald-500" />
        <h1 className="text-2xl font-bold">Controle Financeiro Pessoal</h1>
      </div>
    </header>
  )
}
