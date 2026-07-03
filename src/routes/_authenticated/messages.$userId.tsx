import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { getConnectionBetween, uploadDmAttachment, signedDmAttachmentUrl } from "@/lib/social";
import { ArrowLeft, Paperclip, Send, X, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages/$userId")({
  head: () => ({ meta: [{ title: "Chat — food n bev" }] }),
  component: DMConversation,
});

type Dm = {
  id: string; sender_id: string; recipient_id: string;
  body: string | null; attachment_path: string | null; attachment_name: string | null; attachment_mime: string | null;
  created_at: string; read_at: string | null;
};

function DMConversation() {
  const { userId } = Route.useParams();
  const { user } = useAuth();
  const [otherAlias, setOtherAlias] = useState<string | null>(null);
  const [connectedOk, setConnectedOk] = useState<boolean | null>(null);
  const [msgs, setMsgs] = useState<Dm[]>([]);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`)
      .order("created_at");
    setMsgs((data as any) ?? []);
    // mark received as read
    await supabase.from("direct_messages").update({ read_at: new Date().toISOString() })
      .eq("recipient_id", user.id).eq("sender_id", userId).is("read_at", null);
  }

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, conn] = await Promise.all([
        supabase.from("profiles").select("alias").eq("id", userId).maybeSingle(),
        getConnectionBetween(user.id, userId),
      ]);
      setOtherAlias((p as any)?.alias ?? null);
      setConnectedOk(conn?.status === "accepted");
      if (conn?.status === "accepted") load();
    })();
  }, [user?.id, userId]);

  useEffect(() => {
    if (!user || !connectedOk) return;
    const ch = supabase.channel(`dm:${user.id}:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload) => {
        const r = payload.new as Dm;
        const involves = (r.sender_id === user.id && r.recipient_id === userId) || (r.sender_id === userId && r.recipient_id === user.id);
        if (involves) load();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, userId, connectedOk]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [msgs.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!body.trim() && !file) return;
    setBusy(true);
    try {
      let attachment_path: string | null = null;
      let attachment_name: string | null = null;
      let attachment_mime: string | null = null;
      let attachment_size: number | null = null;
      if (file) {
        if (file.size > 20 * 1024 * 1024) throw new Error("File too large (20MB max)");
        attachment_path = await uploadDmAttachment(user.id, file);
        attachment_name = file.name;
        attachment_mime = file.type || null;
        attachment_size = file.size;
      }
      const { error } = await supabase.from("direct_messages").insert({
        sender_id: user.id, recipient_id: userId,
        body: body.trim() || null,
        attachment_path, attachment_name, attachment_mime, attachment_size,
      });
      if (error) throw error;
      setBody(""); setFile(null);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  if (!user) return null;

  if (connectedOk === null) return <AppShell><div className="p-12 text-center text-muted-foreground">Loading…</div></AppShell>;

  if (!connectedOk) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-xl font-semibold">Not connected</h1>
          <p className="mt-2 text-sm text-muted-foreground">You can only message users after they've accepted your connection request.</p>
          <Button asChild className="mt-4" variant="outline"><Link to="/messages">Back to messages</Link></Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link to="/messages" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Messages
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Chat with {otherAlias ?? "user"}</h1>

        <div ref={scrollRef} className="mt-6 max-h-[60vh] space-y-2 overflow-y-auto rounded-xl border bg-card p-4">
          {msgs.length === 0 && <p className="text-sm text-muted-foreground">No messages yet. Say hi.</p>}
          {msgs.map((m) => (
            <Bubble key={m.id} m={m} mine={m.sender_id === user.id} />
          ))}
        </div>

        <form onSubmit={send} className="mt-4 space-y-2">
          <Textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message…" />
          <div className="flex items-center justify-between gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Paperclip className="size-4" />
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {file ? file.name : "Attach file"}
              {file && <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); }}><X className="size-3.5" /></button>}
            </label>
            <Button type="submit" disabled={busy || (!body.trim() && !file)}><Send className="size-4" /> Send</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Bubble({ m, mine }: { m: Dm; mine: boolean }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
        {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
        {m.attachment_path && <Attachment path={m.attachment_path} name={m.attachment_name ?? "file"} mine={mine} />}
        <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(m.created_at).toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

function Attachment({ path, name, mine }: { path: string; name: string; mine: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { signedDmAttachmentUrl(path).then(setUrl).catch(() => {}); }, [path]);
  if (!url) return <span className={mine ? "text-primary-foreground/70" : "text-muted-foreground"}>…</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className={`mt-1 flex items-center gap-1.5 text-xs underline ${mine ? "text-primary-foreground" : "text-foreground"}`}>
      <Download className="size-3.5" /> {name}
    </a>
  );
}
