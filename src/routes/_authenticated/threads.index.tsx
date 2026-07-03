import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/threads/")({
  head: () => ({ meta: [{ title: "Discussions — food n bev" }] }),
  component: ThreadsIndex,
});

type Row = {
  id: string; title: string; created_at: string; updated_at: string;
  created_by: string; project_id: string | null;
  projects: { id: string; name: string } | null;
  profiles: { alias: string | null } | null;
};

function ThreadsIndex() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("threads")
        .select("id,title,created_at,updated_at,created_by,project_id,projects(id,name),profiles!threads_created_by_fkey(alias)")
        .order("updated_at", { ascending: false })
        .limit(200);
      setRows((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Discussions</h1>
            <p className="mt-1 text-sm text-muted-foreground">Chat with other signed-in members. Optionally attach a thread to a project.</p>
          </div>
          <Button asChild><Link to="/threads/new"><Plus className="size-4" /> New thread</Link></Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            <MessageSquare className="mx-auto mb-2 size-6" />
            No discussions yet. Be the first to start one.
          </div>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {rows.map((r) => (
              <li key={r.id}>
                <Link to="/threads/$id" params={{ id: r.id }} className="block px-4 py-3 hover:bg-muted/50">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">{r.title}</span>
                    <span className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleString()}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {r.profiles?.alias && <span>by {r.profiles.alias}</span>}
                    {r.projects && <span>· project: {r.projects.name}</span>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
