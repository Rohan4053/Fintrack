import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { computeShares, type SplitType } from "./finance";
import { TX_KEY } from "./data";

export const SPLITS_KEY = ["splits"] as const;

export interface SplitGroup {
  id: string;
  name: string;
}
export interface SplitMember {
  id: string;
  group_id: string;
  name: string;
  is_self: boolean;
}
export interface SplitExpense {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  paid_by: string;
  split_type: SplitType;
  occurred_on: string;
}
export interface SplitShare {
  id: string;
  expense_id: string;
  member_id: string;
  amount: number;
}
export interface SplitSettlement {
  id: string;
  group_id: string;
  from_member: string;
  to_member: string;
  amount: number;
  settled_on: string;
}

export interface SplitData {
  groups: SplitGroup[];
  members: SplitMember[];
  expenses: SplitExpense[];
  shares: SplitShare[];
  settlements: SplitSettlement[];
}

const withAmount = <T extends { amount: unknown }>(rows: T[] | null) =>
  (rows ?? []).map((r) => ({ ...r, amount: Number(r.amount) }));

async function uid() {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("You need to sign in first");
  return id;
}

export function useSplitData() {
  return useQuery({
    queryKey: SPLITS_KEY,
    queryFn: async (): Promise<SplitData> => {
      const [groups, members, expenses, shares, settlements] = await Promise.all([
        supabase.from("split_groups").select("id,name").order("created_at"),
        supabase.from("split_members").select("id,group_id,name,is_self").order("name"),
        supabase
          .from("split_expenses")
          .select("id,group_id,description,amount,paid_by,split_type,occurred_on")
          .order("occurred_on", { ascending: false }),
        supabase.from("split_shares").select("id,expense_id,member_id,amount"),
        supabase
          .from("split_settlements")
          .select("id,group_id,from_member,to_member,amount,settled_on")
          .order("settled_on"),
      ]);
      const error =
        groups.error ?? members.error ?? expenses.error ?? shares.error ?? settlements.error;
      if (error) throw error;
      return {
        groups: (groups.data ?? []) as SplitGroup[],
        members: (members.data ?? []) as SplitMember[],
        expenses: withAmount(expenses.data) as SplitExpense[],
        shares: withAmount(shares.data) as SplitShare[],
        settlements: withAmount(settlements.data) as SplitSettlement[],
      };
    },
  });
}

function useRefreshOnSuccess(ok: string) {
  const qc = useQueryClient();
  return {
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SPLITS_KEY });
      qc.invalidateQueries({ queryKey: TX_KEY });
      toast.success(ok);
    },
    onError: (e: Error) => toast.error(e.message),
  };
}

export function useCreateGroup() {
  const refresh = useRefreshOnSuccess("Group created");
  return useMutation({
    mutationFn: async (name: string) => {
      const user = await uid();
      const { data, error } = await supabase
        .from("split_groups")
        .insert({ name, user_id: user })
        .select("id")
        .single();
      if (error) throw error;
      const { error: e2 } = await supabase
        .from("split_members")
        .insert({ group_id: data.id, user_id: user, name: "You", is_self: true });
      if (e2) throw e2;
    },
    ...refresh,
  });
}

export function useAddMember() {
  const refresh = useRefreshOnSuccess("Person added");
  return useMutation({
    mutationFn: async ({ groupId, name }: { groupId: string; name: string }) => {
      const user = await uid();
      const { error } = await supabase
        .from("split_members")
        .insert({ group_id: groupId, user_id: user, name, is_self: false });
      if (error) throw error;
    },
    ...refresh,
  });
}

export function useRemoveMember() {
  const refresh = useRefreshOnSuccess("Person removed");
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("split_members").delete().eq("id", memberId);
      if (error) throw error;
    },
    ...refresh,
  });
}

