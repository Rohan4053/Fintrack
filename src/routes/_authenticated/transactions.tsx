import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { Panel, StatCard } from "@/components/app/cards";
import { TxList } from "@/components/app/TxList";
import { useTxDialog } from "@/components/app/TxDialog";
import { useTransactions } from "@/lib/data";
import {
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  PAYMENT_METHODS,
  formatINR,
  toCSV,
  totals,
} from "@/lib/finance";
import { downloadFile } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — FinTrack" },
      {
        name: "description",
        content: "Search, filter, edit and export every expense and income you've recorded.",
      },
      { property: "og:title", content: "Transactions — FinTrack" },
      {
        property: "og:description",
        content: "Search, filter, edit and export every expense and income you've recorded.",
      },
    ],
  }),
  component: Transactions,
});

const ALL = "all";
const CATEGORIES = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_SOURCES])];

function Transactions() {
  const { open } = useTxDialog();
  const { data: txs = [] } = useTransactions();
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>(ALL);
  const [category, setCategory] = useState<string>(ALL);
  const [method, setMethod] = useState<string>(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const fromT = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity;
    const toT = to ? new Date(`${to}T23:59:59`).getTime() : Infinity;
    return txs.filter((t) => {
      if (type !== ALL && t.type !== type) return false;
      if (category !== ALL && t.category !== category) return false;
      if (method !== ALL && t.payment_method !== method) return false;
      const when = new Date(t.occurred_at).getTime();
      if (when < fromT || when > toT) return false;
      if (!needle) return true;
      const hay = `${t.merchant ?? ""} ${t.category} ${t.note ?? ""} ${t.tags.join(" ")}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [txs, q, type, category, method, from, to]);

  const t = totals(filtered);
  const clear = () => {
    setQ("");
    setType(ALL);
    setCategory(ALL);
    setMethod(ALL);
    setFrom("");
    setTo("");
  };

  return (
    <>
      <PageHeader title="Transactions" subtitle={`${filtered.length} of ${txs.length} entries shown`}>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => open("expense")}>
            <Plus className="size-4" /> Expense
          </Button>
          <Button size="sm" variant="outline" onClick={() => open("income")}>
            <Plus className="size-4" /> Income
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadFile(`spendwise-transactions-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(filtered))}
            disabled={!filtered.length}
          >
            <Download className="size-4" /> CSV
          </Button>
        </div>
      </PageHeader>

      <div className="card-surface grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Merchant, note or tag"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Payment method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="from">From</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="to">To</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" />
        </div>
        <div className="flex items-end">
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear filters
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Income" value={formatINR(t.income)} tone="primary" icon={<span className="text-sm font-bold">+</span>} />
        <StatCard label="Expenses" value={formatINR(t.expense)} icon={<span className="text-sm font-bold">−</span>} />
        <StatCard label="Net" value={formatINR(t.savings)} icon={<span className="text-sm font-bold">=</span>} />
      </div>

      <Panel title="Matching entries" className="mt-4">
        <TxList txs={filtered} />
      </Panel>
    </>
  );
}
