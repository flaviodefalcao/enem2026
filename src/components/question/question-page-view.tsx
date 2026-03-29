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

function ordinalLabel(value: number) {
  if (!value) return "-";
  return `${value}a`;
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

function ScaleMetricCard({
  label,
  rank,
  helper,
  leftLabel,
  rightLabel,
  tone = "rose",
}: {
  label: string;
  rank: number;
  helper: string;
  leftLabel: string;
  rightLabel: string;
  tone?: "rose" | "sky" | "violet";
}) {
  const position = rankingPosition(rank);
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
      <div className="mt-6">
        <div className="relative px-1 pb-1 pt-7">
          <div className={`h-2 rounded-full bg-gradient-to-r ${toneClasses.track}`} />
          <div
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${position}%` }}
          >
            <div className={`mb-2 text-center text-sm font-semibold ${toneClasses.text}`}>
              {ordinalLabel(rank)}
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
  const analyticsHighlights = isAnnulled
    ? [
        ["Status", "Questão anulada"],
        ["Gabarito", "Sem alternativa válida"],
        ["Dados", "Indicadores estatísticos não devem ser lidos como válidos"],
      ]
    : [
        [
          areaSlug === "linguagens" ? "Gap 800+ vs <600" : "Gap 900+ vs <600",
          `${question.analyticsSnapshot.discriminationGapLt600To900.toFixed(1)} p.p.`,
        ],
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
      <section className="overflow-hidden rounded-[34px] border border-white/70 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(245,249,255,0.88)_42%,rgba(232,242,255,0.92)_100%)] p-6 shadow-card backdrop-blur sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px] xl:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge label={question.theme} tone="gold" />
              <Badge label={`Habilidade ${question.skill}`} tone="ink" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                {question.skillDescription || "Descrição da habilidade em atualização"}
              </p>
              {question.competenceDescription ? (
                <span className="text-sm text-slate-400">• {question.competenceDescription}</span>
              ) : null}
            </div>
            <h1 className="mt-4 max-w-5xl font-display text-4xl leading-[0.95] text-ink sm:text-5xl lg:text-6xl">
              Questão {question.examQuestionNumber}
              <span className="mx-3 hidden text-slate-300 sm:inline">—</span>
              <span className="block text-[0.78em] sm:inline">
                ENEM {question.year} · {question.areaLabel}
              </span>
            </h1>
            <p className="mt-3 max-w-4xl text-lg font-medium leading-8 text-slate-600 sm:text-xl">
              {contentTitle}
            </p>

            <div className="mt-5 rounded-[28px] border border-white/70 bg-white/72 px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur">
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
                    {difficultyHelperText(question.triMetrics.difficultyLevel)}
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
            <ScaleMetricCard
              label="Ranking de dificuldade baseado em acertos"
              rank={question.difficultyRank}
              leftLabel="Mais fácil"
              rightLabel="Mais difícil"
              helper="A régua vai da menor exigência para a maior exigência dentro desta prova."
            />
            <ScaleMetricCard
              label="Discriminação"
              rank={question.triMetrics.rankA}
              leftLabel="Menor"
              rightLabel="Maior"
              tone="sky"
              helper={`Valor TRI ${question.triMetrics.a.toFixed(2)} · quanto mais à direita, mais o item ajuda a separar desempenhos diferentes.`}
            />
            <ScaleMetricCard
              label="Dificuldade TRI"
              rank={question.triMetrics.rankB}
              leftLabel="Menor"
              rightLabel="Maior"
              tone="violet"
              helper={`Valor TRI ${question.triMetrics.b.toFixed(2)} · quanto mais à direita, mais exigente o item tende a ser.`}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-[32px] border border-white/70 bg-white/80 p-4 shadow-card backdrop-blur sm:grid-cols-3 sm:p-5">
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

        <Link
          href={question.areaRoute}
          className="rounded-[24px] bg-ink px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-[#21436c]"
        >
          Voltar para prova
        </Link>

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
