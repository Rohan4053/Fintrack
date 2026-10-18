import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, type Tx } from "./finance";

export const TX_KEY = ["transactions"] as const;

export function useTransactions() {
  return useQuery({
    queryKey: TX_KEY,
    queryFn: async (): Promise<Tx[]> => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, amount: Number(r.amount), type: r.type as Tx["type"] }));
    },
  });
}

export type TxInput = Omit<Tx, "id" | "is_sample" | "split_expense_id"> & { id?: string | undefined };

export function useSaveTx() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TxInput) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase.from("transactions").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("transactions").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: TX_KEY });
      toast.success(v.id ? "Transaction updated" : v.type === "income" ? "Income added" : "Expense added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTx() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TX_KEY });
      toast.success("Transaction deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

const MERCHANTS: Record<string, string[]> = {
  "Food & Dining": ["Swiggy", "Zomato", "Chai Point", "Haldiram's"],
  Groceries: ["BigBasket", "Blinkit", "DMart", "Zepto"],
  Transportation: ["Uber", "Ola", "Metro card", "Indian Oil"],
  Shopping: ["Amazon", "Flipkart", "Myntra"],
  "Bills & Utilities": ["Airtel", "BESCOM", "Jio Fiber"],
  Entertainment: ["BookMyShow", "PVR"],
  Subscriptions: ["Netflix", "Spotify", "Hotstar"],
  Healthcare: ["Apollo Pharmacy", "1mg"],
};

export function useSampleData() {
  const qc = useQueryClient();
  const load = useMutation({
    mutationFn: async () => {
      const rows: Record<string, unknown>[] = [];
      const now = new Date();
      for (let m = 0; m < 6; m++) {
        const base = subDays(now, m * 30);
        rows.push({ type: "income", amount: 85000, category: "Salary", payment_method: "Bank Transfer", merchant: "Acme Pvt Ltd", occurred_at: subDays(base, 2).toISOString(), recurring: true, is_sample: true });
        if (m % 2 === 0) rows.push({ type: "income", amount: 12000 + m * 1500, category: "Freelance", payment_method: "UPI", merchant: "Client project", occurred_at: subDays(base, 10).toISOString(), is_sample: true });
        rows.push({ type: "expense", amount: 22000, category: "Rent", payment_method: "Bank Transfer", merchant: "Landlord", occurred_at: subDays(base, 3).toISOString(), recurring: true, is_sample: true });
        for (let i = 0; i < 14; i++) {
          const cat = EXPENSE_CATEGORIES[Math.floor(Math.random() * 9)] ?? "Other";
          const ms = MERCHANTS[cat as string] ?? ["Local store"];
          rows.push({
            type: "expense",
            amount: Math.round((150 + Math.random() * 2800) * 100) / 100,
            category: cat === "Rent" ? "Food & Dining" : cat,
            payment_method: PAYMENT_METHODS[Math.floor(Math.random() * 4)],
            merchant: ms[Math.floor(Math.random() * ms.length)],
            occurred_at: subDays(base, Math.floor(Math.random() * 29)).toISOString(),
            is_sample: true,
          });
        }
      }
      const { error } = await supabase.from("transactions").insert(rows as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TX_KEY });
      toast.success("Sample data loaded");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const clear = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("transactions").delete().eq("is_sample", true);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TX_KEY });
      toast.success("Sample data cleared");
    },
  });
  return { load, clear };
}
