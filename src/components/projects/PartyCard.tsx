import { Mail, Phone, Building2, User2, Trash2, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PARTY_CATEGORY_LABEL, type PartyCategory } from "@/lib/constants";

export type PartyRow = {
  id: string;
  project_id: string;
  created_by: string;
  category: PartyCategory;
  other_label: string | null;
  company: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  spec_description: string | null;
  company_id?: string | null;
};

type Linked = { name: string; website: string | null };

export function PartyCard({ row, canDelete, onDelete }: { row: PartyRow; canDelete: boolean; onDelete?: () => void }) {
  const heading = row.category === "other" ? row.other_label || "Other" : PARTY_CATEGORY_LABEL[row.category];
  const [linked, setLinked] = useState<Linked | null>(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (!row.company_id) { setLinked(null); return; }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("companies")
        .select("name,website")
        .eq("id", row.company_id!)
        .maybeSingle();
      if (!cancelled && data) setLinked(data as Linked);
    })();
    return () => { cancelled = true; };
  }, [row.company_id]);

  return (
    <div className="fnb-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {linked && (
            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
              {getLogoUrl(linked.website) && !broken ? (
                <img src={getLogoUrl(linked.website) ?? undefined} alt={`${linked.name} logo`} className="h-full w-full object-contain p-1" onError={() => setBroken(true)} loading="lazy" />
              ) : (
                <Building2 className="size-5 text-muted-foreground" />
              )}
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{PARTY_CATEGORY_LABEL[row.category]}</p>
            <p className="mt-0.5 font-semibold">{heading}</p>
          </div>
        </div>
        {canDelete && (
          <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Remove">
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        {row.company && <Line icon={<Building2 className="size-4" />} v={row.company} />}
        {linked?.website && (
          <Line icon={<ExternalLink className="size-4" />} v={<a href={linked.website} target="_blank" rel="noopener noreferrer" className="underline">{safeHost(linked.website)}</a>} />
        )}
        {row.contact_name && <Line icon={<User2 className="size-4" />} v={row.contact_name} />}
        {row.email && <Line icon={<Mail className="size-4" />} v={<a href={`mailto:${row.email}`} className="underline">{row.email}</a>} />}
        {row.phone && <Line icon={<Phone className="size-4" />} v={<a href={`tel:${row.phone}`} className="underline">{row.phone}</a>} />}
      </dl>
      {row.spec_description && (
        <p className="mt-3 rounded-md bg-muted/60 p-2 text-xs text-foreground/80">{row.spec_description}</p>
      )}
    </div>
  );
}

function Line({ icon, v }: { icon: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-foreground/85">
      <span className="text-muted-foreground">{icon}</span>
      <span>{v}</span>
    </div>
  );
}

function safeHost(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}


function getLogoUrl(website: string | null) {
  if (!website) return null;

  try {
    const host = new URL(website).hostname.replace(/^www\./, "");
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY as string | undefined;

    if (!key) return null;

    return `https://img.logo.dev/${host}?token=${key}&size=128&format=png&fallback=404`;
  } catch {
    return null;
  }
}

