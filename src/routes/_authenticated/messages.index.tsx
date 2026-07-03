import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { respondToConnection, removeConnection, type ConnectionRow } from "@/lib/social";
import { Check, X, MessageSquare, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages/")({
  head: () => ({ meta: [{ title: "Messages & connections — food n bev" }] }),
  component: MessagesHome,
});

type ConnWithProfiles = ConnectionRow & {
  requester_alias: string | null;
  addressee_alias: string | null;
};

function MessagesHome() {
  const { user } = useAuth();
  const [conns, setConns] = useState<ConnWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    const { data, error } = await supabase
      .from("connections")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    const list = (data as any[]) ?? [];
    const ids = new Set<string>();
    for (const c of list) { ids.add(c.requester_id); ids.add(c.addressee_id); }
    const { data: profs } = ids.size
      ? await supabase.from("profiles").select("id,alias").in("id", Array.from(ids))
      : { data: [] as any[] };
    const alias = new Map((profs ?? []).map((p: any) => [p.id, p.alias as string | null]));
    setConns(list.map((c) => ({
      ...c,
      requester_alias: alias.get(c.requester_id) ?? null,
      addressee_alias: alias.get(c.addressee_id) ?? null,
    })));
    setLoading(false);
  }
  useEffect(() => { load(); }, [user?.id]);

  if (!user) return null;

  const incoming = conns.filter((c) => c.status === "pending" && c.addressee_id === user.id);
  const outgoing = conns.filter((c) => c.status === "pending" && c.requester_id === user.id);
  const accepted = conns.filter((c) => c.status === "accepted");

  function otherId(c: ConnWithProfiles) {
    return c.requester_id === user!.id ? c.addressee_id : c.requester_id;
  }
  function otherAlias(c: ConnWithProfiles) {
    return c.requester_id === user!.id ? c.addressee_alias : c.requester_alias;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Messages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect with other members from project pages. Once accepted, you can DM each other.
          </p>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <>
            <Section title={`Connection requests (${incoming.length})`}>
              {incoming.length === 0 && <Empty>No pending requests.</Empty>}
              {incoming.map((c) => (
                <Row key={c.id}>
                  <span className="font-medium">{otherAlias(c) ?? "user"}</span>
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={async () => { await respondToConnection(c.id, true); load(); }}><Check className="size-3.5" /> Accept</Button>
                    <Button size="sm" variant="outline" onClick={async () => { await respondToConnection(c.id, false); load(); }}><X className="size-3.5" /> Reject</Button>
                  </div>
                </Row>
              ))}
            </Section>

            <Section title={`Sent requests (${outgoing.length})`}>
              {outgoing.length === 0 && <Empty>No sent requests.</Empty>}
              {outgoing.map((c) => (
                <Row key={c.id}>
                  <span>{otherAlias(c) ?? "user"} <span className="text-xs text-muted-foreground">· pending</span></span>
                  <Button size="sm" variant="ghost" onClick={async () => { await removeConnection(c.id); load(); }}><Trash2 className="size-3.5" /> Cancel</Button>
                </Row>
              ))}
            </Section>

            <Section title={`Connections (${accepted.length})`}>
              {accepted.length === 0 && <Empty>No connections yet.</Empty>}
              {accepted.map((c) => {
                const oid = otherId(c);
                return (
                  <Row key={c.id}>
                    <span className="font-medium">{otherAlias(c) ?? "user"}</span>
                    <Button asChild size="sm">
                      <Link to="/messages/$userId" params={{ userId: oid }}><MessageSquare className="size-3.5" /> Message</Link>
                    </Button>
                  </Row>
                );
              })}
            </Section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <ul className="divide-y rounded-xl border bg-card">{children}</ul>
    </section>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <li className="flex items-center justify-between px-4 py-3 text-sm">{children}</li>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <li className="px-4 py-6 text-center text-sm text-muted-foreground">{children}</li>;
}
