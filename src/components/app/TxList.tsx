import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Pencil, Repeat, Trash2, Users } from "lucide-react";
import { formatINR, type Tx } from "@/lib/finance";
import { useDeleteTx } from "@/lib/data";
import { useTxDialog } from "./TxDialog";
import { Empty } from "./cards";
import { cn } from "@/lib/utils";

export function TxList({ txs, compact = false }: { txs: Tx[]; compact?: boolean }) {
  const { open } = useTxDialog();
  const del = useDeleteTx();
  if (!txs.length) return <Empty title="No transactions here yet">Add an expense or income to see it listed.</Empty>;
  return (
    <ul className="divide-y">
      {txs.map((t) => {
        const exp = t.type === "expense";
        return (
          <li key={t.id} className="group flex items-center gap-3 py-3">
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", exp ? "bg-expense-soft text-expense" : "bg-income-soft text-income")}>
              {exp ? <ArrowUpRight className="size-4" /> : <ArrowDownLeft className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate font-medium">
                {t.merchant || t.category}
                {t.recurring && <Repeat className="size-3 text-muted-foreground" />}
                {t.split_expense_id && <Users className="size-3 text-muted-foreground" />}
                {t.is_sample && <span className="rounded bg-muted px-1.5 text-[10px] font-semibold uppercase text-muted-foreground">Sample</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {t.category} · {t.payment_method} · {format(new Date(t.occurred_at), "d MMM, h:mm a")}
              </p>
            </div>
            <p className={cn("font-semibold", exp ? "text-expense" : "text-income")}>{exp ? "−" : "+"}{formatINR(t.amount)}</p>
            {!compact && !t.split_expense_id && (
              <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100">
                <button aria-label="Edit" onClick={() => open(t.type, t)} className="rounded-md p-1.5 hover:bg-accent"><Pencil className="size-4" /></button>
                <button aria-label="Delete" onClick={() => confirm("Delete this transaction?") && del.mutate(t.id)} className="rounded-md p-1.5 text-expense hover:bg-expense-soft"><Trash2 className="size-4" /></button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
