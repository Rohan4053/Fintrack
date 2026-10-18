import { createFileRoute } from "@tanstack/react-router";
import { Plus, Wallet, PiggyBank } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { BalanceCard, ExpenseCard, IncomeCard, Panel, QuickActionCard, StatCard } from "@/components/app/cards";
import { Donut, IncomeExpenseBars } from "@/components/app/charts";
import { PeriodFilter, usePeriod } from "@/components/app/PeriodFilter";
import { TxList } from "@/components/app/TxList";
import { useTxDialog } from "@/components/app/TxDialog";
import { useSampleData, useTransactions } from "@/lib/data";
import { formatINR, groupSum, inRange, monthlySeries, previousRange, totals } from "@/lib/finance";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — FinTrack" }, { name: "description", content: "Your income, expenses and savings at a glance." }] }),
  component: Dashboard,
});

function Dashboard() {
  const p = usePeriod();
  const { open } = useTxDialog();
  const { data: txs = [], isLoading } = useTransactions();
  const sample = useSampleData();
  const cur = txs.filter((t) => inRange(t, p.range));
  const prev = txs.filter((t) => inRange(t, previousRange(p.range)));
  const t = totals(cur);
  const all = totals(txs);
  const prevIncome = totals(prev).income;
  const hasSample = txs.some((x) => x.is_sample);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Your money at a glance"><PeriodFilter p={p} /></PageHeader>
      {!isLoading && txs.length === 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary-soft p-4">
          <p className="text-sm">No transactions yet. Add your first one, or explore with sample data.</p>
          <Button size="sm" onClick={() => sample.load.mutate()} disabled={sample.load.isPending}>Load sample data</Button>
        </div>
      )}
      {hasSample && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed p-4">
          <p className="text-sm text-muted-foreground">You're viewing sample data alongside your own entries.</p>
          <Button size="sm" variant="outline" onClick={() => sample.clear.mutate()}>Clear sample data</Button>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <BalanceCard amount={all.savings} />
        <IncomeCard amount={t.income} target={prevIncome} caption={prevIncome ? `vs ${formatINR(prevIncome)} previous period` : p.label} />
        <ExpenseCard amount={t.expense} caption={p.label} />
        <StatCard label="Savings" value={formatINR(t.savings)} icon={<PiggyBank className="size-4" />} tone="primary" />
        <StatCard label="Savings rate" value={`${t.savingsRate}%`} icon={<Wallet className="size-4" />} caption="Share of income kept" />
        <div className="grid gap-3">
          <QuickActionCard icon={<Plus className="size-4" />} title="Add expense" subtitle="Record a transaction" onClick={() => open("expense")} />
          <QuickActionCard icon={<Plus className="size-4" />} tone="income" title="Add income" subtitle="Salary, freelance, refunds" onClick={() => open("income")} />
        </div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Income vs expenses (6 months)"><IncomeExpenseBars data={monthlySeries(txs, 6)} /></Panel>
        <Panel title="Spending by category"><Donut data={groupSum(cur.filter((x) => x.type === "expense"), (x) => x.category)} /></Panel>
        <Panel title="Payment methods"><Donut data={groupSum(cur.filter((x) => x.type === "expense"), (x) => x.payment_method)} /></Panel>
        <Panel title="Recent transactions"><TxList txs={txs.slice(0, 6)} /></Panel>
      </div>
    </>
  );
}
