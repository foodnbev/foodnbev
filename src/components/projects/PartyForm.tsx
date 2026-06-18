import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { PARTY_CATEGORY_LABEL, PARTY_CATEGORY_ORDER, type PartyCategory } from "@/lib/constants";

const Schema = z.object({
  category: z.enum([
    "end_user","architect","general_contractor","me","real_estate_planner",
    "consultant","flooring","groundworks","drainage","other",
  ]),
  other_label: z.string().trim().max(80).optional(),
  company: z.string().trim().max(160).optional(),
  contact_name: z.string().trim().max(120).optional(),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  spec_description: z.string().trim().max(1000).optional(),
});

export function PartyForm({
  projectId,
  takenCategories,
  onAdded,
  onCancel,
}: {
  projectId: string;
  takenCategories: PartyCategory[];
  onAdded: () => void;
  onCancel?: () => void;
}) {
  const available = PARTY_CATEGORY_ORDER.filter(
    (c) => c === "other" || !takenCategories.includes(c),
  );
  const [form, setForm] = useState({
    category: (available[0] ?? "other") as PartyCategory,
    other_label: "",
    company: "",
    contact_name: "",
    email: "",
    phone: "",
    spec_description: "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (parsed.data.category === "other" && !parsed.data.other_label) {
      return toast.error("Please describe the 'Other' category");
    }
    if (!form.company && !form.contact_name && !form.email && !form.phone && !form.spec_description) {
      return toast.error("Add at least one detail");
    }

    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setBusy(false); return toast.error("Not signed in"); }
    const { error } = await supabase.from("project_parties").insert({
      project_id: projectId,
      created_by: u.user.id,
      category: parsed.data.category,
      other_label: parsed.data.category === "other" ? parsed.data.other_label || null : null,
      company: form.company || null,
      contact_name: form.contact_name || null,
      email: form.email || null,
      phone: form.phone || null,
      spec_description: form.spec_description || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Added");
    onAdded();
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as PartyCategory })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {available.map((c) => (
                <SelectItem key={c} value={c}>{PARTY_CATEGORY_LABEL[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {form.category === "other" && (
          <div className="space-y-1.5">
            <Label>Describe (e.g. Cladding)</Label>
            <Input value={form.other_label} onChange={(e) => setForm({ ...form, other_label: e.target.value })} maxLength={80} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Company</Label>
          <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Contact person</Label>
          <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Product / service specification (optional)</Label>
        <Textarea rows={2} value={form.spec_description} onChange={(e) => setForm({ ...form, spec_description: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={busy}>{busy ? "Adding…" : "Add entry"}</Button>
      </div>
    </form>
  );
}
