import Link from "next/link";
import { ProofStatsPanel } from "@/components/exam-overview/proof-stats-panel";
import type { ExamYear } from "@/data/exam-catalog";

type LandingPageData = {
  totalQuestions: number;
  averageAccuracy: number;
  areaCount: number;
  areas: Array<{
    slug: string;
    label: string;
    shortLabel: string;
    dayLabel: string;
    proofColor: string;
    questionCount: number;
    averageAccuracy: number;
    lead: string;
  }>;
  dayStats: Array<{
    dayLabel: string;
    areaLabels: string[];
    averageAccuracy: number;
    totalQuestions: number;
    scoreDistribution: Array<{
      faixa: string;
      n: number;
      share: number;
    }>;
  }>;
  proofStats: {
    sampleSize: number;
    generalScoreDistribution: Array<{ faixa: string; n: number; share: number }>;
    essayDistribution: Array<{ faixa: string; n: number; share: number }>;
    topStudents: {
      threshold: number;
      sampleSize: number;
      scoreRanges: Array<{ label: string; minScore: number; maxScore: number }>;
      accuracyRanges: Array<{
        label: string;
        minAccuracy: number;
        maxAccuracy: number;
        maxPossible: number;
      }>;
    };
    overallAccuracyVsScore: Array<{
      faixa: string;
      n: number;
      mediaAcertos: number;
      minAcertos: number;
      maxAcertos: number;
      stdAcertos: number;
      mediaNota: number;
    }>;
    areas: Array<{
      slug: "linguagens" | "ciencias-humanas" | "ciencias-natureza" | "matematica" | "geral";
      label: string;
      questionCount: number;
      sampleSize: number;
      averageAccuracy: number;
      averageScore: number;
      accuracyVsScore: Array<{
        faixa: string;
        n: number;
        mediaAcertos: number;
        minAcertos: number;
        maxAcertos: number;
        stdAcertos: number;
        mediaNota: number;
      }>;
    }>;
  } | null;
};

type ExamLandingPageProps = {
  year: ExamYear;
  landing: LandingPageData;
};

export function ExamLandingPage({ year, landing }: ExamLandingPageProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="rounded-[34px] border border-white/70 bg-white/80 p-6 shadow-card backdrop-blur sm:p-7">
        <span className="inline-flex rounded-full bg-gold/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4f79b0]">
          Prova completa
        </span>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-3">
            <h1 className="max-w-4xl font-display text-3xl leading-[1.02] text-ink sm:text-[3.25rem]">
              ENEM {year} com visão geral e navegação por área
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              A página reúne as quatro áreas, com leitura geral de desempenho da prova e acesso direto aos painéis específicos.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[26px] bg-ink px-5 py-4 text-white">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">Total de questões</div>
              <div className="mt-2 text-3xl font-semibold">{landing.totalQuestions}</div>
            </div>
            <div className="rounded-[26px] bg-white px-5 py-4 ring-1 ring-slate-200/80">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Acerto médio geral</div>
              <div className="mt-2 text-[1.8rem] font-semibold text-ink">{landing.averageAccuracy.toFixed(1)}%</div>
              <div className="mt-1 text-sm text-slate-600">4 áreas • {landing.areaCount} painéis</div>
            </div>
            <Link
              href="/prova"
              className="flex items-center justify-center rounded-[26px] bg-clay px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#568fd0]"
            >
              Voltar para todas as provas
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {landing.areas.map((area) => (
          <Link
            key={area.slug}
            href={`/prova/${year}/${area.slug}`}
            className="rounded-[26px] border border-white/70 bg-white/78 p-5 shadow-card backdrop-blur transition hover:-translate-y-1 hover:border-clay/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{area.dayLabel}</p>
                <h2 className="mt-2 font-display text-[2rem] leading-none text-ink">{area.label}</h2>
              </div>
              <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                {area.shortLabel}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{area.lead}</p>
            <div className="mt-5 space-y-3 rounded-[22px] border border-[#dbe8f8] bg-[#f7fbff] px-4 py-4">
              <div className="flex items-end justify-between gap-3">
                <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Questões</span>
                <span className="text-xl font-semibold text-ink">{area.questionCount}</span>
              </div>
              <div className="flex items-end justify-between gap-3">
                <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Acerto médio</span>
                <span className="text-xl font-semibold text-clay">{area.averageAccuracy.toFixed(1)}%</span>
              </div>
              <p className="text-sm leading-6 text-slate-600">Cor da prova: {area.proofColor}</p>
            </div>
          </Link>
        ))}
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/82 p-6 shadow-card backdrop-blur sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#4f79b0]">
              Estatísticas gerais
            </span>
            <h2 className="mt-4 font-display text-3xl leading-tight text-ink sm:text-4xl">Visão da prova por dia</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Um resumo da média de acertos e da distribuição dos alunos por faixa de nota em cada dia da prova.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {landing.dayStats.map((day) => (
            <article key={day.dayLabel} className="rounded-[28px] border border-slate-200/80 bg-slate-50 px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{day.dayLabel}</p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink">{day.areaLabels.join(" + ")}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{day.totalQuestions} questões no total</p>
                </div>
                <div className="rounded-[22px] bg-white px-4 py-4 ring-1 ring-slate-200/80">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Média de acertos</p>
                  <p className="mt-2 text-3xl font-semibold text-ink">{day.averageAccuracy.toFixed(1)}%</p>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Distribuição por faixa de nota</p>
                <div className="mt-4 space-y-3">
                  {day.scoreDistribution.map((bucket) => (
                    <div key={`${day.dayLabel}-${bucket.faixa}`}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-600">{bucket.faixa}</span>
                        <span className="text-slate-500">{bucket.share.toFixed(1)}% · {bucket.n.toLocaleString("pt-BR")} alunos</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[#dbe8f8]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#d6e6ff] via-[#6AA5E8] to-[#2A4E7A]"
                          style={{ width: `${bucket.share}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {landing.proofStats ? (
        <ProofStatsPanel
          sampleSize={landing.proofStats.sampleSize}
          generalScoreDistribution={landing.proofStats.generalScoreDistribution}
          essayDistribution={landing.proofStats.essayDistribution}
          topStudents={landing.proofStats.topStudents}
          areas={landing.proofStats.areas}
        />
      ) : null}
    </main>
  );
}
