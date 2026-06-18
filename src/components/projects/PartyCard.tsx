import { Mail, Phone, Building2, User2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
};

export function PartyCard({ row, canDelete, onDelete }: { row: PartyRow; canDelete: boolean; onDelete?: () => void }) {
  const heading = row.category === "other" ? row.other_label || "Other" : PARTY_CATEGORY_LABEL[row.category];
  return (
    <div className="fnb-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{PARTY_CATEGORY_LABEL[row.category]}</p>
          <p className="mt-0.5 font-semibold">{heading}</p>
        </div>
        {canDelete && (
          <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Remove">
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        {row.company && <Line icon={<Building2 className="size-4" />} v={row.company} />}
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
