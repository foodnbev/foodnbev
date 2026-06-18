import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FACILITY_LABEL, FOOD_SUBTYPE_LABEL, STATUS_LABEL, WORK_TYPE_LABEL } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/projects/new")({
  head: () => ({ meta: [{ title: "Add a project — food n bev" }] }),
  component: NewProject,
});

const Schema = z.object({
  name: z.string().trim().min(2).max(160),
  address: z.string().trim().min(4).max(400),
  description: z.string().trim().min(4).max(2000),
  status: z.enum(["planning","underway","completed","unknown"]),
  facility_type: z.enum(["brewery","distillery","food_processing"]),
  food_subtype: z.enum(["meat","fish","snacks","coldroom","other"]).optional(),
  work_type: z.enum(["newbuild","extension","refurbishment","modification"]).optional(),
  cover_image_url: z.string().url().optional().or(z.literal("")),
});

function NewProject() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "", address: "", description: "",
    status: "planning" as const,
    facility_type: "food_processing" as const,
    food_subtype: undefined as any,
    work_type: undefined as any,
    cover_image_url: "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setBusy(false); return toast.error("Not signed in"); }
    const { data, error } = await supabase.from("projects").insert({
      ...parsed.data,
      cover_image_url: parsed.data.cover_image_url || null,
      food_subtype: form.facility_type === "food_processing" ? parsed.data.food_subtype ?? null : null,
      created_by: u.user.id,
    }).select("id").single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Project added");
    nav({ to: "/projects/$id", params: { id: data!.id } });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Add a project</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Required: name, location, brief description, status and facility type. Add contractor details later from the project page.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-6">
          <Field label="Facility name *" id="n">
            <Input id="n" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Brewdog Brewery" required />
          </Field>
          <Field label="Full address *" id="a">
            <Input id="a" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, city, postcode, country" required />
          </Field>
          <Field label="Brief description *" id="d">
            <Textarea id="d" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Production line expansion adding new bottling hall" required />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Status *" value={form.status} options={STATUS_LABEL} onChange={(v) => setForm({ ...form, status: v as any })} />
            <SelectField label="Facility type *" value={form.facility_type} options={FACILITY_LABEL} onChange={(v) => setForm({ ...form, facility_type: v as any, food_subtype: undefined })} />
            {form.facility_type === "food_processing" && (
              <SelectField label="Food subtype" value={form.food_subtype} options={FOOD_SUBTYPE_LABEL} onChange={(v) => setForm({ ...form, food_subtype: v })} allowClear />
            )}
            <SelectField label="Work type" value={form.work_type} options={WORK_TYPE_LABEL} onChange={(v) => setForm({ ...form, work_type: v })} allowClear />
          </div>

          <Field label="Cover image URL (optional)" id="ci">
            <Input id="ci" value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="https://…" />
          </Field>

          <Button type="submit" disabled={busy} className="w-full">{busy ? "Creating…" : "Create project"}</Button>
        </form>
      </div>
    </AppShell>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}</div>;
}

function SelectField({ label, value, options, onChange, allowClear }: {
  label: string; value: string | undefined; options: Record<string, string>; onChange: (v: any) => void; allowClear?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value ?? (allowClear ? "__none" : undefined)} onValueChange={(v) => onChange(v === "__none" ? undefined : v)}>
        <SelectTrigger><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>
          {allowClear && <SelectItem value="__none">— None —</SelectItem>}
          {Object.entries(options).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
