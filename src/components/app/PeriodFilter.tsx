import { useMemo, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { Input } from "@/components/ui/input";
import { periodRange, type PeriodKey, type Range } from "@/lib/finance";
import { cn } from "@/lib/utils";

const OPTS: { key: PeriodKey; label: string }[] = [
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "custom", label: "Custom" },
];

export function usePeriod(initial: PeriodKey = "month") {
  const [key, setKey] = useState<PeriodKey>(initial);
  const [from, setFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const range: Range = useMemo(() => periodRange(key, new Date(), { from: new Date(from), to: new Date(to) }), [key, from, to]);
  const label = OPTS.find((o) => o.key === key)!.label;
  return { key, setKey, from, setFrom, to, setTo, range, label };
}

export function PeriodFilter({ p }: { p: ReturnType<typeof usePeriod> }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-xl border bg-card p-1">
        {OPTS.map((o) => (
          <button key={o.key} onClick={() => p.setKey(o.key)} className={cn("rounded-lg px-3 py-1.5 text-sm transition-colors", p.key === o.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            {o.label}
          </button>
        ))}
      </div>
      {p.key === "custom" && (
        <div className="flex items-center gap-2">
          <Input type="date" value={p.from} onChange={(e) => p.setFrom(e.target.value)} className="h-9 w-auto" />
          <span className="text-muted-foreground">to</span>
          <Input type="date" value={p.to} onChange={(e) => p.setTo(e.target.value)} className="h-9 w-auto" />
        </div>
      )}
    </div>
  );
}
