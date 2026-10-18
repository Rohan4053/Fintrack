import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, CreditCard, FileText, LayoutDashboard, LogOut, Menu, PieChart, Settings, Users, X, ArrowLeftRight, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/income", label: "Income", icon: TrendingUp },
  { to: "/insights", label: "Insights", icon: PieChart },
  { to: "/payments", label: "Payment methods", icon: CreditCard },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/split-bills", label: "Split Bills", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Logo() {
  return (
    <span className="flex items-center gap-2 text-lg font-bold">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><BarChart3 className="size-4" /></span>
      <span className="whitespace-nowrap">Fin<span className="text-primary">Track</span></span>
    </span>
  );
}

function NavLinks({ onNav }: { onNav?: () => void }) {
  return (
    <nav className="space-y-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link key={to} to={to} onClick={onNav} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" }}>
          <Icon className="size-4" />{label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const signOutBtn = (
    <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent">
      <LogOut className="size-4" />Sign out
    </button>
  );
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-sidebar p-4 lg:flex">
        <div className="px-2 py-3"><Logo /></div>
        <div className="mt-6 flex-1"><NavLinks /></div>
        {signOutBtn}
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-accent"><Menu className="size-5" /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar p-4 shadow-xl animate-in slide-in-from-left">
            <div className="flex items-center justify-between px-2 py-3"><Logo /><button aria-label="Close menu" onClick={() => setOpen(false)}><X className="size-5" /></button></div>
            <div className="mt-4 flex-1"><NavLinks onNav={() => setOpen(false)} /></div>
            {signOutBtn}
          </div>
        </div>
      )}
      <main className={cn("lg:pl-64")}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
