type BadgeProps = {
  label: string;
  tone?: "gold" | "ink" | "clay" | "soft";
};

const toneMap = {
  gold: "bg-gold/15 text-[#4f79b0]",
  ink: "bg-ink text-white",
  clay: "bg-clay/15 text-clay",
  soft: "bg-[#eef4ff] text-[#5c78a1]",
};

export function Badge({ label, tone = "soft" }: BadgeProps) {
  return (
    <span
      className={`inline-flex max-w-full whitespace-normal break-words rounded-full px-2.5 py-1 text-center text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] ${toneMap[tone]}`}
    >
      {label}
    </span>
  );
}
