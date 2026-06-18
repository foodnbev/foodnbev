import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { FacilityVisual } from "@/components/projects/FacilityVisual";
import { ScoreBar } from "@/components/projects/ScoreBar";
import { PartyCard, type PartyRow } from "@/components/projects/PartyCard";
import { PartyForm } from "@/components/projects/PartyForm";
import { RatingPicker } from "@/components/projects/RatingPicker";
import { Button } from "@/components/ui/button";
import { getProjectPublic } from "@/lib/projects.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  FACILITY_LABEL, FOOD_SUBTYPE_LABEL, PARTY_CATEGORY_LABEL, PARTY_CATEGORY_ORDER,
  STATUS_LABEL, STATUS_TONE, WORK_TYPE_LABEL, type PartyCategory,
} from "@/lib/constants";
import { CheckCircle2, Circle, Lock, MapPin, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/projects/$id")({
  loader: async ({ params, context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["project", params.id, "public"],
      queryFn: () => getProjectPublic({ data: { id: params.id } }),
    }),
  head: ({ loaderData }) => {
    const p = (loaderData as any)?.project;
    const title = p ? `${p.name} — food n bev` : "Project — food n bev";
    const desc = p ? `${FACILITY_LABEL[p.facility_type as keyof typeof FACILITY_LABEL]} · ${p.address}` : "F&B construction project";
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        ...(p?.cover_image_url ? [{ property: "og:image", content: p.cover_image_url } as const] : []),
      ],
    };
  },
  component: ProjectDetail,
  notFoundComponent: () => <AppShell><div className="p-12 text-center">Project not found.</div></AppShell>,
});

