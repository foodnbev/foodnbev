import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Trash2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/threads/$id")({
  head: () => ({ meta: [{ title: "Discussion — food n bev" }] }),
  component: ThreadDetail,
});

type Msg = {
  id: string; body: string; created_at: string; user_id: string;
  alias?: string | null;
};
type Thread = {
  id: string; title: string; created_by: string; project_id: string | null;
  projects: { id: string; name: string } | null;
  creator_alias?: string | null;
};

function ThreadDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [thread, setThread] = useState<Thread | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function load() {
    const [{ data: t }, { data: m }] = await Promise.all([
      supabase.from("threads")
        .select("id,title,created_by,project_id,projects(id,name)")
        .eq("id", id).maybeSingle(),
      supabase.from("thread_messages")
        .select("id,body,created_at,user_id")
        .eq("thread_id", id).order("created_at"),
    ]);
    const messages = (m as any[]) ?? [];
    const ids = new Set<string>(messages.map((x) => x.user_id));
    if (t) ids.add((t as any).created_by);
    const { data: profs } = ids.size
      ? await supabase.from("profiles").select("id,alias").in("id", Array.from(ids))
      : { data: [] as any[] };
    const alias = new Map((profs ?? []).map((p: any) => [p.id, p.alias as string | null]));
    setThread(t ? { ...(t as any), creator_alias: alias.get((t as any).created_by) ?? null } : null);
    setMsgs(messages.map((x) => ({ ...x, alias: alias.get(x.user_id) ?? null })));
  }

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    const ch = supabase.channel(`thread:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "thread_messages", filter: `thread_id=eq.${id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [msgs.length]);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !body.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("thread_messages").insert({
      thread_id: id, user_id: user.id, body: body.trim(),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setBody("");
    load();
  }

  async function deleteThread() {
    if (!confirm("Delete this discussion?")) return;
    const { error } = await supabase.from("threads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    nav({ to: "/threads" });
  }

  async function deleteMsg(mid: string) {
    const { error } = await supabase.from("thread_messages").delete().eq("id", mid);
    if (error) return toast.error(error.message);
    load();
  }

  if (!thread) return <AppShell><div className="p-12 text-center text-muted-foreground">Loading…</div></AppShell>;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link to="/threads" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All discussions
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{thread.title}</h1>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {thread.creator_alias && <span>started by {thread.profiles.alias}</span>}
              {thread.projects && (
                <span>· project: <Link to="/projects/$id" params={{ id: thread.projects.id }} className="underline">{thread.projects.name}</Link></span>
              )}
            </div>
          </div>
          {user?.id === thread.created_by && (
            <Button size="sm" variant="outline" onClick={deleteThread}><Trash2 className="size-4" /> Delete</Button>
          )}
        </div>

        <div ref={scrollRef} className="mt-6 max-h-[60vh] space-y-3 overflow-y-auto rounded-xl border bg-card p-4">
          {msgs.map((m) => (
            <div key={m.id} className="rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span><span className="font-medium text-foreground">{m.alias ?? "user"}</span> · {new Date(m.created_at).toLocaleString()}</span>
                {m.user_id === user?.id && (
                  <button aria-label="Delete" onClick={() => deleteMsg(m.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{m.body}</p>
            </div>
          ))}
          {msgs.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
        </div>

        <form onSubmit={post} className="mt-4 space-y-2">
          <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a reply…" />
          <div className="flex justify-end">
            <Button type="submit" disabled={busy || !body.trim()}>Post reply</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
