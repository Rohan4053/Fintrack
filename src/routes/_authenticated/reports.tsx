import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { Panel, StatCard } from "@/components/app/cards";
import { IncomeExpenseBars, TrendArea } from "@/components/app/charts";
import { useTransactions } from "@/lib/data";
import { formatINR, monthlySeries, round2, toCSV, totals } from "@/lib/finance";
import { downloadFile } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — FinTrack" },
      {
        name: "description",
        content: "6 and 12-month money reports: income, expenses, savings, best and worst months, and CSV export.",
      },
      { property: "og:title", content: "Reports — FinTrack" },
      {
        property: "og:description",
        content: "6 and 12-month money reports: income, expenses, savings, best and worst months, and CSV export.",
      },
    ],
  }),
  component: Reports,
});

function Reports() {
  const { data: txs = [] } = useTransactions();
  const [months, setMonths] = useState(6);
  const series = useMemo(() => monthlySeries(txs, months), [txs, months]);
  const t = useMemo(() => totals(txs), [txs]);
  const active = series.filter((s) => s.income || s.expense);
  const best = active.length ? active.reduce((a, b) => (b.net > a.net ? b : a)) : null;
  const worst = active.length ? active.reduce((a, b) => (b.net < a.net ? b : a)) : null;
  const avgExpense = active.length ? round2(active.reduce((a, b) => a + b.expense, 0) / active.length) : 0;

  const summaryCSV = useMemo(() => {
    const head = ["Month", "Income", "Expenses", "Net", "Savings rate %"];
    const rows = series.map((s) => [
      s.key,
      String(s.income),
      String(s.expense),
      String(s.net),
      String(s.income ? round2((s.net / s.income) * 100) : 0),
    ]);
    return [head, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  }, [series]);

  return (
    <>
      <PageHeader title="Reports" subtitle="The long view on your money">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border bg-card p-1">
            {[6, 12].map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm",
                  months === m ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {m} months
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadFile(`spendwise-monthly-summary-${months}m.csv`, summaryCSV)}
          >
            <Download className="size-4" /> Summary CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadFile("spendwise-transactions-all.csv", toCSV(txs))}
            disabled={!txs.length}
          >
            <Download className="size-4" /> All entries CSV
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`Income (${months}m)`} value={formatINR(series.reduce((a, b) => a + b.income, 0))} icon={<TrendingUp className="size-4" />} tone="primary" />
        <StatCard label={`Expenses (${months}m)`} value={formatINR(series.reduce((a, b) => a + b.expense, 0))} icon={<TrendingDown className="size-4" />} />
        <StatCard label="Balance to date" value={formatINR(t.savings)} icon={<Wallet className="size-4" />} />
        <StatCard label="Average monthly spend" value={formatINR(avgExpense)} icon={<PiggyBank className="size-4" />} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title={`Income vs expenses (${months} months)`}>
          <IncomeExpenseBars data={series} />
        </Panel>
        <Panel title="Net cash flow">
          <TrendArea data={series} dataKey="net" color="var(--primary)" />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Panel title="Best month">
          {best ? (
            <p className="text-2xl font-bold text-primary">
              {best.month}
              <span className="ml-2 text-base font-medium text-muted-foreground">{formatINR(best.net)} saved</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No months with activity yet.</p>
          )}
        </Panel>
        <Panel title="Tightest month">
          {worst ? (
            <p className="text-2xl font-bold text-expense">
              {worst.month}
              <span className="ml-2 text-base font-medium text-muted-foreground">{formatINR(worst.net)}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No months with activity yet.</p>
          )}
        </Panel>
      </div>

      <Panel title="Month by month" className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-semibold">Month</th>
                <th className="py-2 pr-3 text-right font-semibold">Income</th>
                <th className="py-2 pr-3 text-right font-semibold">Expenses</th>
                <th className="py-2 pr-3 text-right font-semibold">Net</th>
                <th className="py-2 text-right font-semibold">Savings rate</th>
              </tr>
            </thead>
            <tbody>
              {series.map((s) => (
                <tr key={s.key} className="border-b last:border-0">
                  <td className="py-2.5 pr-3 font-medium">{s.month}</td>
                  <td className="py-2.5 pr-3 text-right text-income">{formatINR(s.income)}</td>
                  <td className="py-2.5 pr-3 text-right text-expense">{formatINR(s.expense)}</td>
                  <td className="py-2.5 pr-3 text-right">{formatINR(s.net)}</td>
                  <td className="py-2.5 text-right text-muted-foreground">
                    {s.income ? `${round2((s.net / s.income) * 100)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
