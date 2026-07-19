import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Clock, Lock } from "lucide-react";
import { PARTY_CATEGORY_LABEL, type PartyCategory } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { listRfqsMasked } from "@/lib/rfqs.functions";

export const Route = createFileRoute("/rfqs/")({
  head: () => ({ meta: [{ title: "Anonymous Quotes — food n bev" }] }),
  component: RfqsIndex,
});

type Row = {
  id: string;
  description: string;
  deadline: string | null;
  anonymous: boolean;
  categories: PartyCategory[];
  closed_at: string | null;
  created_at: string;
  created_by: string;
  companies: { id: string; name: string } | null;
  projects: { id: string; name: string } | null;
  creator_alias?: string | null;
};

type MaskedRow = {
  id: string;
  created_at: string;
  closed_at: string | null;
  deadline: string | null;
  category_count: number;
};

function isOpenFull(r: { closed_at: string | null; created_at: string; deadline: string | null }): boolean {
  if (r.closed_at) return false;
  const twoMonths = new Date(r.created_at).getTime() + 1000 * 60 * 60 * 24 * 62;
  if (Date.now() > twoMonths) return false;
  if (r.deadline && new Date(r.deadline).getTime() < Date.now()) return false;
  return true;
}

function RfqsIndex() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [masked, setMasked] = useState<MaskedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchMasked = useServerFn(listRfqsMasked);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      setLoading(true);
      if (user) {
        const { data } = await supabase
          .from("rfqs" as any)
          .select("id,description,deadline,anonymous,categories,closed_at,created_at,created_by,companies(id,name),projects(id,name)")
          .order("created_at", { ascending: false })
          .limit(200);
        const list = (data as any[]) ?? [];
        const ids = Array.from(new Set(list.map((r) => r.created_by)));
        const { data: profs } = ids.length
          ? await supabase.from("profiles").select("id,alias").in("id", ids)
          : { data: [] as any[] };
        const alias = new Map((profs ?? []).map((p: any) => [p.id, p.alias]));
        setRows(list.map((r) => ({ ...r, creator_alias: alias.get(r.created_by) ?? null })));
      } else {
        try {
          const data = await fetchMasked();
          setMasked(data);
        } catch {
          setMasked([]);
        }
      }
      setLoading(false);
    })();
  }, [user, authLoading, fetchMasked]);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Anonymous Quotes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {user ? (
                <>Only signed-in members can view and quote. You can ask <strong>one question</strong> per request, submit <strong>one quote</strong>, and amend it <strong>once</strong>. Requests auto-close after 2 months.</>
              ) : (
                <>Browse recent quote requests below. <Link to="/auth" search={{ redirect: "/rfqs" }} className="font-medium underline">Sign in</Link> to view details, ask questions and submit quotes.</>
              )}
            </p>
          </div>
          {user && (
            <Button asChild><Link to="/rfqs/new"><Plus className="size-4" /> Post a request</Link></Button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : user ? (
          rows.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="grid gap-3">
              {rows.map((r) => {
                const open = isOpenFull(r);
                return (
                  <li key={r.id}>
                    <Link to="/rfqs/$id" params={{ id: r.id }} className="block rounded-xl border bg-card p-4 hover:bg-muted/40">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${open ? "bg-[#abdbe3] text-black" : "bg-black text-white"}`}>
                            {open ? "Open" : "Closed"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            by {r.anonymous ? "Anonymous" : (r.companies?.name || r.creator_alias || "Member")}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm">{r.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {r.categories?.map((c) => (
                          <span key={c} className="rounded-full bg-[#eab676]/25 px-2 py-0.5">{PARTY_CATEGORY_LABEL[c]}</span>
                        ))}
                        {r.projects && <span>· project: {r.projects.name}</span>}
                        {r.deadline && (
                          <span className="inline-flex items-center gap-1"><Clock className="size-3" /> deadline {new Date(r.deadline).toLocaleDateString()}</span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )
        ) : masked.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid gap-3">
            {masked.map((r) => {
              const open = isOpenFull(r);
              return (
                <li key={r.id} className="rounded-xl border bg-card p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${open ? "bg-[#abdbe3] text-black" : "bg-black text-white"}`}>
                        {open ? "Open" : "Closed"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Lock className="size-3" /> Sign in to view details
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {r.category_count > 0 && (
                      <span className="rounded-full bg-[#eab676]/25 px-2 py-0.5">{r.category_count} service tag{r.category_count === 1 ? "" : "s"}</span>
                    )}
                    {r.deadline && (
                      <span className="inline-flex items-center gap-1"><Clock className="size-3" /> deadline {new Date(r.deadline).toLocaleDateString()}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!user && !loading && (
          <div className="mt-6 rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">Want to see the details or post a request?</p>
            <Button asChild className="mt-3">
              <Link to="/auth" search={{ redirect: "/rfqs" }}>Sign in</Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
      <FileText className="mx-auto mb-2 size-6" />
      No requests yet.
    </div>
  );
}
