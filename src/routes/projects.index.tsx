import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { searchProjects } from "@/lib/projects.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FACILITY_LABEL, PARTY_CATEGORY_LABEL, PARTY_CATEGORY_ORDER, STATUS_LABEL, WORK_TYPE_LABEL,
} from "@/lib/constants";
import { Search, X } from "lucide-react";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — food n bev" },
      { name: "description", content: "Search and filter food & beverage construction projects by area, company, status and category." },
    ],
  }),
  component: ProjectsPage,
});

type Filters = {
  q: string;
  facility_type?: any;
  status?: any;
  work_type?: any;
  company: string;
  category?: any;
};

const EMPTY: Filters = { q: "", company: "" };

function ProjectsPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ["projects", "search", applied],
    queryFn: () =>
      searchProjects({
        data: {
          q: applied.q || undefined,
          company: applied.company || undefined,
          facility_type: applied.facility_type,
          status: applied.status,
          work_type: applied.work_type,
          category: applied.category,
          limit: 48,
        },
      }),
  });

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    setApplied(filters);
  }
  function reset() {
    setFilters(EMPTY);
    setApplied(EMPTY);
  }

  return (
    <AppShell>
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Projects</h1>
          <p className="mt-2 max-w-2xl text-foreground/70">
            Search by keyword, area, company, status or category. Sign in to see contractor details.
          </p>
          <form onSubmit={apply} className="mt-6 grid gap-3 md:grid-cols-12">
            <Input
              placeholder="Keyword, area, facility…"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              className="md:col-span-5"
            />
            <Input
              placeholder="Company (architect, GC, M&E…)"
              value={filters.company}
              onChange={(e) => setFilters({ ...filters, company: e.target.value })}
              className="md:col-span-4"
            />
            <div className="flex gap-2 md:col-span-3">
              <Button type="submit" className="flex-1"><Search className="size-4" /> Search</Button>
              <Button type="button" variant="ghost" onClick={reset} aria-label="Reset">
                <X className="size-4" />
              </Button>
            </div>

            <FilterSelect label="Facility" value={filters.facility_type} options={FACILITY_LABEL} onChange={(v) => setFilters({ ...filters, facility_type: v })} />
            <FilterSelect label="Status" value={filters.status} options={STATUS_LABEL} onChange={(v) => setFilters({ ...filters, status: v })} />
            <FilterSelect label="Work type" value={filters.work_type} options={WORK_TYPE_LABEL} onChange={(v) => setFilters({ ...filters, work_type: v })} />
            <FilterSelect
              label="Has category"
              value={filters.category}
              options={Object.fromEntries(PARTY_CATEGORY_ORDER.map((k) => [k, PARTY_CATEGORY_LABEL[k]])) as Record<string, string>}
              onChange={(v) => setFilters({ ...filters, category: v })}
            />
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {isLoading ? (
          <p className="text-muted-foreground">Searching…</p>
        ) : !data?.projects.length ? (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <p className="text-base font-medium">No projects match.</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different keyword, or <Link to="/projects/new" className="underline">add a project</Link>.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.projects.map((p) => <ProjectCard key={p.id} p={p as any} />)}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function FilterSelect<T extends string>({
  label, value, options, onChange,
}: {
  label: string;
  value: T | undefined;
  options: Record<string, string>;
  onChange: (v: T | undefined) => void;
}) {
  return (
    <div className="md:col-span-3">
      <Select value={value ?? "__any"} onValueChange={(v) => onChange(v === "__any" ? undefined : (v as T))}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__any">Any {label.toLowerCase()}</SelectItem>
          {Object.entries(options).map(([k, v]) => (
            <SelectItem key={k} value={k}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
