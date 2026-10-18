import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, LogOut } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { Panel } from "@/components/app/cards";
import { supabase } from "@/integrations/supabase/client";
import { useSampleData, useTransactions } from "@/lib/data";
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

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FinTrack" },
      {
        name: "description",
        content: "Update your name, currency and preferences, and manage sample data.",
      },
      { property: "og:title", content: "Settings — FinTrack" },
      {
        property: "og:description",
        content: "Update your name, currency and preferences, and manage sample data.",
      },
    ],
  }),
  component: Settings,
});

function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u, error: ue } = await supabase.auth.getUser();
      if (ue) throw ue;
      const id = u.user?.id;
      if (!id) throw new Error("You need to sign in first");
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return { id, email: u.user?.email ?? "", name: data?.full_name ?? "", currency: data?.currency ?? "INR" };
    },
  });
}

function Settings() {
  const { data: profile, isLoading } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: txs = [] } = useTransactions();
  const sample = useSampleData();
  const [name, setName] = useState<string | null>(null);
  const [currency, setCurrency] = useState("INR");
  const [busy, setBusy] = useState(false);

  const save = useMutation({
    mutationFn: async (values: { full_name: string; currency: string }) => {
      if (!profile?.id) throw new Error("Profile not loaded");
      const { error } = await supabase.from("profiles").update(values).eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function signOut() {
    setBusy(true);
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const hasSample = txs.some((t) => t.is_sample);

  return (
    <>
      <PageHeader title="Settings" subtitle="Your account and preferences" />

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Profile">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate({ full_name: (name ?? profile?.name ?? "").trim(), currency });
              }}
            >
              <div>
                <Label htmlFor="n">Name</Label>
                <Input
                  id="n"
                  value={name ?? profile?.name ?? ""}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="e">Email</Label>
                <Input id="e" value={profile?.email ?? ""} readOnly className="mt-1 bg-surface" />
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">Indian rupee (₹)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Amounts are shown in ₹ and rounded to paise.
                </p>
              </div>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="animate-spin" />} Save changes
              </Button>
            </form>
          </Panel>

          <div className="space-y-4">
            <Panel title="Sample data">
              <p className="text-sm text-muted-foreground">
                Sample entries are marked and kept separate from your own records, so you can explore
                the charts before entering real numbers.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => sample.load.mutate()}
                  disabled={sample.load.isPending}
                >
                  Load sample data
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => sample.clear.mutate()}
                  disabled={!hasSample || sample.clear.isPending}
                >
                  Clear sample data
                </Button>
              </div>
              {hasSample && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {txs.filter((t) => t.is_sample).length} sample entries are currently included in your totals.
                </p>
              )}
            </Panel>

            <Panel title="Session">
              <p className="text-sm text-muted-foreground">
                You're signed in as {profile?.email}. Signing out clears the loaded numbers from this
                device.
              </p>
              <Button size="sm" variant="outline" className="mt-4" onClick={signOut} disabled={busy}>
                <LogOut className="size-4" /> Sign out
              </Button>
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}