function ProjectDetail() {
  const params = Route.useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { user, loading: authLoading } = useAuth();

  const publicQ = useQuery({
    queryKey: ["project", params.id, "public"],
    queryFn: () => getProjectPublic({ data: { id: params.id } }),
  });

  const detailQ = useQuery({
    enabled: !!user,
    queryKey: ["project", params.id, "full"],
    queryFn: async () => {
      const [{ data: parties, error: pErr }, { data: ownerProfile }, { data: myRating }] = await Promise.all([
        supabase.from("project_parties").select("*").eq("project_id", params.id),
        publicQ.data?.project?.created_by
          ? supabase.from("profiles").select("alias").eq("id", publicQ.data.project.created_by).maybeSingle()
          : Promise.resolve({ data: null } as any),
        supabase.from("project_ratings").select("hotness,accuracy").eq("project_id", params.id).eq("user_id", user!.id).maybeSingle(),
      ]);
      if (pErr) throw pErr;
      return { parties: (parties ?? []) as PartyRow[], ownerAlias: (ownerProfile as any)?.alias ?? null, myRating };
    },
  });

  const project = publicQ.data?.project;
  const categories_present = (publicQ.data as any)?.categories_present ?? [];

  const [adding, setAdding] = useState(false);

  if (publicQ.isLoading) return <AppShell><div className="p-12 text-center text-muted-foreground">Loading…</div></AppShell>;
  if (!project) return <AppShell><div className="p-12 text-center">Project not found.</div></AppShell>;

  const isOwner = user?.id === project.created_by;
  const takenCategories: PartyCategory[] =
    (detailQ.data?.parties ?? []).map((r) => r.category);

  async function refresh() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["project", params.id, "public"] }),
      qc.invalidateQueries({ queryKey: ["project", params.id, "full"] }),
      qc.invalidateQueries({ queryKey: ["projects"] }),
    ]);
  }

  async function deleteProject() {
    if (!confirm("Delete this project?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    router.navigate({ to: "/projects" });
  }

  async function deleteParty(id: string) {
    const { error } = await supabase.from("project_parties").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    refresh();
  }

  return (
    <AppShell>
      <article className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <header className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`fnb-chip ${STATUS_TONE[project.status as keyof typeof STATUS_TONE]}`}>{STATUS_LABEL[project.status as keyof typeof STATUS_LABEL]}</span>
              <span className="fnb-chip">{FACILITY_LABEL[project.facility_type as keyof typeof FACILITY_LABEL]}</span>
              {project.food_subtype && <span className="fnb-chip">{FOOD_SUBTYPE_LABEL[project.food_subtype as keyof typeof FOOD_SUBTYPE_LABEL]}</span>}
              {project.work_type && <span className="fnb-chip">{WORK_TYPE_LABEL[project.work_type as keyof typeof WORK_TYPE_LABEL]}</span>}
            </div>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight md:text-5xl">{project.name}</h1>
            <p className="mt-3 flex items-start gap-2 text-foreground/75">
              <MapPin className="mt-1 size-4 shrink-0" /> {project.address}
            </p>
            <p className="mt-5 max-w-2xl text-pretty text-foreground/85">{project.description}</p>
            {detailQ.data?.ownerAlias && (
              <p className="mt-4 text-xs text-muted-foreground">Added by <span className="font-medium text-foreground">{detailQ.data.ownerAlias}</span></p>
            )}
            {isOwner && (
              <div className="mt-5">
                <Button variant="outline" size="sm" onClick={deleteProject}><Trash2 className="size-4" /> Delete project</Button>
              </div>
            )}
          </div>
          <div className="overflow-hidden rounded-2xl border">
            <div className="aspect-[16/10]">
              <FacilityVisual type={project.facility_type as any} subtype={project.food_subtype as any} src={project.cover_image_url} alt={project.name} />
            </div>
            <div className="grid grid-cols-3 gap-4 border-t p-4">
              <ScoreBar value={(publicQ.data as any)?.hotness ?? 0} label="Hot" tone="sand" />
              <ScoreBar value={(publicQ.data as any)?.accuracy ?? 0} label="Accuracy" tone="teal" />
              <ScoreBar value={(publicQ.data as any)?.completeness ?? 0} label="Complete" tone="ink" />
            </div>
          </div>
        </header>

        <hr className="my-10" />

        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Project parties</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {user ? "Sign in lets you see and add contractor details." : "Sign in to view contact details and contribute."}
                </p>
              </div>
              {user && (
                <Button onClick={() => setAdding(true)} disabled={adding}>
                  <Plus className="size-4" /> Add entry
                </Button>
              )}
            </div>

            {adding && user && (
              <div className="mt-5">
                <PartyForm
                  projectId={project.id}
                  takenCategories={takenCategories}
                  onAdded={() => { setAdding(false); refresh(); }}
                  onCancel={() => setAdding(false)}
                />
              </div>
            )}

            {!user ? (
              <GatedPartyList present={categories_present} />
            ) : authLoading || detailQ.isLoading ? (
              <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
            ) : (
              <FullPartyList parties={detailQ.data!.parties} currentUserId={user.id} onDelete={deleteParty} />
            )}
          </section>

          <aside className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your rating</h3>
              <div className="mt-2">
                {user ? (
                  <RatingPicker projectId={project.id} onSaved={refresh} />
                ) : (
                  <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                    <Lock className="mb-2 size-4" />
                    <Link to="/auth" className="font-medium text-foreground underline">Sign in</Link> to rate this project.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </article>
    </AppShell>
  );
}

function GatedPartyList({ present }: { present: string[] }) {
  return (
    <div className="mt-6 space-y-2">
      <p className="rounded-md border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
        <Lock className="mr-1 inline size-3" /> Showing only which categories have contributions. <Link to="/auth" className="font-medium text-foreground underline">Sign in</Link> for full details.
      </p>
      <ul className="divide-y rounded-xl border bg-card">
        {PARTY_CATEGORY_ORDER.map((c) => {
          const has = present.includes(c);
          return (
            <li key={c} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{PARTY_CATEGORY_LABEL[c]}</span>
              <span className={has ? "flex items-center gap-1 text-foreground" : "flex items-center gap-1 text-muted-foreground"}>
                {has ? <CheckCircle2 className="size-4" style={{ color: "var(--sand)" }} /> : <Circle className="size-4" />}
                {has ? "Yes" : "No"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FullPartyList({ parties, currentUserId, onDelete }: { parties: PartyRow[]; currentUserId: string; onDelete: (id: string) => void }) {
  const byCategory = useMemo(() => {
    const m: Record<string, PartyRow[]> = {};
    for (const r of parties) (m[r.category] ??= []).push(r);
    return m;
  }, [parties]);

  return (
    <div className="mt-6 space-y-3">
      {PARTY_CATEGORY_ORDER.flatMap((c) => {
        const rows = byCategory[c] ?? [];
        if (rows.length === 0) {
          return [
            <div key={c} className="flex items-center justify-between rounded-lg border border-dashed bg-card/60 px-4 py-3 text-sm">
              <span className="text-muted-foreground">{PARTY_CATEGORY_LABEL[c]}</span>
              <span className="text-xs text-muted-foreground">Not added yet</span>
            </div>,
          ];
        }
        return rows.map((row) => (
          <PartyCard
            key={row.id}
            row={row}
            canDelete={row.created_by === currentUserId}
            onDelete={() => onDelete(row.id)}
          />
        ));
      })}
    </div>
  );
}
