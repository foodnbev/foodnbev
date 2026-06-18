import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const SearchSchema = z.object({
  q: z.string().optional(),
  facility_type: z.enum(["brewery", "distillery", "food_processing"]).optional(),
  status: z.enum(["planning", "underway", "completed", "unknown"]).optional(),
  work_type: z.enum(["newbuild", "extension", "refurbishment", "modification"]).optional(),
  company: z.string().optional(),
  category: z
    .enum([
      "end_user","architect","general_contractor","me","real_estate_planner",
      "consultant","flooring","groundworks","drainage","other",
    ])
    .optional(),
  limit: z.number().int().min(1).max(60).optional().default(24),
});

export const searchProjects = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => SearchSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const supabase = publicClient();

    // If company/category filters set, find candidate project ids from parties
    let candidateIds: string[] | null = null;
    if (data.company || data.category) {
      let pq = supabase.from("project_parties").select("project_id");
      if (data.company) pq = pq.ilike("company", `%${data.company}%`);
      if (data.category) pq = pq.eq("category", data.category);
      const { data: rows, error } = await pq.limit(500);
      if (error) throw error;
      candidateIds = Array.from(new Set((rows ?? []).map((r) => r.project_id)));
      if (candidateIds.length === 0) return { projects: [] };
    }

    let q = supabase
      .from("projects")
      .select("id,name,address,description,status,facility_type,food_subtype,cover_image_url,created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.q) {
      const term = data.q.replace(/[,%]/g, " ").trim();
      q = q.or(`name.ilike.%${term}%,address.ilike.%${term}%,description.ilike.%${term}%`);
    }
    if (data.facility_type) q = q.eq("facility_type", data.facility_type);
    if (data.status) q = q.eq("status", data.status);
    if (data.work_type) q = q.eq("work_type", data.work_type);
    if (candidateIds) q = q.in("id", candidateIds);

    const { data: projects, error } = await q;
    if (error) throw error;

    // Enrich with rating summary + completeness in parallel
    const enriched = await Promise.all(
      (projects ?? []).map(async (p) => {
        const [rs, cs] = await Promise.all([
          supabase.rpc("get_rating_summary", { p_id: p.id }),
          supabase.rpc("project_completeness", { p_id: p.id }),
        ]);
        const r = rs.data?.[0];
        return {
          ...p,
          hotness: r?.avg_hotness ?? 0,
          accuracy: r?.avg_accuracy ?? 0,
          completeness: (cs.data as number | null) ?? 0,
        };
      }),
    );

    return { projects: enriched };
  });

export const getProjectPublic = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const [proj, presence, rating, completeness] = await Promise.all([
      supabase
        .from("projects")
        .select("id,name,address,description,status,facility_type,food_subtype,work_type,cover_image_url,created_at,created_by")
        .eq("id", data.id)
        .maybeSingle(),
      supabase.rpc("get_party_presence", { p_id: data.id }),
      supabase.rpc("get_rating_summary", { p_id: data.id }),
      supabase.rpc("project_completeness", { p_id: data.id }),
    ]);
    if (proj.error) throw proj.error;
    if (!proj.data) return { project: null } as const;
    const r = rating.data?.[0];
    return {
      project: proj.data,
      categories_present: (presence.data as string[] | null) ?? [],
      hotness: r?.avg_hotness ?? 0,
      accuracy: r?.avg_accuracy ?? 0,
      rating_count: r?.rating_count ?? 0,
      completeness: (completeness.data as number | null) ?? 0,
    } as const;
  });
