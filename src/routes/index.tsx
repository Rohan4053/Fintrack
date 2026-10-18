import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Check,
  CreditCard,
  FileText,
  PieChart,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import { Logo } from "@/components/app/AppShell";
import { BalanceCard, ExpenseCard, IncomeCard } from "@/components/app/cards";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FinTrack — Track spending, income and split bills in ₹" },
      {
        name: "description",
        content:
          "A money tracker made for Indian users: record expenses and income in ₹, see exactly where they go, and split bills with friends.",
      },
      { property: "og:title", content: "FinTrack" },
      {
        property: "og:description",
        content:
          "Record expenses and income in ₹, see exactly where they go, and split bills with friends.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Receipt,
    title: "Add an entry in seconds",
    body: "Amount, category, date and payment method — with frequent categories shown as one-tap chips.",
  },
  {
    icon: PieChart,
    title: "See where it goes",
    body: "Category and payment-method breakdowns, monthly trends and plain-language insights from your own numbers.",
  },
  {
    icon: Users,
    title: "Split bills fairly",
    body: "Share a bill equally, by amounts or by percentages, then see who owes whom and mark it settled.",
  },
  {
    icon: TrendingUp,
    title: "Income, not just spending",
    body: "Salary, freelance, rentals, refunds — tracked alongside expenses so savings add up honestly.",
  },
  {
    icon: CreditCard,
    title: "UPI, cards and cash",
    body: "Every method you actually use: UPI, credit and debit cards, cash, bank transfers, wallets.",
  },
  {
    icon: FileText,
    title: "Reports and export",
    body: "6 and 12-month summaries, best and worst months, and a CSV download whenever you want your data.",
  },
];

const POINTS = [
  "Amounts in ₹, rounded to paise — split shares always add up to the bill",
  "Only your own share of a shared bill counts in your personal spending",
  "Sample data you can load to explore, and clear away in one click",
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/auth">Create account</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-2 lg:pt-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            <ArrowLeftRight className="size-3.5" /> Expenses, income and shared bills in one place
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
            Know exactly where your money goes.
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">
            FinTrack keeps your expenses, income and split bills together — in ₹, on one
            honest dashboard.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Create free account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">I already have one</Link>
            </Button>
          </div>
          <ul className="mt-8 space-y-2.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                  <Check className="size-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="card-surface bg-surface/60 p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your dashboard
          </p>
          <div className="mt-4 space-y-3">
            <BalanceCard amount={64250} />
            <div className="grid gap-3 sm:grid-cols-2">
              <IncomeCard amount={85000} target={78000} caption="vs ₹78,000 last month" />
              <ExpenseCard amount={32450} caption="This month" />
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Example numbers — your own entries appear here once you sign up.
          </p>
        </div>
      </section>

      <section className="border-y bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <Icon className="size-4" />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight">Start with your own numbers</h2>
        <p className="mt-3 text-muted-foreground">
          UPI apps and bank statements are entered by you — we never claim to import them
          automatically. Prefer to look around first? Load clearly labelled sample data and clear it
          whenever you like.
        </p>
        <Button asChild size="lg" className="mt-7">
          <Link to="/auth">Create free account</Link>
        </Button>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo />
          <p>Your entries are visible only to you.</p>
        </div>
      </footer>
    </div>
  );
}
