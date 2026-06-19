import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Trash2, Pencil, Download, X, Check } from "lucide-react";

type InfoRow = {
  id: string;
  project_id: string;
  created_by: string;
  body: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
  attachment_size: number | null;
  created_at: string;
};

const BUCKET = "project-info";

async function signedUrl(path: string) {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export function ProjectInfoSection({
  projectId,
  currentUserId,
}: {
  projectId: string;
  currentUserId: string | null;
}) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["project", projectId, "info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_info_entries")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // attach alias
      const ids = Array.from(new Set((data ?? []).map((r) => r.created_by)));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id,alias").in("id", ids)
        : { data: [] as { id: string; alias: string }[] };
      const aliasMap = new Map((profs ?? []).map((p: any) => [p.id, p.alias]));
      return (data ?? []).map((r) => ({ ...(r as InfoRow), alias: aliasMap.get(r.created_by) ?? "—" }));
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["project", projectId, "info"] });

  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Project info</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentUserId
              ? "Share notes or upload supporting files. You can edit or delete only your own entries."
              : "Sign in to read and contribute notes and attachments."}
          </p>
        </div>
      </div>

      {currentUserId && <NewInfoForm projectId={projectId} userId={currentUserId} onSaved={refresh} />}

      <div className="mt-5 space-y-3">
        {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {q.data?.length === 0 && (
          <p className="rounded-lg border border-dashed bg-card/60 px-4 py-6 text-center text-sm text-muted-foreground">
            No entries yet.
          </p>
        )}
        {q.data?.map((row) => (
          <InfoEntry key={row.id} row={row} canEdit={row.created_by === currentUserId} onChanged={refresh} />
        ))}
      </div>
    </section>
  );
}

function NewInfoForm({ projectId, userId, onSaved }: { projectId: string; userId: string; onSaved: () => void }) {
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const text = body.trim();
    if (!text && !file) return toast.error("Add text or attach a file.");
    setBusy(true);
    try {
      let attachment_path: string | null = null;
      let attachment_name: string | null = null;
      let attachment_mime: string | null = null;
      let attachment_size: number | null = null;
      if (file) {
        const path = `${projectId}/${userId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
        const up = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
        if (up.error) throw up.error;
        attachment_path = path;
        attachment_name = file.name;
        attachment_mime = file.type || null;
        attachment_size = file.size;
      }
      const { error } = await supabase.from("project_info_entries").insert({
        project_id: projectId,
        created_by: userId,
        body: text || null,
        attachment_path,
        attachment_name,
        attachment_mime,
        attachment_size,
      });
      if (error) throw error;
      setBody("");
      setFile(null);
      onSaved();
      toast.success("Posted");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border bg-card p-4">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share an update, a note, or context about this project…"
        rows={3}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
          <Paperclip className="size-4" />
          {file ? file.name : "Attach file"}
          <input
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {file && (
          <button className="text-xs text-muted-foreground underline" onClick={() => setFile(null)} type="button">
            remove file
          </button>
        )}
        <div className="ml-auto">
          <Button onClick={submit} disabled={busy}>{busy ? "Posting…" : "Post"}</Button>
        </div>
      </div>
    </div>
  );
}

function InfoEntry({
  row,
  canEdit,
  onChanged,
}: {
  row: InfoRow & { alias: string };
  canEdit: boolean;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(row.body ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const text = body.trim();
    if (!text && !row.attachment_path) {
      setBusy(false);
      return toast.error("Entry can't be empty.");
    }
    const { error } = await supabase
      .from("project_info_entries")
      .update({ body: text || null })
      .eq("id", row.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    setEditing(false);
    onChanged();
  }

  async function remove() {
    if (!confirm("Delete this entry?")) return;
    if (row.attachment_path) {
      await supabase.storage.from(BUCKET).remove([row.attachment_path]);
    }
    const { error } = await supabase.from("project_info_entries").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    onChanged();
  }

  async function openAttachment() {
    if (!row.attachment_path) return;
    const url = await signedUrl(row.attachment_path);
    if (url) window.open(url, "_blank", "noopener");
  }

  return (
    <article className="rounded-xl border bg-card p-4">
      <header className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{row.alias}</span> ·{" "}
          {new Date(row.created_at).toLocaleString()}
        </span>
        {canEdit && !editing && (
          <span className="flex items-center gap-1">
            <button
              className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-muted"
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-3.5" /> Edit
            </button>
            <button
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-destructive hover:bg-muted"
              onClick={remove}
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          </span>
        )}
      </header>

      {editing ? (
        <div className="mt-3 space-y-3">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={busy}>
              <Check className="size-4" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setBody(row.body ?? ""); setEditing(false); }}>
              <X className="size-4" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        row.body && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{row.body}</p>
      )}

      {row.attachment_path && (
        <button
          onClick={openAttachment}
          className="mt-3 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs hover:bg-muted"
        >
          <Download className="size-3.5" />
          {row.attachment_name ?? "Attachment"}
          {row.attachment_size != null && (
            <span className="text-muted-foreground">· {Math.round(row.attachment_size / 1024)} KB</span>
          )}
        </button>
      )}
    </article>
  );
}
