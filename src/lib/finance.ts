import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Rent",
  "Healthcare",
  "Entertainment",
  "Education",
  "Travel",
  "Subscriptions",
  "Personal Care",
  "Family",
  "Other",
] as const;

export const INCOME_SOURCES = [
  "Salary",
  "Freelance",
  "Business",
  "Investments & Interest",
  "Rental",
  "Gifts",
  "Refund",
  "Other income",
] as const;

export const PAYMENT_METHODS = [
  "UPI",
  "Credit Card",
  "Debit Card",
  "Cash",
  "Bank Transfer",
  "Net Banking",
  "Wallet",
  "Other",
] as const;

export type TxType = "expense" | "income";

export interface Tx {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  payment_method: string;
  merchant: string | null;
  note: string | null;
  tags: string[];
  occurred_at: string;
  recurring: boolean;
  receipt_path: string | null;
  is_sample: boolean;
  split_expense_id: string | null;
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});
export const formatINR = (n: number) => inr.format(Math.round(n * 100) / 100);

export const round2 = (n: number) => Math.round(n * 100) / 100;

// ---------- Periods ----------
export type PeriodKey = "week" | "month" | "last_month" | "custom";
export interface Range {
  from: Date;
  to: Date;
}
export function periodRange(key: PeriodKey, now = new Date(), custom?: Range): Range {
  switch (key) {
    case "week":
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case "month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "last_month": {
      const lm = subMonths(now, 1);
      return { from: startOfMonth(lm), to: endOfMonth(lm) };
    }
    case "custom":
      return custom
        ? { from: startOfDay(custom.from), to: endOfDay(custom.to) }
        : { from: startOfMonth(now), to: endOfMonth(now) };
  }
}
/** Same-length window immediately preceding the range. */
export function previousRange(r: Range): Range {
  const len = r.to.getTime() - r.from.getTime();
  return { from: new Date(r.from.getTime() - len - 1), to: new Date(r.from.getTime() - 1) };
}
export const inRange = (t: Tx, r: Range) => {
  const d = new Date(t.occurred_at).getTime();
  return d >= r.from.getTime() && d <= r.to.getTime();
};

// ---------- Totals ----------
export function totals(txs: Tx[]) {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === "income") income += Number(t.amount);
    else expense += Number(t.amount);
  }
  income = round2(income);
  expense = round2(expense);
  const savings = round2(income - expense);
  const savingsRate = income > 0 ? round2((savings / income) * 100) : 0;
  return { income, expense, savings, savingsRate };
}

export function groupSum(txs: Tx[], key: (t: Tx) => string) {
  const m = new Map<string, number>();
  for (const t of txs) m.set(key(t), (m.get(key(t)) ?? 0) + Number(t.amount));
  return [...m.entries()]
    .map(([name, value]) => ({ name, value: round2(value) }))
    .sort((a, b) => b.value - a.value);
}

export function monthlySeries(txs: Tx[], months: number, now = new Date()) {
  const out: { month: string; key: string; income: number; expense: number; net: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(now, i);
    const r = { from: startOfMonth(d), to: endOfMonth(d) };
    const t = totals(txs.filter((x) => inRange(x, r)));
    out.push({ month: format(d, "MMM yy"), key: format(d, "yyyy-MM"), income: t.income, expense: t.expense, net: t.savings });
  }
  return out;
}

export const pctChange = (cur: number, prev: number) => (prev > 0 ? round2(((cur - prev) / prev) * 100) : null);

/** Generates insight sentences from real data. Returns [] when not enough data. */
export function categoryInsights(cur: Tx[], prev: Tx[]): string[] {
  const curExp = cur.filter((t) => t.type === "expense");
  const prevExp = prev.filter((t) => t.type === "expense");
  if (curExp.length < 3) return [];
  const out: string[] = [];
  const total = totals(curExp).expense;
  const curCats = groupSum(curExp, (t) => t.category);
  const prevCats = new Map(groupSum(prevExp, (t) => t.category).map((c) => [c.name, c.value]));
  const top = curCats[0];
  if (top && total > 0) out.push(`${top.name} accounts for ${Math.round((top.value / total) * 100)}% of your spending this period.`);
  if (prevExp.length >= 3) {
    for (const c of curCats.slice(0, 5)) {
      const ch = pctChange(c.value, prevCats.get(c.name) ?? 0);
      if (ch !== null && Math.abs(ch) >= 10)
        out.push(`${c.name} spending ${ch > 0 ? "increased" : "decreased"} by ${Math.abs(Math.round(ch))}% compared with the previous period.`);
    }
    const diff = round2(totals(prevExp).expense - total);
    if (diff !== 0) out.push(`You spent ${formatINR(Math.abs(diff))} ${diff > 0 ? "less" : "more"} than the previous period.`);
  }
  return out;
}

