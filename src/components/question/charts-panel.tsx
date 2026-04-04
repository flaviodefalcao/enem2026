"use client";

import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AxisTickProps = {
  x?: number;
  y?: number;
  payload?: {
    value: string;
  };
};

function CompactRangeTick({ x = 0, y = 0, payload }: AxisTickProps) {
  const value = payload?.value ?? "";
  const [start, end] = value.split("–");

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={14}
        textAnchor="end"
        fill="#6b7280"
        fontSize={11}
        fontWeight={500}
        transform="rotate(-18)"
      >
        <tspan x={0} dy={0}>{start}</tspan>
        {end ? <tspan x={0} dy={12}>-{end}</tspan> : null}
      </text>
    </g>
  );
}

type ChartsPanelProps = {
  areaSlug: "linguagens" | "ciencias-humanas" | "ciencias-natureza" | "matematica";
  accuracy: number;
  topDistractor: string;
  correctOption: string;
  difficultyRank: number;
  optionDistribution: Record<"A" | "B" | "C" | "D" | "E", number>;
  topPerformerDistribution: Array<{ option: "A" | "B" | "C" | "D" | "E"; value: number }>;
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
    topPerformerGroupLabel?: string;
    topPerformerGroupDescription?: string;
    topPerformerGroupSampleSize?: number;
  };
};

