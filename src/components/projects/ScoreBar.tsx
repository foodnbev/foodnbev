export function ScoreBar({
  value,
  label,
  tone = "sand",
}: {
  value: number;
  label: string;
  tone?: "sand" | "teal" | "ink";
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const bg =
    tone === "sand"
      ? "var(--sand)"
      : tone === "teal"
        ? "var(--teal)"
        : "var(--ink)";
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-foreground/80">{label}</span>
        <span className="tabular-nums text-foreground">{v}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${v}%`, background: bg }}
        />
      </div>
    </div>
  );
}
