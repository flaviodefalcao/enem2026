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

const PRIMARY_CTA_HREF =
  process.env.NEXT_PUBLIC_LEADGEN_PRIMARY_URL ?? "https://olastro.com.br/chapeu-do-mago/";
const SECONDARY_CTA_HREF = process.env.NEXT_PUBLIC_LEADGEN_SECONDARY_URL ?? "/filtrar-questoes";

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

function MageLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#0f1732] text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)]">
        <svg viewBox="0 0 64 64" className="h-8 w-8 fill-current" aria-hidden="true">
          <path d="M30 8 14 32h10l-8 16 18-12h8L30 8Z" />
          <path d="M40 10 32 26h6l-4 9 10-7h6L40 10Z" opacity="0.85" />
        </svg>
      </div>
      <div>
        <p className="font-display text-xl leading-none text-[#0f1732]">chapéu</p>
        <p className="-mt-0.5 font-display text-xl leading-none text-[#0f1732]">do mago</p>
      </div>
    </div>
  );
}

function MarketingBanner({
  title,
  subtitle,
  buttonLabel,
}: {
  title: string;
  subtitle: string;
  buttonLabel: string;
}) {
  return (
    <div className="rounded-[28px] border border-[#d9e6f5] bg-[linear-gradient(135deg,#102033_0%,#18304a_52%,#21476a_100%)] p-6 text-white shadow-[0_24px_48px_rgba(15,23,42,0.16)]">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <h2 className="text-3xl font-semibold leading-tight">{title}</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-sky-50/86">{subtitle}</p>
        </div>
        <div className="flex">
          <Link
            href={PRIMARY_CTA_HREF}
            className="inline-flex min-w-[260px] items-center justify-center rounded-full bg-[#f4c96c] px-8 py-4 text-base font-semibold text-[#102033] transition hover:brightness-95"
          >
            {buttonLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

function questionSeoTitle(question: AreaQuestionPageData) {
  return `Questão ${question.examQuestionNumber} do ENEM ${question.year} de ${question.areaLabel}`;
}

function buildQuestionJsonLd(question: AreaQuestionPageData) {
  const title = questionSeoTitle(question);
  const description =
    question.officialResolution?.whatTheQuestionAsks ??
    question.resolution.whatItAsks;

  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Provas",
          item: "/prova",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: `ENEM ${question.year}`,
          item: question.yearRoute,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: question.areaLabel,
          item: question.areaRoute,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: title,
          item: question.questionRoute,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `${title}: resolução comentada`,
      description,
      inLanguage: "pt-BR",
      mainEntityOfPage: question.questionRoute,
      about: [
        question.theme,
        question.subtheme,
        `Habilidade ${question.skill}`,
      ].filter(Boolean),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `O que a questão ${question.examQuestionNumber} do ENEM ${question.year} cobra?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: question.officialResolution?.whatTheQuestionAsks ?? question.resolution.whatItAsks,
          },
        },
        {
          "@type": "Question",
          name: `Qual é o principal erro na questão ${question.examQuestionNumber}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: question.officialResolution?.puloDoGato ?? question.resolution.whyErrorsHappen,
          },
        },
      ],
    },
  ];
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
  const seoTitle = questionSeoTitle(question);
  const jsonLd = buildQuestionJsonLd(question);
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="rounded-[30px] border border-white/70 bg-white/85 px-5 py-4 shadow-card backdrop-blur sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <MageLogo />
          <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600">
            <Link className="rounded-full px-4 py-2 transition hover:bg-[#eef5ff] hover:text-[#0f1732]" href="/">
              Home
            </Link>
            <Link className="rounded-full px-4 py-2 transition hover:bg-[#eef5ff] hover:text-[#0f1732]" href="/filtrar-questoes">
              Questões
            </Link>
            <Link className="rounded-full px-4 py-2 transition hover:bg-[#eef5ff] hover:text-[#0f1732]" href="/prova">
              Provas
            </Link>
            <Link className="rounded-full px-4 py-2 transition hover:bg-[#eef5ff] hover:text-[#0f1732]" href="/metricas-estrategicas">
              Estratégia
            </Link>
          </nav>
        </div>
      </header>

      <section className="overflow-hidden rounded-[34px] border border-white/70 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(245,249,255,0.88)_42%,rgba(232,242,255,0.92)_100%)] p-6 shadow-card backdrop-blur sm:p-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
            {seoTitle}
          </h1>
          <p className="mt-3 text-lg leading-8 text-slate-600 sm:text-xl">
            {contentTitle}
          </p>
        </div>
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

      <MarketingBanner
        title="Quer começar seu estudo personalizado?"
        subtitle="A plataforma organiza seu estudo com questões parecidas, resoluções comentadas, análises de desempenho e uma trilha guiada para você evoluir com mais clareza."
        buttonLabel="Começar agora"
      />

      <section className="space-y-4 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-card backdrop-blur sm:p-6">
        <details className="group rounded-[26px] border border-[#dfeafb] bg-white/85 p-4 sm:p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f79b0]">
                Resolução
              </p>
              <h2 className="mt-1 font-display text-2xl text-ink">
                Abrir resolução comentada
              </h2>
            </div>
            <span className="inline-flex rounded-full border border-[#d6e6ff] bg-white px-4 py-2 text-sm font-semibold text-[#4f79b0]">
              <span className="group-open:hidden">Mostrar</span>
              <span className="hidden group-open:inline">Ocultar</span>
            </span>
          </summary>
          <div className="mt-5">
            <ResolutionPanel
              resolution={question.resolution}
              officialResolution={question.officialResolution}
              latexResolution={question.latexResolution}
              examQuestionNumber={question.examQuestionNumber}
              options={question.options}
              topDistractor={question.topDistractor}
            />
          </div>
        </details>

        <MarketingBanner
          title="Gostou dessa resolução?"
          subtitle="Acesse a plataforma completa para continuar com simulados, resoluções comentadas, análise das questões e um estudo mais bem direcionado."
          buttonLabel="Acessar plataforma completa"
        />

        <details className="group rounded-[26px] border border-[#dfeafb] bg-white/85 p-4 sm:p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Análise
              </p>
              <h2 className="mt-1 font-display text-xl text-ink sm:text-2xl">
                Análise da questão
              </h2>
            </div>
            <span className="inline-flex rounded-full border border-[#d6e6ff] bg-white px-4 py-2 text-sm font-semibold text-[#4f79b0]">
              <span className="group-open:hidden">Mostrar</span>
              <span className="hidden group-open:inline">Ocultar</span>
            </span>
          </summary>

          <div className="mt-5 space-y-6">
            <section>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-[22px] border border-slate-200/80 bg-white px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Dificuldade relativa
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${difficultyTheme.chip}`}>
                      {question.triMetrics.relativeDifficultyLabel}
                    </span>
                    <span className={`text-[11px] font-semibold ${difficultyTheme.text}`}>
                      Nível {question.triMetrics.difficultyLevel}/5
                    </span>
                  </div>
                  <div className="mt-4 flex gap-1.5">
                    {Array.from({ length: 5 }, (_, index) => {
                      const active = index < question.triMetrics.difficultyLevel;
                      return (
                        <span
                          key={index}
                          className={`h-2 w-full rounded-full ${active ? difficultyTheme.barActive : difficultyTheme.barIdle}`}
                        />
                      );
                    })}
                  </div>
                </article>

                <article className="rounded-[22px] border border-slate-200/80 bg-white px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Ranking por acerto
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-ink">
                    {difficultyPercentileLabel(question.difficultyRank, totalQuestions)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Percentil de exigência dentro da prova.
                  </p>
                </article>

                <article className="rounded-[22px] border border-slate-200/80 bg-white px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Discriminação
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-ink">{discriminationScore}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Quanto a questão separa desempenhos diferentes.
                  </p>
                </article>

                <article className="rounded-[22px] border border-slate-200/80 bg-white px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Dificuldade TRI
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-ink">{triDifficultyScore}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Escala didática derivada do parâmetro B.
                  </p>
                </article>
              </div>
            </section>

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
          </div>
        </details>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-card backdrop-blur sm:p-8">
        <div className="rounded-[28px] border border-[#17314f]/12 bg-[linear-gradient(135deg,#102033_0%,#17314f_55%,#21476a_100%)] p-6 text-white shadow-[0_24px_48px_rgba(15,23,42,0.16)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100/75">
            Oferta em destaque
          </p>
          <h3 className="mt-3 max-w-3xl text-2xl font-semibold leading-tight text-white">
            Gostou da resolução? Faça simulados com resolução completa e análise das questões.
          </h3>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-50/86">
            Continue estudando com um plano guiado, comentários claros e simulados pensados para transformar prática em resultado. Tudo isso por um valor promocional, por menos de R$ 5 por semana.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href={PRIMARY_CTA_HREF}
              className="inline-flex items-center justify-center rounded-full bg-[#f4c96c] px-5 py-3 text-sm font-semibold text-[#102033] transition hover:brightness-95"
            >
              Quero conhecer os simulados
            </Link>
            <Link
              href={SECONDARY_CTA_HREF}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Ver mais questões parecidas
            </Link>
          </div>
        </div>
      </section>

      <SectionShell title="Questões relacionadas" eyebrow="Mais para treinar">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href={PRIMARY_CTA_HREF}
            className="group flex min-h-[174px] flex-col justify-between rounded-[22px] border border-[#102033]/10 bg-[linear-gradient(135deg,#102033_0%,#17314f_55%,#4f79b0_100%)] p-4 text-white shadow-[0_14px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_38px_rgba(15,23,42,0.12)]"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                Aprofundar
              </p>
              <h3 className="mt-3 text-lg font-semibold leading-snug">
                Travou em mais de uma?
              </h3>
              <p className="mt-2 text-sm leading-5 text-white/80">
                Entre para a trilha guiada e avance com método, revisão e estratégia.
              </p>
            </div>
            <span className="inline-flex items-center text-sm font-semibold text-white">
              Ver a oferta principal
            </span>
          </Link>
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
                className={`group flex min-h-[174px] flex-col rounded-[22px] border p-3 shadow-[0_14px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_20px_38px_rgba(15,23,42,0.08)] ${toneClasses.shell}`}
              >
                <div className="flex min-w-0 flex-col gap-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-[16px] px-2 text-sm font-semibold ${toneClasses.number}`}
                    >
                      {relatedQuestion?.examQuestionNumber ?? related.id}
                    </span>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Questão relacionada
                    </p>
                  </div>

                  <div className="w-full">
                    <div className="max-w-full overflow-hidden">
                      <Badge label={related.relation} tone={tone} />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base font-semibold leading-snug text-ink sm:text-[1.05rem]">
                      {title}
                    </h3>
                  </div>
                </div>

                <div className="mt-2.5 rounded-[16px] border border-white/80 bg-white/75 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Por que ela é parecida
                  </p>
                  <p className="mt-1.5 text-[12px] leading-5 text-slate-700">{reason}</p>
                </div>

                <div className="mt-auto pt-2.5">
                  {relatedQuestion ? (
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${toneClasses.note}`}
                      >
                        {relatedQuestion.skill}
                      </span>
                      <span className="inline-flex rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-slate-600">
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
