import { createServerFn } from "@tanstack/react-start";

export const listRfqsMasked = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("rfqs" as any)
      .select("id, created_at, closed_at, deadline, categories")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data as any[]).map((r) => ({
      id: r.id as string,
      created_at: r.created_at as string,
      closed_at: r.closed_at as string | null,
      deadline: r.deadline as string | null,
      category_count: Array.isArray(r.categories) ? r.categories.length : 0,
    }));
  });
