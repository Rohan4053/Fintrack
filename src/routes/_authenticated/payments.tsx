import { createFileRoute } from "@tanstack/react-router";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { PageHeader } from "@/components/app/AppShell";
import { Empty, Panel } from "@/components/app/cards";
import { Donut, HBars, MultiLine } from "@/components/app/charts";
import { PeriodFilter, usePeriod } from "@/components/app/PeriodFilter";
import { useTransactions } from "@/lib/data";
import { formatINR, groupSum, inRange, round2, totals, type Range, type Tx } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "Payment methods — FinTrack" },
      {
        name: "description",
        content: "See how much you spend through UPI, cards, cash, bank transfers and wallets.",
      },
      { property: "og:title", content: "Payment methods — FinTrack" },
      {
        property: "og:description",
        content: "See how much you spend through UPI, cards, cash, bank transfers and wallets.",
      },
    ],
  }),
  component: Payments,
});

function methodMonthly(txs: Tx[], months: number, methods: string[], now = new Date()) {
  const out: Record<string, string | number>[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(now, i);
    const r: Range = { from: startOfMonth(d), to: endOfMonth(d) };
    const row: Record<string, string | number> = { month: format(d, "MMM yy") };
    for (const m of methods) {
      row[m] = round2(
        txs
          .filter(
            (t) =>
              t.type === "expense" &&
              t.payment_method === m &&
              inRange(t, r),
          )
          .reduce((a, b) => a + Number(b.amount), 0),
      );
    }
    out.push(row);
  }
  return out;
}

function Payments() {
  const p = usePeriod();
  const { data: txs = [] } = useTransactions();
  const cur = txs.filter((t) => inRange(t, p.range));
  const expenses = cur.filter((t) => t.type === "expense");
  const byMethod = groupSum(expenses, (t) => t.payment_method);
  const total = totals(expenses).expense;
  const topMethods = byMethod.slice(0, 5).map((m) => m.name);
  const series = methodMonthly(txs, 6, topMethods);

  return (
    <>
      <PageHeader title="Payment methods" subtitle="How you actually pay for things">
        <PeriodFilter p={p} />
      </PageHeader>

      {byMethod.length ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Share of spending">
              <Donut data={byMethod} />
            </Panel>
            <Panel title="Amounts">
              <HBars data={byMethod} />
            </Panel>
          </div>

          <Panel title="Over the last 6 months" className="mt-4">
            {topMethods.length ? <MultiLine data={series} keys={topMethods} /> : <Empty title="No methods yet" />}
          </Panel>

          <Panel title="Details" className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-semibold">Method</th>
                    <th className="py-2 pr-3 text-right font-semibold">Spent</th>
                    <th className="py-2 pr-3 text-right font-semibold">Share</th>
                    <th className="py-2 text-right font-semibold">Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {byMethod.map((m) => (
                    <tr key={m.name} className="border-b last:border-0">
                      <td className="py-2.5 pr-3">{m.name}</td>
                      <td className="py-2.5 pr-3 text-right font-medium">{formatINR(m.value)}</td>
                      <td className="py-2.5 pr-3 text-right text-muted-foreground">
                        {total ? Math.round((m.value / total) * 100) : 0}%
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground">
                        {expenses.filter((t) => t.payment_method === m.name).length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      ) : (
        <Panel title="Payment methods">
          <Empty title="Nothing to show for this period">
            Add an expense with a payment method — UPI, card, cash — to see the breakdown.
          </Empty>
        </Panel>
      )}
    </>
  );
}
