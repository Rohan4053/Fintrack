import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Loader2, Plus, Trash2, Users, X } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { Empty, Panel } from "@/components/app/cards";
import { useTransactions } from "@/lib/data";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, formatINR, computeShares, type SplitType } from "@/lib/finance";
import {
  useAddMember,
  useAddSplitExpense,
  useCreateGroup,
  useDeleteGroup,
  useDeleteSplitExpense,
  useRemoveMember,
  useSettleBetween,
  useSplitData,
} from "@/lib/splits";
import { netBalances, simplifyDebts } from "@/lib/finance";
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/split-bills")({
  head: () => ({
    meta: [
      { title: "Split Bills — FinTrack" },
      {
        name: "description",
        content: "Share bills with housemates or friends, split equally or by amounts, and see who owes whom.",
      },
      { property: "og:title", content: "Split Bills — FinTrack" },
      {
        property: "og:description",
        content: "Share bills with housemates or friends, split equally or by amounts, and see who owes whom.",
      },
    ],
  }),
  component: SplitBills,
});

const today = () => new Date().toISOString().slice(0, 10);

function SplitBills() {
  const { data, isLoading } = useSplitData();
  const groups = data?.groups ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const gid = selected && groups.some((g) => g.id === selected) ? selected : (groups[0]?.id ?? null);

  return (
    <>
      <PageHeader title="Split Bills" subtitle="Shared spending, settled fairly — only your share counts as yours" />

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading your groups…
        </div>
      ) : groups.length ? (
        <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
          <Panel title="Groups">
            <ul className="space-y-1">
              {groups.map((g) => (
                <li key={g.id}>
                  <button
                    onClick={() => setSelected(g.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",
                      gid === g.id ? "bg-primary-soft font-semibold text-primary" : "hover:bg-accent",
                    )}
                  >
                    <Users className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{g.name}</span>
                  </button>
                </li>
              ))}
            </ul>
            <NewGroup />
          </Panel>
          {gid && <GroupDetail groupId={gid} />}
        </div>
      ) : (
        <Panel title="Get started">
          <Empty title="No groups yet">
            Create a group — for example "Flat 402" or "Goa trip" — then add the people who share bills with you.
          </Empty>
          <div className="mx-auto mt-4 max-w-sm">
            <NewGroup />
          </div>
        </Panel>
      )}
    </>
  );
}

function NewGroup() {
  const create = useCreateGroup();
  const [name, setName] = useState("");
  return (
    <form
      className="mt-4 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        create.mutate(name.trim(), { onSuccess: () => setName("") });
      }}
    >
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New group name" className="h-9" />
      <Button type="submit" size="sm" disabled={!name.trim() || create.isPending}>
        <Plus className="size-4" />
      </Button>
    </form>
  );
}

function GroupDetail({ groupId }: { groupId: string }) {
  const { data } = useSplitData();
  const members = (data?.members ?? []).filter((m) => m.group_id === groupId);
  const expenses = (data?.expenses ?? []).filter((e) => e.group_id === groupId);
  const expenseIds = new Set(expenses.map((e) => e.id));
  const shares = (data?.shares ?? []).filter((s) => expenseIds.has(s.expense_id));
  const settlements = (data?.settlements ?? []).filter((s) => s.group_id === groupId);
  const memberIds = members.map((m) => m.id);
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "Someone";
  const self = members.find((m) => m.is_self);

  const balances = netBalances(
    memberIds,
    expenses.map((e) => ({ id: e.id, paid_by: e.paid_by, amount: e.amount })),
    shares.map((s) => ({ expense_id: s.expense_id, member_id: s.member_id, amount: s.amount })),
    settlements.map((s) => ({ from_member: s.from_member, to_member: s.to_member, amount: s.amount })),
  );
  const transfers = simplifyDebts(balances);
  const shareOf = (expenseId: string) =>
    shares.find((s) => s.expense_id === expenseId && s.member_id === self?.id)?.amount ?? 0;

  return (
    <div className="space-y-4">
      <Panel title="People" action={<DeleteGroupButton groupId={groupId} />}>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <span key={m.id} className="flex items-center gap-1.5 rounded-full border bg-surface px-3 py-1 text-sm">
              {m.name}
              {!m.is_self && <RemoveMember memberId={m.id} />}
            </span>
          ))}
        </div>
        <AddMember groupId={groupId} />
      </Panel>

      <Panel title="Who owes whom">
        {transfers.length ? (
          <ul className="space-y-2">
            {transfers.map((t) => (
              <li key={`${t.from}-${t.to}`} className="flex flex-wrap items-center gap-3 rounded-xl bg-surface px-4 py-3 text-sm">
                <span className="flex-1">
                  <span className="font-medium">{nameOf(t.from)}</span> pays{" "}
                  <span className="font-medium">{nameOf(t.to)}</span>
                </span>
                <span className="font-semibold text-expense">{formatINR(t.amount)}</span>
                <Settle groupId={groupId} from={t.from} to={t.to} amount={t.amount} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="All settled up">Nobody owes anybody in this group right now.</Empty>
        )}
      </Panel>

      <AddExpenseForm groupId={groupId} members={members} />

      <Panel title="Shared bills">
        {expenses.length ? (
          <ul className="divide-y">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.description}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {format(new Date(e.occurred_on), "d MMM yyyy")} · paid by {nameOf(e.paid_by)} ·{" "}
                    {e.split_type === "equal" ? "equally" : e.split_type === "percent" ? "by %" : "by amounts"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatINR(e.amount)}</p>
                  {self && <p className="text-xs text-muted-foreground">your share {formatINR(shareOf(e.id))}</p>}
                </div>
                <DeleteExpense expenseId={e.id} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="No shared bills yet">Add the first one above.</Empty>
        )}
      </Panel>
    </div>
  );
}

