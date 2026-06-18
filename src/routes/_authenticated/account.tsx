import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My account — food n bev" }] }),
  component: Account,
});

function Account() {
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: p }, { data: list }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
        supabase.from("projects").select("id,name,address,description,status,facility_type,food_subtype,cover_image_url")
          .eq("created_by", u.user.id).order("created_at", { ascending: false }),
      ]);
      setProfile(p);
      setProjects(list ?? []);
    })();
  }, []);

  async function removeProject(id: string) {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setProjects(projects.filter((p) => p.id !== id));
    toast.success("Project deleted");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">My account</h1>
            {profile && (
              <p className="mt-1 text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{profile.alias}</span> · {profile.email}
              </p>
            )}
          </div>
          <Button asChild><Link to="/projects/new">Add a project</Link></Button>
        </header>

        <h2 className="mt-10 text-xl font-semibold tracking-tight">Projects you created</h2>
        {projects.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">You haven't added any projects yet.</p>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <div key={p.id} className="space-y-2">
                <ProjectCard p={p} />
                <Button variant="outline" size="sm" className="w-full" onClick={() => removeProject(p.id)}>Delete</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
