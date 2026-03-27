import Link from "next/link";
import { Badge } from "@/components/question/badge";
import { ChartsPanel } from "@/components/question/charts-panel";
import { QuestionImagePreview } from "@/components/question/question-image-preview";
import { ResolutionPanel } from "@/components/question/resolution-panel";
import { SectionShell } from "@/components/question/section-shell";
import {
  getAreaQuestionPageData,
  type AreaQuestionPageData,
} from "@/data/exam-catalog";

type QuestionPageViewProps = {
  question: AreaQuestionPageData;
};

const relationToneMap: Record<string, "gold" | "clay" | "ink" | "soft"> = {
  skill: "ink",
  subtema: "gold",
  tema: "gold",
  competencia: "clay",
  dificuldade: "clay",
  distrator: "soft",
};

const analyticalHeadings = [
  "Resumo da dificuldade",
  "Análise do distrator dominante",
  "Valor diagnóstico da questão",
];

function getDifficultyTheme(level: number) {
  if (level <= 2) {
    return {
      text: "text-emerald-700",
      chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      barActive: "bg-emerald-500",
      barIdle: "bg-emerald-100",
    };
  }

  if (level === 3) {
    return {
      text: "text-amber-700",
      chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
      barActive: "bg-amber-500",
      barIdle: "bg-amber-100",
    };
  }

  return {
    text: "text-rose-700",
    chip: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    barActive: "bg-rose-500",
    barIdle: "bg-rose-100",
  };
}

function ordinalLabel(value: number) {
  if (!value) return "-";
  return `${value}a`;
}

function HeaderMetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="rounded-[24px] border border-slate-200/80 bg-white/88 px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{helper}</p>
    </article>
  );
}

