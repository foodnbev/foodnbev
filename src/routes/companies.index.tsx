import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY_CATEGORY_LABEL, COMPANY_CATEGORY_ORDER, type CompanyCategory } from "@/lib/constants";
import { Building2, ExternalLink, Search } from "lucide-react";

type Company = {
  id: string;
  name: string;
  category: CompanyCategory;
  website: string | null;
  logo_url: string | null;
  description: string | null;
};

export const Route = createFileRoute("/companies/")({
  head: () => ({
    meta: [
      { title: "Company directory — food n bev" },
      { name: "description", content: "Directory of architects, general contractors, flooring, groundworks and other suppliers active in UK & Ireland food and beverage construction." },
      { property: "og:title", content: "Company directory — food n bev" },
      { property: "og:description", content: "Architects, contractors, flooring and groundworks companies for UK & Ireland F&B projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompaniesIndex,
});

function CompaniesIndex() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CompanyCategory | "all">("all");

  const query = useQuery({
    queryKey: ["companies", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id,name,category,website,logo_url,description")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Company[];
    },
  });

  const filtered = useMemo(() => {
    const rows = query.data ?? [];
    const term = q.trim().toLowerCase();
    return rows.filter((r) =>
      (cat === "all" || r.category === cat) &&
      (!term || r.name.toLowerCase().includes(term) || (r.website ?? "").toLowerCase().includes(term))
    );
  }, [query.data, q, cat]);

  const counts = useMemo(() => {
    const rows = query.data ?? [];
    const m: Record<string, number> = { all: rows.length };
    for (const r of rows) m[r.category] = (m[r.category] ?? 0) + 1;
    return m;
  }, [query.data]);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Directory</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Companies working on F&B projects</h1>
          <p className="mt-2 max-w-2xl text-foreground/75">
            Architects, general contractors, flooring specialists, groundworkers and other suppliers active in UK & Ireland food & beverage construction. Link any of these to a project from its page.
          </p>
        </header>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <FilterChip active={cat === "all"} onClick={() => setCat("all")} label={`All (${counts.all ?? 0})`} />
          {COMPANY_CATEGORY_ORDER.map((c) => (
            <FilterChip key={c} active={cat === c} onClick={() => setCat(c)} label={`${COMPANY_CATEGORY_LABEL[c]} (${counts[c] ?? 0})`} />
          ))}
          <div className="ml-auto relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search companies…" className="pl-9" />
          </div>
        </div>

        {query.isLoading ? (
          <p className="py-12 text-center text-muted-foreground">Loading directory…</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No companies match your filters.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <CompanyCard key={c.id} c={c} />
            ))}
          </ul>
        )}

        <p className="mt-8 text-xs text-muted-foreground">
          Missing a company? Add it from a project page, or <Link to="/projects" className="underline">browse projects</Link>.
        </p>
      </section>
    </AppShell>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <Button size="sm" variant={active ? "default" : "outline"} onClick={onClick} className="rounded-full">
      {label}
    </Button>
  );
}

function CompanyCard({ c }: { c: Company }) {
  const host = c.website ? safeHost(c.website) : null;
  const logoDevKey = import.meta.env.VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY as string | undefined;
  const sources: string[] = [];
  if (host && logoDevKey) sources.push(`https://img.logo.dev/${host}?token=${logoDevKey}&size=128&format=png&fallback=404`);

  const [idx, setIdx] = useState(0);
  const src = sources[idx];
  return (
    <li className="fnb-card group flex flex-col gap-3 p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white">
          {src ? (
            <img
              src={src}
              alt={`${c.name} logo`}
              className="h-full w-full object-contain p-1.5"
              onError={() => setIdx((i) => i + 1)}
              loading="lazy"
            />
          ) : (
            <Building2 className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{c.name}</p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{COMPANY_CATEGORY_LABEL[c.category]}</p>
        </div>
      </div>
      {host && (
        <a href={c.website!} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1.5 text-sm text-foreground/80 hover:text-foreground">
          <ExternalLink className="size-3.5" /> {host}
        </a>
      )}
    </li>
  );
}

function safeHost(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
}

