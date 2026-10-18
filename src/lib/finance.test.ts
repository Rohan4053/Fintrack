import { describe, expect, it } from "vitest";
import { computeShares, netBalances, simplifyDebts, totals, type Tx } from "./finance";

const tx = (type: "income" | "expense", amount: number): Tx => ({
  id: Math.random().toString(),
  type,
  amount,
  category: "x",
  payment_method: "UPI",
  merchant: null,
  note: null,
  tags: [],
  occurred_at: new Date().toISOString(),
  recurring: false,
  receipt_path: null,
  is_sample: false,
  split_expense_id: null,
});

describe("bill splitting", () => {
  it("₹1,500 dinner split equally by 3 → ₹500 each", () => {
    expect(computeShares(1500, ["a", "b", "c"], "equal")).toEqual({ a: 500, b: 500, c: 500 });
  });

  it("when A paid ₹1,500, B and C each owe A ₹500", () => {
    const shares = computeShares(1500, ["a", "b", "c"], "equal");
    const bal = netBalances(
      ["a", "b", "c"],
      [{ id: "e", paid_by: "a", amount: 1500 }],
      Object.entries(shares).map(([member_id, amount]) => ({ expense_id: "e", member_id, amount })),
      [],
    );
    expect(simplifyDebts(bal)).toEqual(
      expect.arrayContaining([
        { from: "b", to: "a", amount: 500 },
        { from: "c", to: "a", amount: 500 },
      ]),
    );
  });

  it("uneven equal split still sums to the total", () => {
    const s = computeShares(100, ["a", "b", "c"], "equal");
    expect(s['a']! + s['b']! + s['c']!).toBeCloseTo(100, 2);
  });

  it("settlement clears the balance", () => {
    const bal = netBalances(
      ["a", "b"],
      [{ id: "e", paid_by: "a", amount: 1000 }],
      [
        { expense_id: "e", member_id: "a", amount: 500 },
        { expense_id: "e", member_id: "b", amount: 500 },
      ],
      [{ from_member: "b", to_member: "a", amount: 500 }],
    );
    expect(simplifyDebts(bal)).toEqual([]);
  });

  it("percentages must total 100", () => {
    expect(() => computeShares(100, ["a", "b"], "percent", { a: 50, b: 40 })).toThrow();
  });
});

describe("totals", () => {
  it("savings rate = (income − expenses) / income", () => {
    const t = totals([tx("income", 40000), tx("expense", 30000)]);
    expect(t.savings).toBe(10000);
    expect(t.savingsRate).toBe(25);
  });
});