export function QuestionPageView({ question }: QuestionPageViewProps) {
  const previousId = question.id > 1 ? question.id - 1 : null;
  const nextId = question.id < 45 ? question.id + 1 : null;
  const difficultyTheme = getDifficultyTheme(question.triMetrics.difficultyLevel);
  const analyticsHighlights = [
    ["Gap 900+ vs <600", `${question.analyticsSnapshot.discriminationGapLt600To900.toFixed(1)} p.p.`],
    ["Distrator dominante", `${question.topDistractor} · ${question.analyticsSnapshot.dominantDistractorShare.toFixed(1)}%`],
    ["Informação do item", question.analyticsSnapshot.informationLabel],
  ];
  const metadataEntries = [
    ["Tema", question.theme],
    ["Subtema", question.subtheme],
    ["Habilidade ENEM", question.skill],
    ["Tipo cognitivo", question.metadata.cognitiveType],
    ["Usa gráfico/tabela", question.metadata.usesChart ? "Sim" : "Não"],
    ["Nível de abstração", question.metadata.abstractionLevel],
  ];
  const resolveRelationTone = (relation: string) => {
    const normalized = relation.toLowerCase();
    if (normalized.includes("habilidade")) return relationToneMap.skill;
    if (normalized.includes("subtema")) return relationToneMap.subtema;
    if (normalized.includes("tema")) return relationToneMap.tema;
    if (normalized.includes("competência")) return relationToneMap.competencia;
    if (normalized.includes("dificuldade")) return relationToneMap.dificuldade;
    if (normalized.includes("distrator")) return relationToneMap.distrator;
    return "soft" as const;
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="overflow-hidden rounded-[34px] border border-white/70 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),rgba(255,250,241,0.82)_42%,rgba(245,248,255,0.88)_100%)] p-6 shadow-card backdrop-blur sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_420px] xl:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge label={question.theme} tone="gold" />
              <Badge label={`Habilidade ${question.skill}`} tone="ink" />
            </div>
            <h1 className="mt-5 max-w-5xl font-display text-4xl leading-[0.95] text-ink sm:text-5xl lg:text-6xl">
              Questão {question.examQuestionNumber}
              <span className="mx-3 hidden text-slate-300 sm:inline">—</span>
              <span className="block text-[0.78em] sm:inline">
                ENEM 2024 · {question.areaLabel}
              </span>
            </h1>

            <div className="mt-7 rounded-[28px] border border-white/70 bg-white/72 px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Dificuldade relativa na prova
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] ${difficultyTheme.chip}`}
                    >
                      {question.triMetrics.relativeDifficultyLabel}
                    </span>
                    <span className={`text-sm font-semibold ${difficultyTheme.text}`}>
                      Nível {question.triMetrics.difficultyLevel}/5 entre as 45 questões
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Escala relativa baseada no ranking empírico de dificuldade desta prova, não na
                    classificação nominal original da base.
                  </p>
                </div>

                <div className="flex gap-2">
                  {Array.from({ length: 5 }, (_, index) => {
                    const active = index < question.triMetrics.difficultyLevel;
                    return (
                      <span
                        key={index}
                        className={`h-3 w-12 rounded-full ${active ? difficultyTheme.barActive : difficultyTheme.barIdle}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <HeaderMetricCard
              label="Ranking de dificuldade"
              value={ordinalLabel(question.difficultyRank)}
              helper="Posição da questão entre as mais difíceis da prova."
            />
            <HeaderMetricCard
              label="Parâmetro A"
              value={ordinalLabel(question.triMetrics.rankA)}
              helper={`Discriminação ${question.triMetrics.a.toFixed(2)} · quanto maior, melhor separa níveis de proficiência.`}
            />
            <HeaderMetricCard
              label="Parâmetro B"
              value={ordinalLabel(question.triMetrics.rankB)}
              helper={`Dificuldade TRI ${question.triMetrics.b.toFixed(2)} · quanto maior, mais exigente o item tende a ser.`}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-[32px] border border-white/70 bg-white/80 p-4 shadow-card backdrop-blur sm:grid-cols-3 sm:p-5">
        {previousId ? (
          <Link
            href={`/questoes/${question.areaSlug}/${previousId}`}
            className="rounded-[24px] border border-slate-200 px-5 py-4 text-center text-sm font-semibold text-ink transition hover:border-clay/40 hover:text-clay"
          >
            ← Questão anterior
          </Link>
        ) : (
          <div className="rounded-[24px] border border-slate-200 px-5 py-4 text-center text-sm font-semibold text-slate-400">
            ← Questão anterior
          </div>
        )}

        <Link
          href={question.areaRoute}
          className="rounded-[24px] bg-ink px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-[#09131f]"
        >
          Voltar para prova
        </Link>

        {nextId ? (
          <Link
            href={`/questoes/${question.areaSlug}/${nextId}`}
            className="rounded-[24px] border border-slate-200 px-5 py-4 text-center text-sm font-semibold text-ink transition hover:border-clay/40 hover:text-clay"
          >
            Próxima questão →
          </Link>
        ) : (
          <div className="rounded-[24px] border border-slate-200 px-5 py-4 text-center text-sm font-semibold text-slate-400">
            Próxima questão →
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <QuestionImagePreview
          imageUrl={question.imageUrl}
          title={question.title}
          statement={question.statement}
          statementAssets={question.statementAssets}
          sourcePages={question.sourcePages}
          correctOption={question.correctOption}
          options={question.options}
        />

        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-card backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Leitura rápida
            </p>
            <div className="mt-4 grid gap-3">
              {analyticsHighlights.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[22px] border border-slate-200/80 bg-slate-50 px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-7 text-ink">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-card backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Comentários da questão
            </p>
            <div className="mt-4 space-y-3">
              {question.comments.map((comment, index) => (
                <article
                  key={comment}
                  className="rounded-[22px] border border-slate-200/80 bg-slate-50 px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {analyticalHeadings[index] ?? `Comentário ${index + 1}`}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{comment}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-card backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Metadados pedagógicos
            </p>
            <div className="mt-4 space-y-3">
              {metadataEntries.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[22px] border border-slate-200/80 bg-white px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-7 text-ink">{value}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <SectionShell title="Resolução" eyebrow="Explicação guiada">
        <ResolutionPanel
          resolution={question.resolution}
          latexResolution={question.latexResolution}
          examQuestionNumber={question.examQuestionNumber}
          options={question.options}
        />
      </SectionShell>

      <SectionShell title="Leitura dos dados" eyebrow="Visualização">
        <ChartsPanel
          accuracy={question.accuracy}
          topDistractor={question.topDistractor}
          correctOption={question.correctOption}
          difficultyRank={question.difficultyRank}
          optionDistribution={question.optionDistribution}
          analyticsSnapshot={question.analyticsSnapshot}
        />
      </SectionShell>

      <SectionShell title="Questões relacionadas" eyebrow="Navegação inteligente">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {question.relatedQuestions.map((related) => {
            const relatedQuestion = getAreaQuestionPageData(question.areaSlug, related.id);

            return (
            <Link
              key={`${related.id}-${related.relation}`}
              href={`/questoes/${question.areaSlug}/${related.id}`}
              className="rounded-[28px] border border-slate-200/80 bg-white p-5 transition hover:-translate-y-1 hover:border-clay/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Questão {relatedQuestion?.examQuestionNumber ?? related.id}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-ink">
                    {relatedQuestion?.theme ?? "Questão relacionada"}
                  </h3>
                </div>
                <Badge
                  label={related.relation}
                  tone={resolveRelationTone(related.relation)}
                />
              </div>
              <div className="mt-4 space-y-3">
                <p className="text-sm leading-7 text-slate-600">{related.description}</p>
                {relatedQuestion ? (
                  <div className="rounded-[22px] border border-slate-200/80 px-4 py-4 text-sm leading-6 text-slate-600">
                    <p>
                      {relatedQuestion.theme} · {relatedQuestion.subtheme}
                    </p>
                    <p>{relatedQuestion.skill}</p>
                    <p>{relatedQuestion.accuracy.toFixed(1)}% de acerto</p>
                  </div>
                ) : null}
              </div>
            </Link>
            );
          })}
        </div>
      </SectionShell>
    </main>
  );
}
