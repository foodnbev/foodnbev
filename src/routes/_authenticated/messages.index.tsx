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
  requester: { id: string; alias: string | null } | null;
  addressee: { id: string; alias: string | null } | null;
};

function MessagesHome() {
  const { user } = useAuth();
  const [conns, setConns] = useState<ConnWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    const { data, error } = await supabase
      .from("connections")
      .select("*, requester:profiles!connections_requester_id_fkey(id,alias), addressee:profiles!connections_addressee_id_fkey(id,alias)")
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setConns((data as any) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [user?.id]);

  if (!user) return null;

  const incoming = conns.filter((c) => c.status === "pending" && c.addressee_id === user.id);
  const outgoing = conns.filter((c) => c.status === "pending" && c.requester_id === user.id);
  const accepted = conns.filter((c) => c.status === "accepted");

  function other(c: ConnWithProfiles) {
    return c.requester_id === user!.id ? c.addressee : c.requester;
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
                  <span className="font-medium">{other(c)?.alias ?? "user"}</span>
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
                  <span>{other(c)?.alias ?? "user"} <span className="text-xs text-muted-foreground">· pending</span></span>
                  <Button size="sm" variant="ghost" onClick={async () => { await removeConnection(c.id); load(); }}><Trash2 className="size-3.5" /> Cancel</Button>
                </Row>
              ))}
            </Section>

            <Section title={`Connections (${accepted.length})`}>
              {accepted.length === 0 && <Empty>No connections yet.</Empty>}
              {accepted.map((c) => {
                const o = other(c);
                return (
                  <Row key={c.id}>
                    <span className="font-medium">{o?.alias ?? "user"}</span>
                    {o?.id && (
                      <Button asChild size="sm">
                        <Link to="/messages/$userId" params={{ userId: o.id }}><MessageSquare className="size-3.5" /> Message</Link>
                      </Button>
                    )}
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
