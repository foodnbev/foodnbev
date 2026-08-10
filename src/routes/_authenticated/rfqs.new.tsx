import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PARTY_CATEGORY_LABEL, PARTY_CATEGORY_ORDER, type PartyCategory } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/rfqs/new")({
  head: () => ({ meta: [{ title: "New anonymous quote request — food n bev" }] }),
  component: NewRfq,
});

function NewRfq() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [companyId, setCompanyId] = useState<string>("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [deadline, setDeadline] = useState("");
  const [cats, setCats] = useState<PartyCategory[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from("companies").select("id,name").order("name"),
        supabase.from("projects").select("id,name").order("name"),
      ]);
      setCompanies((c as any) ?? []);
      setProjects((p as any) ?? []);
    })();
  }, []);

  function toggleCat(c: PartyCategory) {
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!description.trim()) return toast.error("Please describe what you need");
    setSaving(true);
    try {
      let finalCompanyId: string | null = anonymous ? null : (companyId || null);
      if (!anonymous && !companyId && newCompanyName.trim()) {
        const { data, error } = await supabase
          .from("companies")
          .insert({ name: newCompanyName.trim(), category: "other" })
          .select("id")
          .single();
        if (error) throw error;
        finalCompanyId = data.id;
      }
      const { data, error } = await supabase
        .from("rfqs" as any)
        .insert({
          created_by: user.id,
          description: description.trim(),
          anonymous,
          company_id: finalCompanyId,
          project_id: projectId || null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          categories: cats,
        } as any)
        .select("id")
        .single();
      if (error) throw error;
      toast.success("RFQ posted");
      nav({ to: "/rfqs/$id", params: { id: (data as any).id } });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to post RFQ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Post a quote request</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Only signed-in members can see and respond. Each responder may ask <strong>one question</strong>, submit <strong>one quote</strong>, and amend it <strong>once</strong>. Requests close automatically after 2 months.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label>Describe the product or service you need</Label>
            <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={4000} />
          </div>

          <div className="rounded-lg border p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox checked={anonymous} onCheckedChange={(v) => setAnonymous(Boolean(v))} />
              Post anonymously
            </label>
            {!anonymous && (
              <div className="mt-3 grid gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Post as an existing company</Label>
                  <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                    <option value="">— none —</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                {!companyId && (
                  <div className="space-y-1">
                    <Label className="text-xs">…or add a new company</Label>
                    <Input value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} placeholder="Company name" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Who are you looking for? <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <div className="flex flex-wrap gap-2">
              {PARTY_CATEGORY_ORDER.map((c) => (
                <button key={c} type="button" onClick={() => toggleCat(c)}
                  className={`rounded-full border px-3 py-1 text-xs ${cats.includes(c) ? "border-black bg-black text-white" : "border-border bg-background"}`}>
                  {PARTY_CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Deadline <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Link to project <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">— none —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={saving}>{saving ? "Posting…" : "Post RFQ"}</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
