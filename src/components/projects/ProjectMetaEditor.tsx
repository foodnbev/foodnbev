import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  STATUS_LABEL, STATUS_TONE, WORK_TYPE_LABEL,
  type ProjectStatus, type WorkType,
} from "@/lib/constants";
import { Pencil } from "lucide-react";

type Props = {
  projectId: string;
  status: ProjectStatus;
  workType: WorkType | null;
  onSaved: () => void;
};

export function ProjectMetaEditor({ projectId, status, workType, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [s, setS] = useState<ProjectStatus>(status);
  const [w, setW] = useState<WorkType | "">(workType ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("projects")
      .update({ status: s, work_type: w || null })
      .eq("id", projectId);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setEditing(false);
    onSaved();
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`fnb-chip ${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>
        {workType && <span className="fnb-chip">{WORK_TYPE_LABEL[workType]}</span>}
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs hover:bg-muted"
        >
          <Pencil className="size-3" /> Change
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
      <label className="text-xs text-muted-foreground">Status</label>
      <select
        value={s}
        onChange={(e) => setS(e.target.value as ProjectStatus)}
        className="rounded-md border bg-background px-2 py-1 text-sm"
      >
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <label className="ml-2 text-xs text-muted-foreground">Work type</label>
      <select
        value={w}
        onChange={(e) => setW(e.target.value as WorkType | "")}
        className="rounded-md border bg-background px-2 py-1 text-sm"
      >
        <option value="">—</option>
        {Object.entries(WORK_TYPE_LABEL).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <div className="ml-auto flex gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="rounded-md bg-foreground px-3 py-1 text-xs font-medium text-background hover:opacity-90"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => { setS(status); setW(workType ?? ""); setEditing(false); }}
          className="rounded-md border px-3 py-1 text-xs hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
