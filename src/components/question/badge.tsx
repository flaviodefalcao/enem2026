type BadgeProps = {
  label: string;
  tone?: "gold" | "ink" | "clay" | "soft";
};

const toneMap = {
  gold: "bg-gold/15 text-[#8a6a22]",
  ink: "bg-ink text-white",
  clay: "bg-clay/15 text-clay",
  soft: "bg-slate-100 text-slate-600",
};

export function Badge({ label, tone = "soft" }: BadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${toneMap[tone]}`}
    >
      {label}
    </span>
  );
}
