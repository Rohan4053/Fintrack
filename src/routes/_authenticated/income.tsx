import { createFileRoute } from "@tanstack/react-router";
import { Plus, Wallet } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { BalanceCard, ExpenseCard, IncomeCard, Panel, StatCard } from "@/components/app/cards";
import { Donut, HBars, IncomeExpenseBars, TrendArea } from "@/components/app/charts";
import { PeriodFilter, usePeriod } from "@/components/app/PeriodFilter";
import { TxList } from "@/components/app/TxList";
import { useTxDialog } from "@/components/app/TxDialog";
import { useTransactions } from "@/lib/data";
import { formatINR, groupSum, inRange, monthlySeries, previousRange, totals } from "@/lib/finance";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/income")({
  head: () => ({
    meta: [
      { title: "Income — FinTrack" },
      {
        name: "description",
        content: "Salary, freelance, rentals and refunds tracked month by month, with sources and savings.",
      },
      { property: "og:title", content: "Income — FinTrack" },
      {
        property: "og:description",
        content: "Salary, freelance, rentals and refunds tracked month by month, with sources and savings.",
      },
    ],
  }),
  component: Income,
});

function Income() {
  const p = usePeriod();
  const { open } = useTxDialog();
  const { data: txs = [] } = useTransactions();
  const cur = txs.filter((t) => inRange(t, p.range));
  const prev = txs.filter((t) => inRange(t, previousRange(p.range)));
  const t = totals(cur);
  const prevIncome = totals(prev).income;
  const months = monthlySeries(txs, 12);
  const incomeTxs = txs.filter((x) => x.type === "income");

  return (
    <>
      <PageHeader title="Income" subtitle="Everything coming in, by source and month">
        <div className="flex flex-wrap items-center gap-2">
          <PeriodFilter p={p} />
          <Button size="sm" onClick={() => open("income")}>
            <Plus className="size-4" /> Add income
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <IncomeCard
          amount={t.income}
          target={prevIncome}
          caption={prevIncome ? `vs ${formatINR(prevIncome)} previous period` : p.label}
        />
        <ExpenseCard amount={t.expense} caption={p.label} />
        <StatCard
          label="Net saved"
          value={formatINR(t.savings)}
          icon={<Wallet className="size-4" />}
          tone="primary"
          caption="Income minus expenses"
        />
        <BalanceCard amount={totals(txs).savings} label="Balance to date" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Income by month (12 months)">
          <IncomeExpenseBars data={months} />
        </Panel>
        <Panel title="Sources this period">
          <Donut data={groupSum(cur.filter((x) => x.type === "income"), (x) => x.category)} />
        </Panel>
        <Panel title="Top sources (all time)">
          <HBars
            data={groupSum(incomeTxs, (x) => x.category).slice(0, 6)}
            color="var(--income)"
          />
        </Panel>
        <Panel title="Net savings by month">
          <TrendArea data={months} dataKey="net" color="var(--income)" />
        </Panel>
        <Panel title="Income history" className="lg:col-span-2">
          <TxList txs={incomeTxs} />
        </Panel>
      </div>
    </>
  );
}
