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

const relationCardToneMap: Record<
  "gold" | "clay" | "ink" | "soft",
  {
    shell: string;
    number: string;
    accent: string;
    note: string;
  }
> = {
  gold: {
    shell: "border-gold/30 bg-gradient-to-br from-[#f5f9ff] via-white to-[#edf5ff]",
    number: "bg-gold/15 text-[#4f79b0]",
    accent: "text-[#4f79b0]",
    note: "bg-[#edf5ff] text-[#4f79b0]",
  },
  clay: {
    shell: "border-clay/25 bg-gradient-to-br from-[#f2f8ff] via-white to-[#eaf3ff]",
    number: "bg-clay/12 text-clay",
    accent: "text-clay",
    note: "bg-[#eaf3ff] text-clay",
  },
  ink: {
    shell: "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-[#eef7ff]",
    number: "bg-ink text-white",
    accent: "text-sky-700",
    note: "bg-sky-100 text-sky-700",
  },
  soft: {
    shell: "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50",
    number: "bg-slate-100 text-slate-700",
    accent: "text-slate-600",
    note: "bg-slate-100 text-slate-600",
  },
};

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

function difficultyPercentile(rank: number, total = 45) {
  if (!rank || total <= 1) return 0;
  return Math.round(((total - rank) / (total - 1)) * 100);
}

function difficultyPercentileLabel(rank: number, total = 45) {
  if (!rank) return "-";
  const percentile = difficultyPercentile(rank, total);
  return `P${percentile}`;
}

function triADiscriminationScore(a: number) {
  const normalized = (Math.max(0, Math.min(a, 4)) / 4) * 1000;
  return Math.round(normalized);
}

function triBDidacticScore(b: number) {
  return Math.max(0, Math.min(1000, Math.round(b * 100 + 500)));
}

function difficultyHelperText(level: number) {
  if (level >= 5) {
    return "Está no grupo mais exigente da prova. O acerto tende a concentrar-se nas faixas mais fortes.";
  }
  if (level === 4) {
    return "É uma questão acima da média em exigência. Costuma separar melhor quem já domina o conteúdo.";
  }
  if (level === 3) {
    return "Fica no meio da prova em exigência. Ainda pede leitura atenta, mas não está entre os extremos.";
  }
  if (level === 2) {
    return "Está entre as menos exigentes da prova, com resolução mais acessível para a maioria dos alunos.";
  }
  return "Fica no grupo mais simples da prova, com menor barreira de entrada em relação às demais.";
}

