import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { Loader2, Paperclip } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXPENSE_CATEGORIES, INCOME_SOURCES, PAYMENT_METHODS, type Tx, type TxType } from "@/lib/finance";
import { useSaveTx, useTransactions } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Ctx {
  open: (type: TxType, tx?: Tx) => void;
}
const TxCtx = createContext<Ctx>({ open: () => {} });
export const useTxDialog = () => useContext(TxCtx);

export function TxDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ type: TxType; tx?: Tx | undefined; key: number } | null>(null);
  const ctx = useMemo<Ctx>(() => ({ open: (type, tx) => setState({ type, tx, key: Date.now() }) }), []);
  return (
    <TxCtx.Provider value={ctx}>
      {children}
      <Dialog open={!!state} onOpenChange={(o) => !o && setState(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          {state && <TxForm key={state.key} type={state.type} tx={state.tx} onDone={() => setState(null)} />}
        </DialogContent>
      </Dialog>
    </TxCtx.Provider>
  );
}

function TxForm({ type, tx, onDone }: { type: TxType; tx?: Tx | undefined; onDone: () => void }) {
  const save = useSaveTx();
  const { data: all = [] } = useTransactions();
  const options = type === "expense" ? EXPENSE_CATEGORIES : INCOME_SOURCES;
  const [amount, setAmount] = useState(tx ? String(tx.amount) : "");
  const [category, setCategory] = useState(tx?.category ?? "");
  const [date, setDate] = useState(format(tx ? new Date(tx.occurred_at) : new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [method, setMethod] = useState(tx?.payment_method ?? "UPI");
  const [merchant, setMerchant] = useState(tx?.merchant ?? "");
  const [note, setNote] = useState(tx?.note ?? "");
  const [tags, setTags] = useState(tx?.tags.join(", ") ?? "");
  const [recurring, setRecurring] = useState(tx?.recurring ?? false);
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const frequent = useMemo(() => {
    const counts = new Map<string, number>();
    all.filter((t) => t.type === type).forEach((t) => counts.set(t.category, (counts.get(t.category) ?? 0) + 1));
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c).filter((c) => (options as readonly string[]).includes(c));
    return [...new Set([...top, ...options])].slice(0, 6);
  }, [all, type, options]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!amount || !Number.isFinite(n) || n <= 0) return setErr("Enter an amount greater than ₹0");
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) return setErr("Use up to 2 decimal places");
    if (!category) return setErr(type === "expense" ? "Pick a category" : "Pick an income source");
    setErr(null);
    let receipt_path = tx?.receipt_path ?? null;
    if (file) {
      setUploading(true);
      const { data: u } = await supabase.auth.getUser();
      const path = `${u.user?.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("receipts").upload(path, file);
      setUploading(false);
      if (error) return setErr(error.message);
      receipt_path = path;
    }
    save.mutate(
      {
        id: tx?.id,
        type,
        amount: Math.round(n * 100) / 100,
        category,
        payment_method: method,
        merchant: merchant.trim() || null,
        note: note.trim() || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        occurred_at: new Date(date).toISOString(),
        recurring,
        receipt_path,
      },
      { onSuccess: onDone },
    );
  }

  const accent = type === "expense" ? "text-expense" : "text-income";
  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{tx ? "Edit" : "Add"} {type === "expense" ? "expense" : "income"}</DialogTitle>
      </DialogHeader>
      <div>
        <Label htmlFor="amt">Amount</Label>
        <div className="relative mt-1">
          <span className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-semibold", accent)}>₹</span>
          <Input id="amt" autoFocus inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} className={cn("h-14 pl-9 text-2xl font-semibold", accent)} />
        </div>
      </div>
      <div>
        <Label>{type === "expense" ? "Category" : "Source"}</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {frequent.map((c) => (
            <button type="button" key={c} onClick={() => setCategory(c)} className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors", category === c ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent")}>
              {c}
            </button>
          ))}
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="mt-2"><SelectValue placeholder="All options…" /></SelectTrigger>
          <SelectContent>{options.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="dt">Date & time</Label>
          <Input id="dt" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Payment method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="mer">{type === "expense" ? "Merchant / description" : "Received from"}</Label>
        <Input id="mer" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder={type === "expense" ? "e.g. Swiggy, paid via PhonePe" : "e.g. Employer"} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="tags">Tags</Label>
          <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="work, trip" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="rc">Receipt</Label>
          <label htmlFor="rc" className="mt-1 flex h-9 cursor-pointer items-center gap-2 truncate rounded-md border px-3 text-sm text-muted-foreground hover:bg-accent">
            <Paperclip className="size-4 shrink-0" />{file?.name ?? (tx?.receipt_path ? "Attached" : "Attach file")}
          </label>
          <input id="rc" type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
      </div>
      <label className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5 text-sm">
        Recurring every month
        <Switch checked={recurring} onCheckedChange={setRecurring} />
      </label>
      {err && <p className="text-sm text-expense">{err}</p>}
      <Button type="submit" className="h-11 w-full" disabled={save.isPending || uploading}>
        {(save.isPending || uploading) && <Loader2 className="animate-spin" />}Save
      </Button>
    </form>
  );
}
