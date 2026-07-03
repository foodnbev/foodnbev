import { supabase } from "@/integrations/supabase/client";

export type ConnectionRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
};

export async function getConnectionBetween(a: string, b: string): Promise<ConnectionRow | null> {
  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .or(`and(requester_id.eq.${a},addressee_id.eq.${b}),and(requester_id.eq.${b},addressee_id.eq.${a})`)
    .maybeSingle();
  if (error) throw error;
  return (data as ConnectionRow | null) ?? null;
}

export async function sendConnectionRequest(me: string, other: string) {
  const { data, error } = await supabase
    .from("connections")
    .insert({ requester_id: me, addressee_id: other, status: "pending" })
    .select()
    .single();
  if (error) throw error;
  return data as ConnectionRow;
}

export async function respondToConnection(id: string, accept: boolean) {
  const { error } = await supabase
    .from("connections")
    .update({ status: accept ? "accepted" : "rejected" })
    .eq("id", id);
  if (error) throw error;
}

export async function removeConnection(id: string) {
  const { error } = await supabase.from("connections").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadDmAttachment(userId: string, file: File): Promise<string> {
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${userId}/${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage.from("dm-attachments").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return path;
}

export async function signedDmAttachmentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("dm-attachments").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