function cleanRelatedDescription(description: string) {
  return description
    .replace(/^Questão\s+\d+:\s*/i, "")
    .replace(/\.$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function conciseRelatedReason(description: string, relation: string) {
  const cleaned = cleanRelatedDescription(description);
  const segments = cleaned
    .split("•")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) return relation;
  if (segments.length === 1) return segments[0];
  return segments.slice(0, 2).join(" • ");
}

function relatedQuestionTitle(relatedQuestion: ReturnType<typeof getAreaQuestionPageData>) {
  if (!relatedQuestion) return "Questão relacionada";

  return (
    relatedQuestion.officialResolution?.shortThemeTitle ??
    relatedQuestion.subtheme ??
    relatedQuestion.theme
  );
}

function rankingPosition(rank: number, total = 45) {
  if (!rank || total <= 1) return 0;
  return ((total - rank) / (total - 1)) * 100;
}

function scaledPosition(value: number, min: number, max: number) {
  if (max <= min) return 0;
  const clamped = Math.min(Math.max(value, min), max);
  return ((clamped - min) / (max - min)) * 100;
}

function ScaleMetricCard({
  label,
  valueLabel,
  position,
  helper,
  leftLabel,
  rightLabel,
  tone = "rose",
}: {
  label: string;
  valueLabel: string;
  position: number;
  helper: string;
  leftLabel: string;
  rightLabel: string;
  tone?: "rose" | "sky" | "violet";
}) {
  const toneClasses =
    tone === "sky"
      ? {
          track: "from-sky-100 via-sky-200 to-sky-500",
          dot: "bg-sky-600 ring-sky-100",
          text: "text-sky-700",
        }
      : tone === "violet"
        ? {
            track: "from-violet-100 via-violet-200 to-violet-500",
            dot: "bg-violet-600 ring-violet-100",
            text: "text-violet-700",
          }
      : {
            track: "from-emerald-200 via-amber-200 to-rose-400",
            dot: "bg-rose-500 ring-rose-100",
            text: "text-rose-700",
          };

  return (
    <article className="rounded-[24px] border border-slate-200/80 bg-white/88 px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <div className="mt-5">
        <div className="relative px-1 pb-1 pt-8">
          <div className={`h-2 rounded-full bg-gradient-to-r ${toneClasses.track}`} />
          <div
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${position}%` }}
          >
            <div className={`mb-2 whitespace-nowrap text-center text-xs font-semibold ${toneClasses.text}`}>
              {valueLabel}
            </div>
            <div className={`h-4 w-4 rounded-full ${toneClasses.dot} ring-4 shadow-sm`} />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{helper}</p>
    </article>
  );
}

export function QuestionPageView({ question }: QuestionPageViewProps) {
  const areaSlug = question.areaSlug;
  const isAnnulled = !["A", "B", "C", "D", "E"].includes(question.correctOption);
  const previousId = question.id > 1 ? question.id - 1 : null;
  const nextId = question.id < 45 ? question.id + 1 : null;
  const difficultyTheme = getDifficultyTheme(question.triMetrics.difficultyLevel);
  const contentTitle =
    question.officialResolution?.shortThemeTitle ??
    question.subtheme ??
    question.theme;
  const totalQuestions = 45;
  const difficultyRankPosition = rankingPosition(question.difficultyRank);
  const difficultyPercentileValue = difficultyPercentile(question.difficultyRank, totalQuestions);
  const discriminationScore = triADiscriminationScore(question.triMetrics.a);
  const discriminationPosition = scaledPosition(discriminationScore, 0, 1000);
  const triDifficultyScore = triBDidacticScore(question.triMetrics.b);
  const triDifficultyPosition = scaledPosition(triDifficultyScore, 0, 1000);
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
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-4 lg:py-12 xl:px-5">
      <section className="overflow-hidden rounded-[34px] border border-white/70 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(245,249,255,0.88)_42%,rgba(232,242,255,0.92)_100%)] p-6 shadow-card backdrop-blur sm:p-8">
        <div className="mb-5 flex justify-end">
          <Link
            href={question.areaRoute}
            className="inline-flex items-center rounded-full border border-[#d6e6ff] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-clay/50 hover:text-clay"
          >
            ← Voltar para prova
          </Link>
        </div>

        <details className="group">
          <summary className="flex list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
            <h1 className="max-w-5xl font-display text-4xl leading-[0.95] text-ink sm:text-5xl lg:text-6xl">
              Questão {question.examQuestionNumber}
              <span className="mx-3 hidden text-slate-300 sm:inline">—</span>
              <span className="block text-[0.78em] sm:inline">
                ENEM {question.year} · {question.areaLabel}
              </span>
            </h1>
            <span className="mt-2 inline-flex shrink-0 rounded-full border border-[#d6e6ff] bg-white/85 px-4 py-2 text-sm font-semibold text-[#4f79b0] shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition hover:border-clay/40 hover:text-clay">
              <span className="group-open:hidden">Mostrar painel</span>
              <span className="hidden group-open:inline">Fechar painel</span>
            </span>
          </summary>

          <div className="mt-6 space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(460px,1.05fr)] xl:items-start">
              <div>
                <p className="max-w-4xl text-lg font-medium leading-8 text-slate-600 sm:text-xl">
                  {contentTitle}
                </p>

                <div className="mt-5 rounded-[24px] border border-white/70 bg-white/72 px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Dificuldade relativa na prova
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] ${difficultyTheme.chip}`}
                        >
                          {question.triMetrics.relativeDifficultyLabel}
                        </span>
                        <span className={`text-xs font-semibold ${difficultyTheme.text}`}>
                          Nível {question.triMetrics.difficultyLevel}/5 entre as 45 questões
                        </span>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                        {difficultyHelperText(question.triMetrics.difficultyLevel)}
                      </p>
                    </div>

                    <div className="flex gap-2 lg:self-start">
                      {Array.from({ length: 5 }, (_, index) => {
                        const active = index < question.triMetrics.difficultyLevel;
                        return (
                          <span
                            key={index}
                            className={`h-2.5 w-10 rounded-full ${active ? difficultyTheme.barActive : difficultyTheme.barIdle}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200/80 bg-white/88 px-6 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge label={`Habilidade ${question.skill}`} tone="ink" />
                </div>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {question.skillDescription || "Descrição da habilidade em atualização"}
                </p>
                {question.competenceDescription ? (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {question.competenceDescription}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <ScaleMetricCard
                label="Ranking de dificuldade baseado em acertos"
                valueLabel={difficultyPercentileLabel(question.difficultyRank, totalQuestions)}
                position={difficultyRankPosition}
                leftLabel="Mais fácil"
                rightLabel="Mais difícil"
                helper={`Percentil de exigência dentro desta prova. Esta questão fica acima de ${difficultyPercentileValue}% das demais em dificuldade observada por acertos.`}
              />
              <ScaleMetricCard
                label="Discriminação"
                valueLabel={`${discriminationScore}`}
                position={discriminationPosition}
                leftLabel="Separa menos"
                rightLabel="Separa mais"
                tone="sky"
                helper="Escala normalizada de 0 a 1000 a partir do parâmetro A. Quanto mais à direita, mais o item ajuda a separar alunos de desempenhos diferentes e mais diagnóstico ele tende a trazer para a proficiência."
              />
              <ScaleMetricCard
                label="Dificuldade TRI"
                valueLabel={`${triDifficultyScore}`}
                position={triDifficultyPosition}
                leftLabel="Menor"
                rightLabel="Maior"
                tone="violet"
                helper="Essa régua traduz o parâmetro B para uma escala mais intuitiva. Valores mais altos indicam que o item costuma exigir maior proficiência para ser acertado dentro da lógica TRI."
              />
            </div>
          </div>
        </details>
      </section>

      <section className="grid gap-4 rounded-[32px] border border-white/70 bg-white/80 p-4 shadow-card backdrop-blur sm:grid-cols-2 sm:p-5">
        {previousId ? (
          <Link
            href={`/questoes/${question.year}/${question.areaSlug}/${previousId}`}
            className="rounded-[24px] border border-slate-200 px-5 py-4 text-center text-sm font-semibold text-ink transition hover:border-clay/40 hover:text-clay"
          >
            ← Questão anterior
          </Link>
        ) : (
          <div className="rounded-[24px] border border-slate-200 px-5 py-4 text-center text-sm font-semibold text-slate-400">
            ← Questão anterior
          </div>
        )}

        {nextId ? (
          <Link
            href={`/questoes/${question.year}/${question.areaSlug}/${nextId}`}
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

      <section className="mx-auto w-full max-w-[1080px]">
        <QuestionImagePreview
          imageUrl={question.imageUrl}
          title={question.title}
          statement={question.statement}
          statementAssets={question.statementAssets}
          sourcePages={question.sourcePages}
          correctOption={question.correctOption}
          options={question.options}
        />
      </section>

      <SectionShell title="Resolução" eyebrow="Explicação guiada">
        <ResolutionPanel
          resolution={question.resolution}
          officialResolution={question.officialResolution}
          latexResolution={question.latexResolution}
          examQuestionNumber={question.examQuestionNumber}
          options={question.options}
          topDistractor={question.topDistractor}
        />
      </SectionShell>

      <SectionShell title="Leitura dos dados" eyebrow="Visualização">
        {isAnnulled ? (
          <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-6">
            <p className="text-lg font-semibold text-amber-900">Questão anulada</p>
            <p className="mt-3 text-base leading-8 text-slate-700">
              Esta questão aparece como anulada na base analítica, então o site não exibe leitura de
              acerto, resposta correta ou gráficos como se fossem dados confiáveis do item.
            </p>
          </div>
        ) : (
          <ChartsPanel
            areaSlug={question.areaSlug}
            accuracy={question.accuracy}
            topDistractor={question.topDistractor}
            correctOption={question.correctOption}
            difficultyRank={question.difficultyRank}
            optionDistribution={question.optionDistribution}
            topPerformerDistribution={question.topPerformerDistribution}
            analyticsSnapshot={question.analyticsSnapshot}
          />
        )}
      </SectionShell>

      <SectionShell title="Questões relacionadas" eyebrow="Navegação inteligente">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {question.relatedQuestions.map((related) => {
            const relatedQuestion = getAreaQuestionPageData(question.year, question.areaSlug, related.id);
            const tone = resolveRelationTone(related.relation);
            const toneClasses = relationCardToneMap[tone];
            const reason = conciseRelatedReason(related.description, related.relation);
            const title = relatedQuestionTitle(relatedQuestion);

            return (
              <Link
                key={`${related.id}-${related.relation}`}
                href={`/questoes/${question.year}/${question.areaSlug}/${related.id}`}
                className={`group flex min-h-[250px] flex-col rounded-[24px] border p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_20px_38px_rgba(15,23,42,0.08)] ${toneClasses.shell}`}
              >
                <div className="flex min-w-0 flex-col gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-[18px] px-2.5 text-sm font-semibold ${toneClasses.number}`}
                    >
                      {relatedQuestion?.examQuestionNumber ?? related.id}
                    </span>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Questão relacionada
                    </p>
                  </div>

                  <div className="w-full">
                    <div className="max-w-full overflow-hidden">
                      <Badge label={related.relation} tone={tone} />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold leading-snug text-ink sm:text-[1.45rem]">
                      {title}
                    </h3>
                  </div>
                </div>

                <div className="mt-4 rounded-[20px] border border-white/80 bg-white/75 px-3.5 py-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Por que ela é parecida
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{reason}</p>
                </div>

                <div className="mt-auto pt-3">
                  {relatedQuestion ? (
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses.note}`}
                      >
                        {relatedQuestion.skill}
                      </span>
                      <span className="inline-flex rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {relatedQuestion.accuracy.toFixed(1)}% de acerto
                      </span>
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
