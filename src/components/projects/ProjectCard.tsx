import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { FacilityVisual } from "./FacilityVisual";
import { ScoreBar } from "./ScoreBar";
import { FACILITY_LABEL, FOOD_SUBTYPE_LABEL, STATUS_LABEL, STATUS_TONE, type FacilityType, type FoodSubtype, type ProjectStatus } from "@/lib/constants";

export type ProjectCardData = {
  id: string;
  name: string;
  address: string;
  description: string;
  status: ProjectStatus;
  facility_type: FacilityType;
  food_subtype: FoodSubtype | null;
  cover_image_url: string | null;
  hotness?: number;
  accuracy?: number;
  completeness?: number;
};

export function ProjectCard({ p }: { p: ProjectCardData }) {
  return (
    <Link
      to="/projects/$id"
      params={{ id: p.id }}
      className="group fnb-card flex flex-col overflow-hidden"
    >
      <div className="aspect-[16/10] w-full overflow-hidden">
        <FacilityVisual type={p.facility_type} subtype={p.food_subtype} src={p.cover_image_url} alt={p.name} />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`fnb-chip ${STATUS_TONE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
          <span className="fnb-chip">{FACILITY_LABEL[p.facility_type]}</span>
          {p.food_subtype && <span className="fnb-chip">{FOOD_SUBTYPE_LABEL[p.food_subtype]}</span>}
        </div>
        <h3 className="text-lg font-semibold leading-snug tracking-tight text-foreground group-hover:text-foreground">
          {p.name}
        </h3>
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" /> <span className="line-clamp-2">{p.address}</span>
        </p>
        <p className="line-clamp-2 text-sm text-foreground/75">{p.description}</p>
        {(p.hotness !== undefined || p.accuracy !== undefined || p.completeness !== undefined) && (
          <div className="mt-auto grid grid-cols-3 gap-3 pt-3">
            {p.hotness !== undefined && <ScoreBar value={p.hotness} label="Hot" tone="sand" />}
            {p.accuracy !== undefined && <ScoreBar value={p.accuracy} label="Accuracy" tone="teal" />}
            {p.completeness !== undefined && <ScoreBar value={p.completeness} label="Complete" tone="ink" />}
          </div>
        )}
      </div>
    </Link>
  );
}
