import type { ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { formatINR } from "@/lib/finance";
import { cn } from "@/lib/utils";

export function BalanceCard({ amount, label = "Total balance" }: { amount: number; label?: string }) {
  const positive = amount >= 0;
  return (
    <div className="rounded-2xl border bg-surface p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight">{formatINR(amount)}</p>
      <p className={cn("mt-4 flex items-center gap-1.5 text-sm", positive ? "text-primary" : "text-expense")}>
        {positive ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
        {positive ? "Positive cash flow" : "Negative cash flow"}
      </p>
    </div>
  );
}

export function IncomeCard({ amount, target, caption }: { amount: number; target: number; caption?: string }) {
  const pct = target > 0 ? Math.min(100, (amount / target) * 100) : amount > 0 ? 100 : 0;
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Income</p>
        <ArrowDownLeft className="size-4 text-income" />
      </div>
      <p className="mt-3 text-2xl font-bold text-income">{formatINR(amount)}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-income-soft">
        <div className="h-full rounded-full bg-income transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      {caption && <p className="mt-2 text-xs text-muted-foreground">{caption}</p>}
    </div>
  );
}

export function ExpenseCard({ amount, caption = "This month" }: { amount: number; caption?: string }) {
  return (
    <div className="card-surface p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-expense-soft text-expense"><ArrowUpRight className="size-4" /></span>
        <p className="text-muted-foreground">Expenses</p>
      </div>
      <p className="mt-3 text-2xl font-bold text-expense">{formatINR(amount)}</p>
      <p className="mt-2 text-sm text-muted-foreground">{caption}</p>
    </div>
  );
}

export function StatCard({ label, value, caption, icon, tone = "default" }: { label: string; value: string; caption?: string; icon: ReactNode; tone?: "default" | "primary" }) {
  return (
    <div className="card-surface p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">{icon}</span>
        <p className="text-muted-foreground">{label}</p>
      </div>
      <p className={cn("mt-3 text-2xl font-bold", tone === "primary" && "text-primary")}>{value}</p>
      {caption && <p className="mt-2 text-sm text-muted-foreground">{caption}</p>}
    </div>
  );
}

export function QuickActionCard({ icon, title, subtitle, onClick, tone = "primary" }: { icon: ReactNode; title: string; subtitle: string; onClick: () => void; tone?: "primary" | "income" | "expense" }) {
  const tile = { primary: "bg-primary-soft text-primary", income: "bg-income-soft text-income", expense: "bg-expense-soft text-expense" }[tone];
  return (
    <button onClick={onClick} className="card-surface group flex w-full items-center gap-4 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tile)}>{icon}</span>
      <span className="flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{subtitle}</span>
      </span>
      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

export function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("card-surface p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
