import type { ReactNode } from "react";

type SectionShellProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

export function SectionShell({
  title,
  eyebrow,
  children,
}: SectionShellProps) {
  return (
    <section className="space-y-5 rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-card backdrop-blur sm:p-8">
      <div className="space-y-2">
        {eyebrow ? (
          <span className="inline-flex rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a6a22]">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="font-display text-3xl leading-tight text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}
