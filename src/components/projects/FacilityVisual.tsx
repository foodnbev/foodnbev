import type { FacilityType, FoodSubtype } from "@/lib/constants";
import { Beer, FlaskConical, Beef, Fish, Cookie, Snowflake, Factory } from "lucide-react";

const PALETTE: Record<FacilityType, { from: string; to: string; ring: string }> = {
  brewery: { from: "color-mix(in oklch, var(--sand) 60%, white)", to: "color-mix(in oklch, var(--sand) 25%, white)", ring: "var(--sand)" },
  distillery: { from: "color-mix(in oklch, var(--sand) 45%, var(--teal))", to: "color-mix(in oklch, var(--teal) 25%, white)", ring: "var(--teal)" },
  food_processing: { from: "color-mix(in oklch, var(--teal) 55%, white)", to: "color-mix(in oklch, var(--teal) 20%, white)", ring: "var(--teal)" },
};

function pickIcon(type: FacilityType, sub?: FoodSubtype | null) {
  if (type === "brewery") return Beer;
  if (type === "distillery") return FlaskConical;
  switch (sub) {
    case "meat": return Beef;
    case "fish": return Fish;
    case "snacks": return Cookie;
    case "coldroom": return Snowflake;
    default: return Factory;
  }
}

export function FacilityVisual({
  type,
  subtype,
  src,
  alt,
  className = "",
}: {
  type: FacilityType;
  subtype?: FoodSubtype | null;
  src?: string | null;
  alt: string;
  className?: string;
}) {
  if (src) {
    return (
      <img src={src} alt={alt} className={`h-full w-full object-cover ${className}`} loading="lazy" />
    );
  }
  const p = PALETTE[type];
  const Icon = pickIcon(type, subtype);
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(120% 100% at 20% 0%, ${p.from} 0%, ${p.to} 60%, white 100%)`,
      }}
      aria-label={alt}
      role="img"
    >
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, var(--ink) 0 1px, transparent 1px 14px)",
        }}
      />
      <Icon className="size-16 text-foreground/75" strokeWidth={1.25} />
    </div>
  );
}