export function ChartsPanel({
  areaSlug,
  accuracy,
  topDistractor,
  correctOption,
  difficultyRank,
  optionDistribution,
  topPerformerDistribution,
  analyticsSnapshot,
}: ChartsPanelProps) {
  const totalQuestions = 45;
  const distributionData = Object.entries(optionDistribution).map(
    ([option, value]) => ({
      option,
      value,
    }),
  );

  const areaCurveLimit =
    areaSlug === "linguagens"
      ? 800
      : areaSlug === "ciencias-humanas"
        ? 850
        : areaSlug === "ciencias-natureza"
          ? 900
          : 1000;

  const parseUpperBound = (faixa: string) => {
    const match = faixa.match(/(\d+)\D+(\d+)/);
    if (!match) return null;
    return Number(match[2]);
  };

  const fullCurveData = analyticsSnapshot.empiricalCurve
    .filter((entry) => entry.n > 0)
    .map((entry) => ({
      faixa: entry.faixa.replace("[", "").replace(")", "").replace(", ", "–"),
      acerto: Number(entry.acerto.toFixed(1)),
      n: entry.n,
      notaMedia: entry.notaMedia,
    }));

  const curveData = fullCurveData.filter((entry) => {
    const upperBound = parseUpperBound(entry.faixa);
    return upperBound === null ? true : upperBound <= areaCurveLimit;
  });

  const top800Curve = curveData.filter((entry) => entry.notaMedia >= 800);
  const baseBelow800Curve = curveData.filter((entry) => entry.notaMedia < 800);
  const top800GroupSize = top800Curve.reduce((sum, entry) => sum + entry.n, 0);

  const weightedAverage = (entries: typeof curveData) => {
    const totalN = entries.reduce((sum, entry) => sum + entry.n, 0);
    if (!totalN) return 0;
    return (
      entries.reduce((sum, entry) => sum + entry.acerto * entry.n, 0) / totalN
    );
  };

  const top800Accuracy = weightedAverage(top800Curve);
  const below800Accuracy = weightedAverage(baseBelow800Curve);
  const topVsBaseGap =
    top800Curve.length > 0 && baseBelow800Curve.length > 0
      ? Number((top800Accuracy - below800Accuracy).toFixed(1))
      : Number(analyticsSnapshot.discriminationGapLt600To900.toFixed(1));
  const gapPercentile = totalQuestions > 1
    ? Math.round(((totalQuestions - analyticsSnapshot.rankDiscrimination) / (totalQuestions - 1)) * 100)
    : 0;

  const topPerformerTotal = topPerformerDistribution.reduce((sum, entry) => sum + entry.value, 0);
  const topPerformerGroupLabel = analyticsSnapshot.topPerformerGroupLabel ?? "grupo forte";
  const topPerformerGroupDescription =
    analyticsSnapshot.topPerformerGroupDescription ?? "alunos do grupo forte da área";
  const topPerformerGroupSampleSize =
    analyticsSnapshot.topPerformerGroupSampleSize ?? top800GroupSize;
  const normalizedTopPerformerDistribution =
    topPerformerTotal > 0
      ? topPerformerDistribution.map((entry) => ({
          ...entry,
          value: Number(((entry.value / topPerformerTotal) * 100).toFixed(1)),
        }))
      : topPerformerDistribution;

  const compactDistractorBuckets = analyticsSnapshot.distractorByBucket
    .filter((entry) => {
      const upperBound = parseUpperBound(entry.faixa.replace(", ", "–"));
      return upperBound === null ? true : upperBound <= areaCurveLimit;
    })
    .slice(0, 3);

  const summaryCards = [
    {
      label: "Acerto geral",
      value: `${accuracy.toFixed(1)}%`,
      detail: `${analyticsSnapshot.sampleSize.toLocaleString("pt-BR")} respostas`,
    },
    {
      label: "Gap topo vs base",
      value: `${gapPercentile}`,
      detail:
        `Percentil de discriminação da questão. O gap bruto foi de ${topVsBaseGap.toFixed(1)} p.p. entre alunos com média geral 800+ e o grupo abaixo de 800.`,
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
            Taxa de acerto por faixa de nota
          </h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curveData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5edf5" />
              <XAxis
                dataKey="faixa"
                axisLine={false}
                tickLine={false}
                interval={0}
                height={78}
                tick={<CompactRangeTick />}
              />
              <YAxis axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                formatter={(value, _name, item) => [
                  `${value}%`,
                  `Acerto (${item?.payload?.n?.toLocaleString?.("pt-BR") ?? item?.payload?.n} respostas)`,
                ]}
              />
              <Line
                type="monotone"
                dataKey="acerto"
                stroke={areaSlug === "matematica" ? "#17966b" : areaSlug === "linguagens" ? "#35507a" : "#8e4f40"}
                strokeWidth={3}
                dot={{ r: 4, fill: "#102033" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 rounded-[18px] border border-slate-200/80 bg-slate-50 px-4 py-3">
          <p className="text-[13px] leading-5 text-slate-600">
            Mostra se o acerto sobe de forma consistente conforme cresce a nota.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            <span>Média observada da questão: {analyticsSnapshot.averageScore.toFixed(0)}</span>
            <span>•</span>
            <span>Faixas com dados reais: {curveData.length}</span>
            <span>•</span>
            <span>Escala considerada até {areaCurveLimit}</span>
          </div>
        </div>
      </article>

      <article className="rounded-[28px] border border-slate-200/80 bg-white p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Gráfico 3
          </p>
          <h3 className="mt-2 text-xl font-semibold text-ink">
            Distribuição das alternativas em {topPerformerGroupLabel}
          </h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={normalizedTopPerformerDistribution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5edf5" />
              <XAxis dataKey="option" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} unit="%" />
              <Tooltip formatter={(value) => [`${value}%`, "Marcadores"]} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {normalizedTopPerformerDistribution.map((entry) => (
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
          Mostra como ficaram distribuídas as alternativas marcadas entre {topPerformerGroupDescription}. Os percentuais foram normalizados entre A-E para facilitar a comparação.
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Grupo {topPerformerGroupLabel}: {topPerformerGroupSampleSize.toLocaleString("pt-BR")} alunos
          {topPerformerGroupSampleSize < 2000
            ? " · leitura com mais cautela por ser uma amostra menor."
            : ""}
        </p>
      </article>

      <article className="rounded-[28px] border border-slate-200/80 bg-white p-5">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Leitura por faixa
          </p>
          <h3 className="mt-2 text-xl font-semibold text-ink">
            Distrator dominante por faixa
          </h3>
        </div>
        <div className="space-y-2 rounded-[20px] border border-slate-200/80 bg-slate-50 p-3">
          {compactDistractorBuckets.map((entry) => (
              <div
                key={entry.faixa}
                className="rounded-[16px] border border-white bg-white px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {entry.faixa.replace("[", "").replace(")", "").replace(", ", "–")}
                  </p>
                  <p className="text-sm font-semibold text-ink">
                    {entry.distractor} · {entry.pct.toFixed(1)}%
                  </p>
                </div>
                <p className="mt-1.5 text-[13px] leading-5 text-slate-600">
                  Alternativa que mais reteve os erros nessa faixa.
                </p>
              </div>
            ))}
        </div>
      </article>
      </div>
    </div>
  );
}
