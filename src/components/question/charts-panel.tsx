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
  const distributionData = Object.entries(optionDistribution).map(
    ([option, value]) => ({
      option,
      value,
    }),
  );

  const curveData = analyticsSnapshot.empiricalCurve
    .filter((entry) => entry.n > 0)
    .map((entry) => ({
      faixa: entry.faixa.replace("[", "").replace(")", "").replace(", ", "–"),
      acerto: Number(entry.acerto.toFixed(1)),
      n: entry.n,
      notaMedia: entry.notaMedia,
    }));

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

  const topPerformerTotal = topPerformerDistribution.reduce((sum, entry) => sum + entry.value, 0);
  const normalizedTopPerformerDistribution =
    topPerformerTotal > 0
      ? topPerformerDistribution.map((entry) => ({
          ...entry,
          value: Number(((entry.value / topPerformerTotal) * 100).toFixed(1)),
        }))
      : topPerformerDistribution;

  const summaryCards = [
    {
      label: "Acerto geral",
      value: `${accuracy.toFixed(1)}%`,
      detail: `${analyticsSnapshot.sampleSize.toLocaleString("pt-BR")} respostas`,
    },
    {
      label: "Gap topo vs base",
      value: `${topVsBaseGap.toFixed(1)} p.p.`,
      detail:
        "Diferença entre o acerto do grupo com média geral 800+ e o grupo abaixo de 800. Quanto maior o gap, mais a questão separa topo e base.",
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
              <XAxis dataKey="faixa" axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={56} />
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
        <div className="mt-4 rounded-[20px] border border-slate-200/80 bg-slate-50 px-4 py-4">
          <p className="text-sm leading-6 text-slate-600">
            A curva mostra como a taxa de acerto cresce conforme sobe a faixa de nota. Isso ajuda a ver se a questão acompanha bem a progressão de desempenho ao longo da distribuição.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
            <span>Média observada da questão: {analyticsSnapshot.averageScore.toFixed(0)}</span>
            <span>•</span>
            <span>Faixas com dados reais: {curveData.length}</span>
          </div>
        </div>
      </article>

      <article className="rounded-[28px] border border-slate-200/80 bg-white p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Gráfico 3
          </p>
          <h3 className="mt-2 text-xl font-semibold text-ink">
            Distribuição das alternativas no grupo 800+
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
          Mostra como ficaram distribuídas as alternativas marcadas entre alunos com média geral acima de 800. Os percentuais foram normalizados entre A-E para facilitar a comparação.
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Grupo 800+: {top800GroupSize.toLocaleString("pt-BR")} alunos
          {top800GroupSize < 2000 ? " · leitura com mais cautela por ser uma amostra menor." : ""}
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
