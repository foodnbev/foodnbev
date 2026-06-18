import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Flame, Target } from "lucide-react";

export function RatingPicker({ projectId, onSaved }: { projectId: string; onSaved?: () => void }) {
  const [hotness, setHotness] = useState<number>(50);
  const [accuracy, setAccuracy] = useState<number>(50);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("project_ratings")
        .select("hotness,accuracy")
        .eq("project_id", projectId).eq("user_id", u.user.id).maybeSingle();
      if (data) { setHotness(data.hotness); setAccuracy(data.accuracy); }
      setLoaded(true);
    })();
  }, [projectId]);

  async function save() {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setBusy(false); return; }
    const { error } = await supabase.from("project_ratings").upsert({
      project_id: projectId, user_id: u.user.id, hotness, accuracy,
    }, { onConflict: "project_id,user_id" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Rating saved");
    onSaved?.();
  }

  if (!loaded) return null;
  return (
    <div className="space-y-5 rounded-xl border bg-card p-4">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 font-medium"><Flame className="size-4" style={{ color: "var(--sand)" }} /> How hot is this project?</span>
          <span className="tabular-nums">{hotness}%</span>
        </div>
        <Slider min={0} max={100} step={1} value={[hotness]} onValueChange={(v) => setHotness(v[0])} />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 font-medium"><Target className="size-4" style={{ color: "var(--teal)" }} /> How accurate is the info?</span>
          <span className="tabular-nums">{accuracy}%</span>
        </div>
        <Slider min={0} max={100} step={1} value={[accuracy]} onValueChange={(v) => setAccuracy(v[0])} />
      </div>
      <Button onClick={save} disabled={busy} className="w-full">{busy ? "Saving…" : "Save rating"}</Button>
    </div>
  );
}
