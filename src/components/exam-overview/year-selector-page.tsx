import Link from "next/link";
import type { ExamYearMeta } from "@/data/exam-catalog";

type YearSelectorPageProps = {
  years: ExamYearMeta[];
};

export function YearSelectorPage({ years }: YearSelectorPageProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="rounded-[34px] border border-white/70 bg-white/82 p-8 shadow-card backdrop-blur">
        <span className="inline-flex rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#4f79b0]">
          Seleção de prova
        </span>
        <h1 className="mt-5 font-display text-4xl leading-tight text-ink sm:text-5xl">
          Escolha o ano da prova do ENEM
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-slate-600 sm:text-lg">
          A estrutura do produto agora está pronta para múltiplos anos. Cada ano terá a mesma visão geral da prova, páginas por área e leitura de cada questão no mesmo formato.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/metricas-estrategicas"
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#21436c]"
          >
            Abrir métricas estratégicas
          </Link>
          <Link
            href="/filtrar-questoes"
            className="rounded-full border border-[#d6e6ff] bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-clay/50 hover:text-clay"
          >
            Filtrar questões
          </Link>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {years.map((entry) =>
          entry.status === "available" ? (
            <Link
              key={entry.year}
              href={`/prova/${entry.year}`}
              className="rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-card backdrop-blur transition hover:-translate-y-1 hover:border-clay/40"
            >
              <span className="inline-flex rounded-full bg-[#eef5ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#4f79b0]">
                Disponível
              </span>
              <h2 className="mt-4 font-display text-3xl text-ink">{entry.label}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{entry.description}</p>
            </Link>
          ) : (
            <div
              key={entry.year}
              className="rounded-[30px] border border-slate-200/80 bg-white/72 p-6 shadow-card backdrop-blur"
            >
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Em preparo
              </span>
              <h2 className="mt-4 font-display text-3xl text-ink">{entry.label}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{entry.description}</p>
            </div>
          ),
        )}
      </section>
    </main>
  );
}
