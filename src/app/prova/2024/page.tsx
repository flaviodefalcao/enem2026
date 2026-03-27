import Link from "next/link";
import { getLandingPageData } from "@/data/exam-catalog";

export default function ExamLandingPage() {
  const landing = getLandingPageData();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="rounded-[34px] border border-white/70 bg-white/80 p-8 shadow-card backdrop-blur">
        <span className="inline-flex rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a6a22]">
          Prova completa
        </span>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
              ENEM 2024 com visão geral da prova e navegação por área.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              A entrada do produto agora considera as quatro áreas, com uma
              camada geral de performance da prova e páginas específicas para
              Linguagens, Ciências Humanas, Ciências da Natureza e Matemática.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-3xl bg-ink p-5 text-white">
              <div className="text-sm uppercase tracking-[0.2em] text-white/70">
                Total de questões
              </div>
              <div className="mt-2 text-4xl font-semibold">{landing.totalQuestions}</div>
            </div>
            <div className="rounded-3xl bg-white p-5">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Acerto médio geral
              </div>
              <div className="mt-2 text-2xl font-semibold text-ink">
                {landing.averageAccuracy.toFixed(1)}%
              </div>
              <div className="mt-1 text-sm text-slate-600">
                4 áreas • {landing.areaCount} painéis
              </div>
            </div>
            <Link
              href="/prova/2024/matematica"
              className="flex items-center justify-center rounded-3xl bg-clay px-5 py-5 text-base font-semibold text-white transition hover:bg-[#c45c30]"
            >
              Abrir Matemática
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {landing.areas.map((area) => (
          <Link
            key={area.slug}
            href={`/prova/2024/${area.slug}`}
            className="rounded-[30px] border border-white/70 bg-white/78 p-6 shadow-card backdrop-blur transition hover:-translate-y-1 hover:border-clay/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {area.dayLabel}
                </p>
                <h2 className="mt-3 font-display text-3xl leading-none text-ink">
                  {area.label}
                </h2>
              </div>
              <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                {area.shortLabel}
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{area.lead}</p>
            <div className="mt-6 space-y-3 rounded-[24px] border border-slate-200/80 bg-slate-50 px-4 py-4">
              <div className="flex items-end justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Questões
                </span>
                <span className="text-2xl font-semibold text-ink">{area.questionCount}</span>
              </div>
              <div className="flex items-end justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Acerto médio
                </span>
                <span className="text-2xl font-semibold text-clay">
                  {area.averageAccuracy.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Tema recorrente: {area.strongestTheme}
              </p>
              <p className="text-sm leading-6 text-slate-500">
                PDF-base: {area.pdfFile}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
