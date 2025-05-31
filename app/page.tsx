import { FinanceApp } from "@/components/finance-app"; // Correct: Named import

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <FinanceApp />
    </main>
  );
}
