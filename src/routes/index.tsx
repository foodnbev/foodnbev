import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { searchProjects } from "@/lib/projects.functions";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import logoAsset from "@/assets/foodnbev-logo.png";

const latestProjects = queryOptions({
  queryKey: ["projects", "latest"],
  queryFn: () => searchProjects({ data: { limit: 6 } }),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "food n bev — F&B construction projects register" },
      { name: "description", content: "Track breweries, distilleries and food processing builds — community-sourced contractor info, status and ratings." },
      { property: "og:title", content: "food n bev — F&B construction register" },
      { property: "og:description", content: "Community register of food & beverage construction projects." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(latestProjects),
  component: Home,
});

function Home() {
  return (
    <AppShell>
      <Hero />
      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 text-muted-foreground sm:px-6">Loading projects…</div>}>
        <Latest />
      </Suspense>
      <ValueProps />
    </AppShell>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(70% 60% at 5% 10%, color-mix(in oklch, var(--sand) 55%, white) 0%, transparent 55%), radial-gradient(60% 60% at 95% 90%, color-mix(in oklch, var(--teal) 60%, white) 0%, transparent 55%)",
        }}
      />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1.2fr_1fr] md:py-28">
        <div className="space-y-6">
          <span className="fnb-chip fnb-chip-sand"><Sparkles className="size-3" /> Community-built register</span>
          <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Every F&amp;B construction project, <span className="text-[var(--sand)]">in one place</span>.
          </h1>
          <p className="max-w-xl text-pretty text-lg text-foreground/70">
            Newbuilds, extensions and refurbishments across breweries, distilleries and food processing facilities — contributed, scored and kept up to date by the people who actually work on them.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-[var(--teal)] text-[var(--teal-foreground)] hover:bg-[color-mix(in_oklch,var(--teal)_85%,black)] border-[var(--teal)]">
              <Link to="/projects"><Search className="size-4" /> Browse projects</Link>
            </Button>
            <Button asChild size="lg" className="bg-[var(--ink)] text-white hover:bg-[oklch(0.25_0_0)]">
              <Link to="/auth">Register <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </div>
        <div className="relative hidden items-center justify-center md:flex">
          <div className="rounded-3xl border-2 border-[var(--sand)] bg-white/90 p-12 shadow-lg shadow-black/5 backdrop-blur">
            <img src={logoAsset} alt="food n bev logo" className="h-32 w-auto" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Latest() {
  const { data } = useSuspenseQuery(latestProjects);
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Latest projects</h2>
          <p className="mt-1 text-sm text-muted-foreground">Freshest entries from the community.</p>
        </div>
        <Button asChild variant="ghost"><Link to="/projects">All projects <ArrowRight className="size-4" /></Link></Button>
      </div>
      {data.projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.projects.map((p) => <ProjectCard key={p.id} p={p as any} />)}
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed p-12 text-center">
      <p className="text-base font-medium">No projects yet.</p>
      <p className="mt-1 text-sm text-muted-foreground">Be the first to add one.</p>
      <Button asChild className="mt-5"><Link to="/auth">Sign in to add a project</Link></Button>
    </div>
  );
}

function ValueProps() {
  const items = [
    { t: "Track who's building what", d: "From planning to commissioning — see status, location and a project brief at a glance.", accent: "var(--sand)" as const },
    { t: "Find the right partners", d: "Architects, M&E, GCs, flooring, drainage — by company, area or specialism.", accent: "var(--teal)" as const },
    { t: "Scored by the community", d: "How hot it is, how accurate it is, plus an automatic completeness score.", accent: "var(--ink)" as const },
  ];
  return (
    <section className="border-t border-b bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-3">
        {items.map((i) => (
          <div key={i.t} className="rounded-2xl border bg-card p-6" style={{ borderTopWidth: 4, borderTopColor: i.accent }}>
            <h3 className="text-base font-semibold">{i.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{i.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

