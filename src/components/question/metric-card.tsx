type MetricCardProps = {
  label: string;
  value: string;
  supportingText?: string;
};

export function MetricCard({
  label,
  value,
  supportingText,
}: MetricCardProps) {
  return (
    <article className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-4xl font-semibold leading-none text-ink">{value}</p>
      {supportingText ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{supportingText}</p>
      ) : null}
    </article>
  );
}
