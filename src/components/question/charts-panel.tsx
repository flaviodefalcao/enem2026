"use client";

import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartsPanelProps = {
  accuracy: number;
  topDistractor: string;
  correctOption: string;
  difficultyRank: number;
  optionDistribution: Record<"A" | "B" | "C" | "D" | "E", number>;
  analyticsSnapshot: {
    sampleSize: number;
    averageScore: number;
    informationLabel: string;
    rankDiscrimination: number;
    rankInformation: number;
    discriminationGapLt600To900: number;
    discriminationGap700To900: number;
    dominantDistractorShare: number;
    itemInformationProxy: number;
    difficultyBand: string;
    reviewPriorityLabel: string;
    qualityLabel: string;
    discriminationLabel: string;
    bucketSnapshot: Array<{ faixa: string; acerto: number; n: number }>;
    distractorByBucket: Array<{ faixa: string; distractor: string; pct: number; n: number }>;
    empiricalCurve: Array<{ faixa: string; acerto: number; n: number; notaMedia: number }>;
    weakestBucket: { faixa: string; acerto: number; n: number } | null;
    strongestBucket: { faixa: string; acerto: number; n: number } | null;
  };
};

export function ChartsPanel({
  accuracy,
  topDistractor,
  correctOption,
  difficultyRank,
  optionDistribution,
  analyticsSnapshot,
}: ChartsPanelProps) {
  const distributionData = Object.entries(optionDistribution).map(
    ([option, value]) => ({
      option,
      value,
    }),
  );

  const topPerformerDistribution = [
    { option: "A", value: 11.2 },
    { option: "B", value: 14.8 },
    { option: "C", value: 49.6 },
    { option: "D", value: 13.1 },
    { option: "E", value: 11.3 },
  ];

  const summaryCards = [
    {
      label: "Acerto geral",
      value: `${accuracy.toFixed(1)}%`,
      detail: `${analyticsSnapshot.sampleSize.toLocaleString("pt-BR")} respostas`,
    },
    {
      label: "Gap topo vs base",
      value: `${analyticsSnapshot.discriminationGapLt600To900.toFixed(1)} p.p.`,
      detail: "900+ vs <600",
    },
    {
      label: "Distrator dominante",
      value: `${topDistractor} · ${analyticsSnapshot.dominantDistractorShare.toFixed(1)}%`,
      detail: "Entre os erros",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-[24px] border border-slate-200/80 bg-white p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {card.label}
            </p>
            <div className="mt-3 text-3xl font-semibold text-ink">{card.value}</div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
      <article className="rounded-[28px] border border-slate-200/80 bg-white p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Gráfico 1
          </p>
          <h3 className="mt-2 text-xl font-semibold text-ink">
            Distribuição por alternativa
          </h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5edf5" />
              <XAxis dataKey="option" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                cursor={{ fill: "rgba(217, 108, 63, 0.08)" }}
                formatter={(value) => [`${value}%`, "Marcadores"]}
              />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {distributionData.map((entry) => (
                  <Cell
                    key={entry.option}
                    fill={entry.option === correctOption ? "#17966b" : "#d96c3f"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-[28px] border border-slate-200/80 bg-white p-5">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Gráfico 2
          </p>
          <h3 className="mt-2 text-xl font-semibold text-ink">
            Acerto por faixa de proficiência
          </h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsSnapshot.bucketSnapshot}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5edf5" />
              <XAxis dataKey="faixa" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} unit="%" />
              <Tooltip formatter={(value) => [`${value}%`, "Acerto"]} />
              <Bar dataKey="acerto" radius={[10, 10, 0, 0]} fill="#102033" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-[28px] border border-slate-200/80 bg-white p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Gráfico 3
          </p>
          <h3 className="mt-2 text-xl font-semibold text-ink">
            Alternativas entre alunos de maior desempenho
          </h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topPerformerDistribution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5edf5" />
              <XAxis dataKey="option" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} unit="%" />
              <Tooltip formatter={(value) => [`${value}%`, "Marcadores"]} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {topPerformerDistribution.map((entry) => (
                  <Cell
                    key={entry.option}
                    fill={entry.option === correctOption ? "#17966b" : "#102033"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Mock temporário para representar como os alunos de maior desempenho distribuem suas escolhas.
        </p>
      </article>

      <article className="rounded-[28px] border border-slate-200/80 bg-white p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Resumo
          </p>
          <h3 className="mt-2 text-xl font-semibold text-ink">
            Posição e padrão de erro
          </h3>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] bg-ink p-6 text-white">
            <p className="text-sm uppercase tracking-[0.18em] text-white/60">
              Ranking de dificuldade
            </p>
            <div className="mt-3 text-6xl font-semibold leading-none">
              {difficultyRank}ª
            </div>
            <p className="mt-3 text-sm leading-7 text-white/75">
              Faixa {analyticsSnapshot.difficultyBand} · discriminação{" "}
              {analyticsSnapshot.discriminationLabel}.
            </p>
            <div className="mt-4 rounded-[18px] bg-white/10 p-4 text-sm leading-6 text-white/80">
              Revisão {analyticsSnapshot.reviewPriorityLabel} · qualidade{" "}
              {analyticsSnapshot.qualityLabel}.
            </div>
          </div>

          <div className="space-y-3 rounded-[24px] border border-slate-200/80 bg-slate-50 p-4">
            {analyticsSnapshot.distractorByBucket.slice(0, 3).map((entry) => (
              <div
                key={entry.faixa}
                className="rounded-[18px] border border-white bg-white px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {entry.faixa}
                  </p>
                  <p className="text-sm font-semibold text-ink">
                    {entry.distractor} · {entry.pct.toFixed(1)}%
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Distrator dominante nesta faixa de desempenho.
                </p>
              </div>
            ))}
          </div>
        </div>
      </article>
      </div>
    </div>
  );
}