export interface NewSplitExpense {
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  splitType: SplitType;
  memberIds: string[];
  values: Record<string, number>;
  occurredOn: string;
  selfId: string | undefined;
  category: string;
  paymentMethod: string;
}

export function useAddSplitExpense() {
  const refresh = useRefreshOnSuccess("Shared bill added");
  return useMutation({
    mutationFn: async (input: NewSplitExpense) => {
      const user = await uid();
      const shares = computeShares(input.amount, input.memberIds, input.splitType, input.values);
      const { data: expense, error } = await supabase
        .from("split_expenses")
        .insert({
          group_id: input.groupId,
          user_id: user,
          description: input.description,
          amount: input.amount,
          paid_by: input.paidBy,
          split_type: input.splitType,
          occurred_on: input.occurredOn,
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: e2 } = await supabase
        .from("split_shares")
        .insert(
          input.memberIds.map((m) => ({
            expense_id: expense.id,
            user_id: user,
            member_id: m,
            amount: shares[m] ?? 0,
          })),
        );
      if (e2) throw e2;
      // Only the user's own share becomes a personal transaction — never the whole bill.
      const ownShare = input.selfId ? (shares[input.selfId] ?? 0) : 0;
      if (ownShare > 0) {
        const { error: e3 } = await supabase.from("transactions").insert({
          user_id: user,
          type: "expense",
          amount: ownShare,
          category: input.category,
          payment_method: input.paymentMethod,
          merchant: input.description,
          note: "Your share of a shared bill",
          tags: ["split"],
          occurred_at: new Date(`${input.occurredOn}T12:00:00`).toISOString(),
          recurring: false,
          is_sample: false,
          split_expense_id: expense.id,
        });
        if (e3) throw e3;
      }
    },
    ...refresh,
  });
}

export function useSettleBetween() {
  const refresh = useRefreshOnSuccess("Marked as settled");
  return useMutation({
    mutationFn: async ({
      groupId,
      from,
      to,
      amount,
    }: {
      groupId: string;
      from: string;
      to: string;
      amount: number;
    }) => {
      const user = await uid();
      const { error } = await supabase.from("split_settlements").insert({
        group_id: groupId,
        user_id: user,
        from_member: from,
        to_member: to,
        amount,
        settled_on: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
    },
    ...refresh,
  });
}

export function useDeleteSplitExpense() {
  const refresh = useRefreshOnSuccess("Shared bill removed");
  return useMutation({
    mutationFn: async (expenseId: string) => {
      const { error: e1 } = await supabase.from("split_shares").delete().eq("expense_id", expenseId);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("transactions")
        .delete()
        .eq("split_expense_id", expenseId);
      if (e2) throw e2;
      const { error: e3 } = await supabase.from("split_expenses").delete().eq("id", expenseId);
      if (e3) throw e3;
    },
    ...refresh,
  });
}

export function useDeleteGroup() {
  const refresh = useRefreshOnSuccess("Group deleted");
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data: expenses, error: e0 } = await supabase
        .from("split_expenses")
        .select("id")
        .eq("group_id", groupId);
      if (e0) throw e0;
      const ids = (expenses ?? []).map((e) => e.id as string);
      for (const id of ids) {
        const { error: e1 } = await supabase.from("split_shares").delete().eq("expense_id", id);
        if (e1) throw e1;
        const { error: e2 } = await supabase
          .from("transactions")
          .delete()
          .eq("split_expense_id", id);
        if (e2) throw e2;
      }
      const { error: e3 } = await supabase.from("split_settlements").delete().eq("group_id", groupId);
      if (e3) throw e3;
      const { error: e4 } = await supabase.from("split_expenses").delete().eq("group_id", groupId);
      if (e4) throw e4;
      const { error: e5 } = await supabase.from("split_members").delete().eq("group_id", groupId);
      if (e5) throw e5;
      const { error: e6 } = await supabase.from("split_groups").delete().eq("id", groupId);
      if (e6) throw e6;
    },
    ...refresh,
  });
}
