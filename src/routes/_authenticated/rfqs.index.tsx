import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Clock } from "lucide-react";
import { PARTY_CATEGORY_LABEL, type PartyCategory } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/rfqs/")({
  head: () => ({ meta: [{ title: "RFQs — food n bev" }] }),
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

function isOpen(r: Row): boolean {
  if (r.closed_at) return false;
  const twoMonths = new Date(r.created_at).getTime() + 1000 * 60 * 60 * 24 * 62;
  if (Date.now() > twoMonths) return false;
  if (r.deadline && new Date(r.deadline).getTime() < Date.now()) return false;
  return true;
}

function RfqsIndex() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
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
      setLoading(false);
    })();
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Requests for quotation</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Only signed-in members can view and quote. You can ask <strong>one question</strong> per RFQ, submit <strong>one quote</strong>, and amend that quote <strong>once</strong>. RFQs auto-close after 2 months.
            </p>
          </div>
          <Button asChild><Link to="/rfqs/new"><Plus className="size-4" /> Post an RFQ</Link></Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            <FileText className="mx-auto mb-2 size-6" />
            No RFQs yet. Be the first to post one.
          </div>
        ) : (
          <ul className="grid gap-3">
            {rows.map((r) => {
              const open = isOpen(r);
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
        )}
      </div>
    </AppShell>
  );
}
