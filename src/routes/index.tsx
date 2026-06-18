import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { searchProjects } from "@/lib/projects.functions";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import logoAsset from "@/assets/foodnbev-logo.png.asset.json";

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
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 10% 0%, color-mix(in oklch, var(--sand) 35%, white) 0%, transparent 60%), radial-gradient(50% 50% at 100% 100%, color-mix(in oklch, var(--teal) 40%, white) 0%, transparent 60%)",
        }}
      />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1.2fr_1fr] md:py-28">
        <div className="space-y-6">
          <span className="fnb-chip fnb-chip-teal"><Sparkles className="size-3" /> Community-built register</span>
          <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Every F&amp;B construction project, <span style={{ color: "var(--sand)" }}>in one place</span>.
          </h1>
          <p className="max-w-xl text-pretty text-lg text-foreground/70">
            Newbuilds, extensions and refurbishments across breweries, distilleries and food processing facilities — contributed, scored and kept up to date by the people who actually work on them.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/projects"><Search className="size-4" /> Browse projects</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Join the register <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </div>
        <div className="relative hidden items-center justify-center md:flex">
          <div className="rounded-3xl border bg-card/80 p-10 shadow-sm backdrop-blur">
            <img src={logoAsset.url} alt="food n bev logo" className="h-20 w-auto" />
            <div className="mt-6 grid grid-cols-3 gap-3">
              {["Brewery", "Distillery", "Processing"].map((t) => (
                <span key={t} className="fnb-chip justify-center">{t}</span>
              ))}
            </div>
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
    { t: "Track who's building what", d: "From planning to commissioning — see status, location and a project brief at a glance." },
    { t: "Find the right partners", d: "Architects, M&E, GCs, flooring, drainage — by company, area or specialism." },
    { t: "Scored by the community", d: "How hot it is, how accurate it is, plus an automatic completeness score." },
  ];
  return (
    <section className="border-t bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-3">
        {items.map((i) => (
          <div key={i.t} className="rounded-2xl border bg-card p-6">
            <h3 className="text-base font-semibold">{i.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{i.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