// ---------- Bill splitting ----------
export type SplitType = "equal" | "custom" | "percent";

/**
 * Compute each participant's share in rupees (rounded to paise).
 * Leftover paise from rounding go to the first participants so shares always sum to the total.
 */
export function computeShares(
  amount: number,
  memberIds: string[],
  type: SplitType,
  values: Record<string, number> = {},
): Record<string, number> {
  if (memberIds.length === 0) throw new Error("Choose at least one participant");
  const totalPaise = Math.round(amount * 100);
  let paise: number[];
  if (type === "equal") {
    const base = Math.floor(totalPaise / memberIds.length);
    paise = memberIds.map(() => base);
  } else if (type === "custom") {
    paise = memberIds.map((id) => Math.round((values[id] ?? 0) * 100));
    if (paise.reduce((a, b) => a + b, 0) !== totalPaise) throw new Error("Custom amounts must add up to the total");
  } else {
    const pct = memberIds.map((id) => values[id] ?? 0);
    if (Math.abs(pct.reduce((a, b) => a + b, 0) - 100) > 0.001) throw new Error("Percentages must add up to 100");
    paise = pct.map((p) => Math.floor((totalPaise * p) / 100));
  }
  let rem = totalPaise - paise.reduce((a, b) => a + b, 0);
  for (let i = 0; rem > 0; i = (i + 1) % paise.length, rem--) paise[i] = (paise[i] ?? 0) + 1;
  const out: Record<string, number> = {};
  memberIds.forEach((id, i) => (out[id] = (paise[i] ?? 0) / 100));
  return out;
}

export interface SplitExpenseLite {
  id: string;
  paid_by: string;
  amount: number;
}
export interface ShareLite {
  expense_id: string;
  member_id: string;
  amount: number;
}
export interface SettlementLite {
  from_member: string;
  to_member: string;
  amount: number;
}

/** Net balance per member: positive = is owed money, negative = owes money. */
export function netBalances(
  memberIds: string[],
  expenses: SplitExpenseLite[],
  shares: ShareLite[],
  settlements: SettlementLite[],
) {
  const bal: Record<string, number> = Object.fromEntries(memberIds.map((m) => [m, 0]));
  for (const e of expenses) bal[e.paid_by] = (bal[e.paid_by] ?? 0) + Math.round(Number(e.amount) * 100);
  for (const s of shares) bal[s.member_id] = (bal[s.member_id] ?? 0) - Math.round(Number(s.amount) * 100);
  for (const s of settlements) {
    const a = Math.round(Number(s.amount) * 100);
    bal[s.from_member] = (bal[s.from_member] ?? 0) + a;
    bal[s.to_member] = (bal[s.to_member] ?? 0) - a;
  }
  return Object.fromEntries(Object.entries(bal).map(([k, v]) => [k, v / 100]));
}

/** Minimal list of "X pays Y" transfers that settles all balances. */
export function simplifyDebts(balances: Record<string, number>) {
  const debtors = Object.entries(balances).filter(([, v]) => v < -0.004).map(([id, v]) => ({ id, amt: Math.round(-v * 100) }));
  const creditors = Object.entries(balances).filter(([, v]) => v > 0.004).map(([id, v]) => ({ id, amt: Math.round(v * 100) }));
  debtors.sort((a, b) => b.amt - a.amt);
  creditors.sort((a, b) => b.amt - a.amt);
  const out: { from: string; to: string; amount: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i]!;
    const c = creditors[j]!;
    const x = Math.min(d.amt, c.amt);
    out.push({ from: d.id, to: c.id, amount: x / 100 });
    d.amt -= x;
    c.amt -= x;
    if (d.amt === 0) i++;
    if (c.amt === 0) j++;
  }
  return out;
}

// ---------- CSV ----------
export function toCSV(txs: Tx[]) {
  const head = ["Date", "Type", "Category/Source", "Amount (INR)", "Payment method", "Merchant", "Note", "Tags"];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = txs.map((t) =>
    [format(new Date(t.occurred_at), "yyyy-MM-dd HH:mm"), t.type, t.category, String(t.amount), t.payment_method, t.merchant ?? "", t.note ?? "", t.tags.join(" ")].map(esc).join(","),
  );
  return [head.map(esc).join(","), ...rows].join("\n");
}
