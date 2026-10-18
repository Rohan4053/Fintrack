import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format, startOfDay, subDays } from "date-fns";
import { Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { Empty, Panel } from "@/components/app/cards";
import { HBars, IncomeExpenseBars, TrendArea } from "@/components/app/charts";
import { PeriodFilter, usePeriod } from "@/components/app/PeriodFilter";
import { useTransactions } from "@/lib/data";
import {
  categoryInsights,
  formatINR,
  groupSum,
  inRange,
  monthlySeries,
  pctChange,
  previousRange,
  round2,
  totals,
  type Range,
  type Tx,
} from "@/lib/finance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({
    meta: [
      { title: "Insights — FinTrack" },
      {
        name: "description",
        content: "Category breakdowns, month-over-month comparison and plain-language spending insights.",
      },
      { property: "og:title", content: "Insights — FinTrack" },
      {
        property: "og:description",
        content: "Category breakdowns, month-over-month comparison and plain-language spending insights.",
      },
    ],
  }),
  component: Insights,
});

function dailySeries(txs: Tx[], r: Range) {
  const days = Math.min(120, Math.round((r.to.getTime() - r.from.getTime()) / 86400000) + 1);
  const start = startOfDay(new Date(r.to));
  const from = startOfDay(subDays(start, days - 1));
  const map = new Map<string, number>();
  for (let i = 0; i < days; i++) map.set(format(subDays(start, i), "yyyy-MM-dd"), 0);
  for (const t of txs) {
    if (t.type !== "expense") continue;
    const k = format(new Date(t.occurred_at), "yyyy-MM-dd");
    if (map.has(k)) map.set(k, (map.get(k) ?? 0) + Number(t.amount));
  }
  return [...map.entries()]
    .filter(([k]) => new Date(k) >= from)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => ({ day: format(new Date(`${k}T12:00:00`), "d MMM"), value: round2(v) }));
}

function Insights() {
  const p = usePeriod();
  const { data: txs = [] } = useTransactions();
  const [mode, setMode] = useState<"daily" | "monthly">("daily");
  const cur = txs.filter((t) => inRange(t, p.range));
  const prev = txs.filter((t) => inRange(t, previousRange(p.range)));
  const curExp = cur.filter((t) => t.type === "expense");
  const prevExp = prev.filter((t) => t.type === "expense");
  const insights = useMemo(() => categoryInsights(cur, prev), [cur, prev]);
  const curCats = groupSum(curExp, (t) => t.category);
  const prevCats = new Map(groupSum(prevExp, (t) => t.category).map((c) => [c.name, c.value]));
  const allCats = [...new Set([...curCats.map((c) => c.name), ...prevCats.keys()])];
  const rows = allCats
    .map((name) => {
      const now = curCats.find((c) => c.name === name)?.value ?? 0;
      const before = prevCats.get(name) ?? 0;
      return { name, now, before, change: pctChange(now, before) };
    })
    .sort((a, b) => b.now - a.now);

  return (
    <>
      <PageHeader title="Insights" subtitle="What your numbers are actually telling you">
        <PeriodFilter p={p} />
      </PageHeader>

      <Panel title="Your insights">
        {insights.length ? (
          <ul className="space-y-3">
            {insights.map((s) => (
              <li key={s} className="flex items-start gap-3 rounded-xl bg-surface px-4 py-3">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="text-sm">{s}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="Not enough data yet">
            Add a few expenses for this period and insights will appear here automatically.
          </Empty>
        )}
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Top categories this period">
          <HBars data={curCats.slice(0, 8)} />
        </Panel>
        <Panel
          title={mode === "daily" ? "Daily spending" : "Monthly spending"}
          action={
            <div className="inline-flex rounded-lg border bg-card p-0.5">
              {(["daily", "monthly"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs capitalize",
                    mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          }
        >
          {mode === "daily" ? (
            <TrendArea data={dailySeries(curExp, p.range)} dataKey="value" xKey="day" />
          ) : (
            <IncomeExpenseBars data={monthlySeries(txs, 12)} />
          )}
        </Panel>
      </div>

      <Panel title="Compared with the previous period" className="mt-4">
        {prevExp.length || curExp.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Category</th>
                  <th className="py-2 pr-3 text-right font-semibold">This period</th>
                  <th className="py-2 pr-3 text-right font-semibold">Previous</th>
                  <th className="py-2 text-right font-semibold">Change</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name} className="border-b last:border-0">
                    <td className="py-2.5 pr-3">{r.name}</td>
                    <td className="py-2.5 pr-3 text-right font-medium">{formatINR(r.now)}</td>
                    <td className="py-2.5 pr-3 text-right text-muted-foreground">{formatINR(r.before)}</td>
                    <td
                      className={cn(
                        "py-2.5 text-right font-medium",
                        r.change === null
                          ? "text-muted-foreground"
                          : r.change > 0
                            ? "text-expense"
                            : "text-primary",
                      )}
                    >
                      {r.change === null ? "new" : `${r.change > 0 ? "+" : ""}${Math.round(r.change)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Nothing to compare yet">
            Record expenses in two consecutive periods to see the comparison.
          </Empty>
        )}
      </Panel>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Total spending this period: {formatINR(totals(curExp).expense)}
      </p>
    </>
  );
}
