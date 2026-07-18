import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { PARTY_CATEGORY_LABEL, type PartyCategory } from "@/lib/constants";
import { Clock, MessageSquare } from "lucide-react";
import { getConnectionBetween, sendConnectionRequest } from "@/lib/social";

export const Route = createFileRoute("/_authenticated/rfqs/$id")({
  head: () => ({ meta: [{ title: "RFQ — food n bev" }] }),
  component: RfqDetail,
});

type Rfq = {
  id: string; description: string; deadline: string | null;
  anonymous: boolean; categories: PartyCategory[];
  closed_at: string | null; created_at: string; created_by: string;
  companies: { id: string; name: string } | null;
  projects: { id: string; name: string } | null;
};

type Quote = {
  id: string; rfq_id: string; submitter_id: string; body: string;
  amount: number | null; anonymous: boolean; company_id: string | null;
  amend_count: number; created_at: string; updated_at: string;
};

type Question = {
  id: string; rfq_id: string; asker_id: string;
  question: string; answer: string | null; created_at: string; answered_at: string | null;
};

function isOpen(r: Rfq | null): boolean {
  if (!r) return false;
  if (r.closed_at) return false;
  if (Date.now() > new Date(r.created_at).getTime() + 1000 * 60 * 60 * 24 * 62) return false;
  if (r.deadline && new Date(r.deadline).getTime() < Date.now()) return false;
  return true;
}

function RfqDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [rfq, setRfq] = useState<Rfq | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: r } = await supabase
      .from("rfqs" as any)
      .select("id,description,deadline,anonymous,categories,closed_at,created_at,created_by,companies(id,name),projects(id,name)")
      .eq("id", id)
      .maybeSingle();
    setRfq(r as any);
    const [{ data: q }, { data: qs }, { data: cs }] = await Promise.all([
      supabase.from("rfq_quotes" as any).select("*").eq("rfq_id", id).order("created_at", { ascending: false }),
      supabase.from("rfq_questions" as any).select("*").eq("rfq_id", id).order("created_at"),
      supabase.from("companies").select("id,name"),
    ]);
    setQuotes((q as any) ?? []);
    setQuestions((qs as any) ?? []);
    setCompanies((cs as any) ?? []);
    const ids = new Set<string>();
    if (r) ids.add((r as any).created_by);
    ((q as any) ?? []).forEach((x: Quote) => ids.add(x.submitter_id));
    ((qs as any) ?? []).forEach((x: Question) => ids.add(x.asker_id));
    if (ids.size) {
      const { data: profs } = await supabase.from("profiles").select("id,alias").in("id", Array.from(ids));
      setAliases(Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.alias])));
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <AppShell><div className="mx-auto max-w-4xl px-4 py-10">Loading…</div></AppShell>;
  if (!rfq) return <AppShell><div className="mx-auto max-w-4xl px-4 py-10">Not found</div></AppShell>;

  const open = isOpen(rfq);
  const iAmOwner = user?.id === rfq.created_by;
  const myQuote = quotes.find((q) => q.submitter_id === user?.id);
  const myQuestion = questions.find((q) => q.asker_id === user?.id);
  const posterLabel = rfq.anonymous ? "Anonymous" : (rfq.companies?.name || aliases[rfq.created_by] || "Member");
  const companyName = (id?: string | null) => (id ? companies.find((c) => c.id === id)?.name : undefined);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-3 flex items-center gap-2">
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${open ? "bg-[#abdbe3] text-black" : "bg-black text-white"}`}>
            {open ? "Open" : "Closed"}
          </span>
          <span className="text-sm text-muted-foreground">Posted by {posterLabel} · {new Date(rfq.created_at).toLocaleDateString()}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Request for quotation</h1>
        <p className="mt-3 whitespace-pre-wrap rounded-lg border bg-card p-4 text-sm">{rfq.description}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {rfq.categories?.map((c) => (
            <span key={c} className="rounded-full bg-[#eab676]/25 px-2 py-0.5">{PARTY_CATEGORY_LABEL[c]}</span>
          ))}
          {rfq.projects && <span>· project: <Link className="underline" to="/projects/$id" params={{ id: rfq.projects.id }}>{rfq.projects.name}</Link></span>}
          {rfq.deadline && <span className="inline-flex items-center gap-1"><Clock className="size-3" /> deadline {new Date(rfq.deadline).toLocaleString()}</span>}
        </div>

        {iAmOwner && open && (
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={async () => {
              await supabase.from("rfqs" as any).update({ closed_at: new Date().toISOString() }).eq("id", rfq.id);
              load();
            }}>Close RFQ</Button>
          </div>
        )}

        {/* Questions */}
        <section className="mt-8">
          <h2 className="mb-2 text-lg font-semibold">Questions</h2>
          <p className="mb-3 text-xs text-muted-foreground">Each member can ask one question about this RFQ.</p>
          {questions.length === 0 && <p className="text-sm text-muted-foreground">No questions yet.</p>}
          <ul className="space-y-3">
            {questions.map((q) => (
              <li key={q.id} className="rounded-lg border bg-card p-3">
                <div className="text-xs text-muted-foreground">{aliases[q.asker_id] ?? "Member"} · {new Date(q.created_at).toLocaleString()}</div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{q.question}</p>
                {q.answer ? (
                  <div className="mt-2 rounded bg-[#abdbe3]/25 p-2 text-sm">
                    <div className="mb-1 text-xs font-medium">Answer from poster</div>
                    <p className="whitespace-pre-wrap">{q.answer}</p>
                  </div>
                ) : iAmOwner ? (
                  <AnswerForm questionId={q.id} onDone={load} />
                ) : (
                  <div className="mt-2 text-xs text-muted-foreground">Awaiting answer…</div>
                )}
              </li>
            ))}
          </ul>
          {!iAmOwner && open && !myQuestion && <AskForm rfqId={rfq.id} onDone={load} />}
          {!iAmOwner && myQuestion && (
            <p className="mt-3 text-xs text-muted-foreground">You've already asked your question. Only one question per RFQ is allowed.</p>
          )}
        </section>

        {/* Quotes */}
        <section className="mt-10">
          <h2 className="mb-2 text-lg font-semibold">Quotes</h2>
          {iAmOwner ? (
            <>
              {quotes.length === 0 && <p className="text-sm text-muted-foreground">No quotes yet.</p>}
              <ul className="space-y-3">
                {quotes.map((q) => (
                  <QuoteCardOwner
                    key={q.id}
                    q={q}
                    posterLabel={q.anonymous ? "Anonymous quoter" : (companyName(q.company_id) || aliases[q.submitter_id] || "Member")}
                    meId={user?.id}
                  />
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="mb-3 text-xs text-muted-foreground">
                You can submit <strong>one quote</strong> and amend it <strong>once</strong>. Only the RFQ poster will see it.
              </p>
              {open ? (
                myQuote ? <QuoteEditor existing={myQuote} companies={companies} onDone={load} />
                        : <QuoteEditor rfqId={rfq.id} companies={companies} onDone={load} />
              ) : <p className="text-sm text-muted-foreground">This RFQ is closed. No new quotes accepted.</p>}
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function AskForm({ rfqId, onDone }: { rfqId: string; onDone: () => void }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <form className="mt-4 space-y-2" onSubmit={async (e) => {
      e.preventDefault();
      if (!user || !text.trim()) return;
      setSaving(true);
      const { error } = await supabase.from("rfq_questions" as any).insert({ rfq_id: rfqId, asker_id: user.id, question: text.trim() });
      setSaving(false);
      if (error) return toast.error(error.message);
      setText("");
      toast.success("Question submitted");
      onDone();
    }}>
      <Label className="text-xs">Ask your one question</Label>
      <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} required />
      <Button type="submit" size="sm" disabled={saving}>Submit question</Button>
    </form>
  );
}

function AnswerForm({ questionId, onDone }: { questionId: string; onDone: () => void }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <form className="mt-2 space-y-2" onSubmit={async (e) => {
      e.preventDefault();
      if (!text.trim()) return;
      setSaving(true);
      const { error } = await supabase.from("rfq_questions" as any)
        .update({ answer: text.trim(), answered_at: new Date().toISOString() })
        .eq("id", questionId);
      setSaving(false);
      if (error) return toast.error(error.message);
      onDone();
    }}>
      <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your answer…" required />
      <Button type="submit" size="sm" disabled={saving}>Post answer</Button>
    </form>
  );
}

function QuoteEditor({ rfqId, existing, companies, onDone }: {
  rfqId?: string;
  existing?: Quote;
  companies: { id: string; name: string }[];
  onDone: () => void;
}) {
  const { user } = useAuth();
  const [body, setBody] = useState(existing?.body ?? "");
  const [amount, setAmount] = useState<string>(existing?.amount != null ? String(existing.amount) : "");
  const [anonymous, setAnonymous] = useState(existing?.anonymous ?? false);
  const [companyId, setCompanyId] = useState<string>(existing?.company_id ?? "");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [saving, setSaving] = useState(false);
  const alreadyAmended = (existing?.amend_count ?? 0) >= 1;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !body.trim()) return;
    setSaving(true);
    try {
      let finalCompanyId: string | null = anonymous ? null : (companyId || null);
      if (!anonymous && !companyId && newCompanyName.trim()) {
        const { data, error } = await supabase.from("companies").insert({ name: newCompanyName.trim(), category: "other" }).select("id").single();
        if (error) throw error;
        finalCompanyId = data.id;
      }
      const payload: any = {
        body: body.trim(),
        amount: amount ? Number(amount) : null,
        anonymous,
        company_id: finalCompanyId,
      };
      if (existing) {
        const { error } = await supabase.from("rfq_quotes" as any).update(payload).eq("id", existing.id);
        if (error) throw error;
        toast.success("Quote amended");
      } else {
        const { error } = await supabase.from("rfq_quotes" as any).insert({ rfq_id: rfqId, submitter_id: user.id, ...payload });
        if (error) throw error;
        toast.success("Quote submitted");
      }
      onDone();
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  if (existing && alreadyAmended) {
    return (
      <div className="rounded-lg border bg-card p-4 text-sm">
        <div className="mb-1 font-medium">Your quote</div>
        <p className="whitespace-pre-wrap">{existing.body}</p>
        {existing.amount != null && <div className="mt-1 text-xs">Amount: {existing.amount}</div>}
        <p className="mt-3 text-xs text-muted-foreground">You've already amended this quote once. No further changes allowed.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border bg-card p-4">
      <div className="text-sm font-medium">{existing ? (alreadyAmended ? "Your quote" : "Amend your quote (one-time only)") : "Submit your quote"}</div>
      <div className="space-y-1">
        <Label className="text-xs">Details</Label>
        <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} required maxLength={4000} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Amount (optional)</Label>
        <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="rounded border p-3">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={anonymous} onCheckedChange={(v) => setAnonymous(Boolean(v))} />
          Submit anonymously
        </label>
        {!anonymous && (
          <div className="mt-2 grid gap-2">
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <option value="">— quote as yourself —</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {!companyId && <Input value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} placeholder="…or add a new company" />}
          </div>
        )}
      </div>
      <Button type="submit" size="sm" disabled={saving}>{existing ? "Save amendment" : "Submit quote"}</Button>
    </form>
  );
}

function QuoteCardOwner({ q, posterLabel, meId }: { q: Quote; posterLabel: string; meId?: string }) {
  const [connState, setConnState] = useState<"idle" | "loading" | "requested" | "connected">("loading");
  useEffect(() => {
    if (!meId || q.anonymous) { setConnState("idle"); return; }
    (async () => {
      const c = await getConnectionBetween(meId, q.submitter_id);
      if (!c) setConnState("idle");
      else if (c.status === "accepted") setConnState("connected");
      else setConnState("requested");
    })();
  }, [meId, q.submitter_id, q.anonymous]);

  return (
    <li className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm font-medium">{posterLabel}</div>
        <div className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleString()} {q.amend_count > 0 && "· amended"}</div>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm">{q.body}</p>
      {q.amount != null && <div className="mt-1 text-sm">Amount: <strong>{q.amount}</strong></div>}
      {!q.anonymous && meId && meId !== q.submitter_id && (
        <div className="mt-3">
          {connState === "connected" ? (
            <Button asChild size="sm" variant="outline"><Link to="/messages/$userId" params={{ userId: q.submitter_id }}><MessageSquare className="size-4" /> Message</Link></Button>
          ) : connState === "requested" ? (
            <Button size="sm" variant="outline" disabled>Connection pending</Button>
          ) : (
            <Button size="sm" onClick={async () => {
              setConnState("loading");
              try { await sendConnectionRequest(meId, q.submitter_id); setConnState("requested"); toast.success("Connection request sent"); }
              catch (e: any) { toast.error(e.message); setConnState("idle"); }
            }}>Connect to discuss</Button>
          )}
        </div>
      )}
      {q.anonymous && <p className="mt-2 text-xs text-muted-foreground">Quoter chose to remain anonymous — they must reveal themselves before you can message them.</p>}
    </li>
  );
}