function DeleteGroupButton({ groupId }: { groupId: string }) {
  const del = useDeleteGroup();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={del.isPending}
      onClick={() => confirm("Delete this group and its bills?") && del.mutate(groupId)}
    >
      <Trash2 className="size-4" /> Delete group
    </Button>
  );
}

function RemoveMember({ memberId }: { memberId: string }) {
  const remove = useRemoveMember();
  return (
    <button
      aria-label="Remove person"
      onClick={() => remove.mutate(memberId)}
      className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-expense"
    >
      <X className="size-3" />
    </button>
  );
}

function AddMember({ groupId }: { groupId: string }) {
  const add = useAddMember();
  const [name, setName] = useState("");
  return (
    <form
      className="mt-4 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        add.mutate({ groupId, name: name.trim() }, { onSuccess: () => setName("") });
      }}
    >
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a person" className="h-9" />
      <Button type="submit" size="sm" disabled={!name.trim() || add.isPending}>
        <Plus className="size-4" /> Add
      </Button>
    </form>
  );
}

function Settle({ groupId, from, to, amount }: { groupId: string; from: string; to: string; amount: number }) {
  const settle = useSettleBetween();
  return (
    <Button size="sm" variant="outline" disabled={settle.isPending} onClick={() => settle.mutate({ groupId, from, to, amount })}>
      Mark settled
    </Button>
  );
}

function DeleteExpense({ expenseId }: { expenseId: string }) {
  const del = useDeleteSplitExpense();
  return (
    <button
      aria-label="Delete shared bill"
      onClick={() => confirm("Remove this shared bill?") && del.mutate(expenseId)}
      className="rounded-md p-1.5 text-muted-foreground hover:bg-expense-soft hover:text-expense"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

function AddExpenseForm({
  groupId,
  members,
}: {
  groupId: string;
  members: { id: string; name: string; is_self: boolean }[];
}) {
  const add = useAddSplitExpense();
  const self = members.find((m) => m.is_self);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [paidBy, setPaidBy] = useState(self?.id ?? members[0]?.id ?? "");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [picked, setPicked] = useState<string[]>(members.map((m) => m.id));
  const [values, setValues] = useState<Record<string, string>>({});
  const [category, setCategory] = useState<string>("Other");
  const [method, setMethod] = useState<string>("UPI");
  const [err, setErr] = useState<string | null>(null);

  const memberIds = picked.filter((id) => members.some((m) => m.id === id));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!description.trim()) return setErr("What was this bill for?");
    if (!amount || !Number.isFinite(n) || n <= 0) return setErr("Enter an amount greater than ₹0");
    if (!memberIds.length) return setErr("Choose at least one person");
    if (!paidBy) return setErr("Who paid it?");
    setErr(null);
    const nums: Record<string, number> = {};
    for (const id of memberIds) nums[id] = Number(values[id] ?? 0);
    try {
      computeShares(n, memberIds, splitType, nums);
    } catch (x) {
      return setErr(x instanceof Error ? x.message : "Check the split");
    }
    add.mutate(
      {
        groupId,
        description: description.trim(),
        amount: Math.round(n * 100) / 100,
        paidBy,
        splitType,
        memberIds,
        values: nums,
        occurredOn: date,
        selfId: self?.id,
        category,
        paymentMethod: method,
      },
      {
        onSuccess: () => {
          setDescription("");
          setAmount("");
          setValues({});
        },
      },
    );
  }

  return (
    <Panel title="Add a shared bill">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="desc">What was it?</Label>
            <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Weekend groceries" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="amt">Total amount</Label>
            <Input id="amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Who paid?</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Split</Label>
          <div className="mt-2 inline-flex rounded-xl border bg-card p-1">
            {(["equal", "custom", "percent"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSplitType(s)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm capitalize",
                  splitType === s ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {s === "custom" ? "by amounts" : s === "percent" ? "by %" : "equally"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>People</Label>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {members.map((m) => {
              const on = memberIds.includes(m.id);
              return (
                <li key={m.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => setPicked((p) => (on ? p.filter((x) => x !== m.id) : [...p, m.id]))}
                    className="size-4 accent-[var(--primary)]"
                  />
                  <span className="flex-1 text-sm">{m.name}</span>
                  {splitType !== "equal" && on && (
                    <Input
                      value={values[m.id] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [m.id]: e.target.value.replace(/[^\d.]/g, "") }))}
                      placeholder={splitType === "percent" ? "%" : "₹"}
                      className="h-8 w-24"
                      inputMode="decimal"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Your share counts as</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>You paid via</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {err && <p className="text-sm text-expense">{err}</p>}
        <Button type="submit" disabled={add.isPending}>
          {add.isPending && <Loader2 className="animate-spin" />} Add shared bill
        </Button>
      </form>
    </Panel>
  );
}
