import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/threads/new")({
  validateSearch: (s: Record<string, unknown>) => ({ projectId: typeof s.projectId === "string" ? s.projectId : undefined }),
  head: () => ({ meta: [{ title: "New discussion — food n bev" }] }),
  component: NewThread,
});

const Schema = z.object({
  title: z.string().trim().min(3).max(200),
  first_message: z.string().trim().min(1).max(5000),
  project_id: z.string().uuid().nullable(),
});

function NewThread() {
  const nav = useNavigate();
  const { projectId } = Route.useSearch();
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ title: "", first_message: "", project_id: projectId ?? "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("projects").select("id,name").order("name").then(({ data }) => setProjects((data as any) ?? []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Schema.safeParse({
      title: form.title,
      first_message: form.first_message,
      project_id: form.project_id ? form.project_id : null,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setBusy(false); return toast.error("Not signed in"); }
    const { data: t, error } = await supabase.from("threads").insert({
      title: parsed.data.title, project_id: parsed.data.project_id, created_by: u.user.id,
    }).select("id").single();
    if (error || !t) { setBusy(false); return toast.error(error?.message ?? "Failed"); }
    const { error: mErr } = await supabase.from("thread_messages").insert({
      thread_id: t.id, user_id: u.user.id, body: parsed.data.first_message,
    });
    if (mErr) { setBusy(false); return toast.error(mErr.message); }
    toast.success("Discussion started");
    nav({ to: "/threads/$id", params: { id: t.id } });
  }

  return (
    <AppShell>
      <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Start a discussion</h1>
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What's this about?" />
        </div>
        <div className="space-y-1.5">
          <Label>Attach to project (optional)</Label>
          <Select value={form.project_id || "none"} onValueChange={(v) => setForm({ ...form, project_id: v === "none" ? "" : v })}>
            <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No project</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="msg">First message</Label>
          <Textarea id="msg" rows={5} value={form.first_message} onChange={(e) => setForm({ ...form, first_message: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create discussion"}</Button>
          <Button type="button" variant="ghost" onClick={() => history.back()}>Cancel</Button>
        </div>
      </form>
    </AppShell>
  );
}
