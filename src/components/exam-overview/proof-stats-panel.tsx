"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DistributionBucket = {
  faixa: string;
  n: number;
  share: number;
};

type AccuracyCurvePoint = {
  faixa: string;
  n: number;
  mediaAcertos: number;
  minAcertos: number;
  maxAcertos: number;
  stdAcertos: number;
  mediaNota: number;
};

type ProofStatsPanelProps = {
  sampleSize: number;
  generalScoreDistribution: DistributionBucket[];
  essayDistribution: DistributionBucket[];
  topStudents: {
    threshold: number;
    sampleSize: number;
    scoreRanges: Array<{
      label: string;
      minScore: number;
      maxScore: number;
    }>;
    accuracyRanges: Array<{
      label: string;
      minAccuracy: number;
      maxAccuracy: number;
      maxPossible: number;
    }>;
  };
  areas: Array<{
    slug: "linguagens" | "ciencias-humanas" | "ciencias-natureza" | "matematica" | "geral";
    label: string;
    questionCount: number;
    sampleSize: number;
    averageAccuracy: number;
    averageScore: number;
    accuracyVsScore: AccuracyCurvePoint[];
  }>;
};

function areaStroke(
  slug: ProofStatsPanelProps["areas"][number]["slug"],
) {
  if (slug === "linguagens") return "#2A4E7A";
  if (slug === "ciencias-humanas") return "#416899";
  if (slug === "ciencias-natureza") return "#5B83B7";
  if (slug === "matematica") return "#6AA5E8";
  return "#2A4E7A";
}

function roundedShareDomain(data: DistributionBucket[]) {
  const maxShare = data.reduce((max, entry) => Math.max(max, entry.share), 0);
  return Math.max(10, Math.ceil(maxShare / 5) * 5);
}

function buildQuestionTicks(questionCount: number) {
  if (questionCount <= 45) return [0, 15, 30, 45];
  if (questionCount <= 90) return [0, 30, 60, 90];
  return [0, 45, 90, 135, 180];
}

function compactBucketTick(label: string) {
  const [start] = label.split("–");
  return start ?? label;
}

export function ProofStatsPanel({
  sampleSize,
  generalScoreDistribution,
  essayDistribution,
  topStudents,
  areas,
}: ProofStatsPanelProps) {
  const generalDistributionMax = roundedShareDomain(generalScoreDistribution);
  const essayDistributionMax = roundedShareDomain(essayDistribution);
  const [topMode, setTopMode] = useState<"score" | "accuracy">("score");
  const [activeTopLabel, setActiveTopLabel] = useState<string>(
    topStudents.scoreRanges[0]?.label ?? topStudents.accuracyRanges[0]?.label ?? "",
  );

  const topRows = useMemo(() => {
    if (topMode === "accuracy") {
      return topStudents.accuracyRanges.map((range) => ({
        label: range.label,
        minValue: range.minAccuracy,
        maxValue: range.maxAccuracy,
        maxDomain: range.maxPossible,
        unitLabel: "acertos",
        summary: `${Math.round(range.minAccuracy)} a ${Math.round(range.maxAccuracy)} acertos`,
      }));
    }

    return topStudents.scoreRanges.map((range) => ({
      label: range.label,
      minValue: range.minScore,
      maxValue: range.maxScore,
      maxDomain: 1000,
      unitLabel: "nota",
      summary: `${range.minScore.toFixed(0)} a ${range.maxScore.toFixed(0)}`,
    }));
  }, [topMode, topStudents.accuracyRanges, topStudents.scoreRanges]);

  const activeTopRow =
    topRows.find((row) => row.label === activeTopLabel) ?? topRows[0] ?? null;

  return (
    <section className="rounded-[32px] border border-white/70 bg-white/82 p-6 shadow-card backdrop-blur sm:p-8">
      <div>
        <span className="inline-flex rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#4f79b0]">
          Visão completa
        </span>
        <h2 className="mt-4 font-display text-3xl leading-tight text-ink sm:text-4xl">
          Nota geral, redação e relação entre nota e acertos
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">
          Aqui a leitura sai do item e olha a prova inteira. A distribuição geral
          mostra onde os alunos se concentram, a redação adiciona contexto e os
          painéis por área ajudam a comparar como a nota cresce junto com o
          número de acertos.
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">
          Amostra total: {sampleSize.toLocaleString("pt-BR")} alunos
        </p>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <article className="rounded-[28px] border border-slate-200/80 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Distribuição de nota geral
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-ink">
            Média geral das cinco notas
          </h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generalScoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3edf9" />
                <XAxis
                  dataKey="faixa"
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                  tickFormatter={compactBucketTick}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  height={36}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                  domain={[0, generalDistributionMax]}
                  ticks={Array.from(
                    { length: generalDistributionMax / 5 + 1 },
                    (_, index) => index * 5,
                  )}
                />
                <Tooltip
                  formatter={(value, _name, item) => [
                    `${value}%`,
                    `${item?.payload?.n?.toLocaleString?.("pt-BR") ?? item?.payload?.n} alunos`,
                  ]}
                  labelFormatter={(label) => `Faixa ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="share"
                  stroke="#2A4E7A"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#2A4E7A" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-400">
            Eixo X em buckets de 50 pontos. O tooltip mostra a faixa completa.
          </p>
        </article>

        <article className="rounded-[28px] border border-slate-200/80 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Distribuição da redação
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-ink">
            Como a redação se espalha na prova
          </h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={essayDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3edf9" />
                <XAxis
                  dataKey="faixa"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tickFormatter={compactBucketTick}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  height={36}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                  domain={[0, essayDistributionMax]}
                  ticks={Array.from(
                    { length: essayDistributionMax / 5 + 1 },
                    (_, index) => index * 5,
                  )}
                />
                <Tooltip
                  formatter={(value, _name, item) => [
                    `${value}%`,
                    `${item?.payload?.n?.toLocaleString?.("pt-BR") ?? item?.payload?.n} alunos`,
                  ]}
                  labelFormatter={(label) => `Faixa ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="share"
                  stroke="#6AA5E8"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#6AA5E8" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-400">
            Eixo X em buckets de 100 pontos. O tooltip mostra a faixa completa.
          </p>
        </article>
      </div>

      <div className="mt-6">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Comparativo por área
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-ink">
            Número de acertos versus nota
          </h3>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            Cada painel mostra a distribuição dos acertos dentro de cada faixa
            de nota. A curva central mostra a média, e as outras duas delimitam
            o piso e o teto observados naquele grupo.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {areas.map((area) => (
            <article
              key={area.slug}
              className="rounded-[28px] border border-slate-200/80 bg-slate-50 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {area.slug === "geral" ? "Todas juntas" : "Área"}
                  </p>
                  <h4 className="mt-2 text-2xl font-semibold text-ink">{area.label}</h4>
                </div>
                <div className="rounded-[20px] border border-slate-200/80 bg-white px-4 py-3 text-right">
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    Média de nota
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-ink">
                    {area.averageScore.toFixed(0)}
                  </div>
                </div>
              </div>

              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={area.accuracyVsScore
                      .filter((entry) => entry.n > 0)
                      .map((entry) => ({
                        ...entry,
                        mediaAcertos: Math.round(entry.mediaAcertos),
                        minAcertos: Math.round(entry.minAcertos),
                        maxAcertos: Math.round(entry.maxAcertos),
                      }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3edf9" />
                    <XAxis
                      dataKey="faixa"
                      axisLine={false}
                      tickLine={false}
                      interval={1}
                      tickFormatter={compactBucketTick}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      height={36}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, area.questionCount]}
                      ticks={buildQuestionTicks(area.questionCount)}
                    />
                    <Tooltip
                      formatter={(value, name, item) => {
                        if (name === "mediaAcertos") {
                          return [
                            `${Math.round(Number(value))} acertos`,
                            `${item?.payload?.n?.toLocaleString?.("pt-BR") ?? item?.payload?.n} alunos · desvio padrão ${item?.payload?.stdAcertos?.toFixed?.(1) ?? item?.payload?.stdAcertos}`,
                          ];
                        }
                        if (name === "minAcertos") {
                          return [`${Math.round(Number(value))} acertos`, "Mínimo"];
                        }
                        if (name === "maxAcertos") {
                          return [`${Math.round(Number(value))} acertos`, "Máximo"];
                        }
                        return [String(value), String(name)];
                      }}
                      labelFormatter={(label) => `Faixa ${label}`}
                    />
                    <Legend verticalAlign="top" height={24} iconType="line" />
                    <Line
                      type="monotone"
                      dataKey="minAcertos"
                      name="Mínimo"
                      stroke="#bfd4ef"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="mediaAcertos"
                      name="Média"
                      stroke={areaStroke(area.slug)}
                      strokeWidth={3}
                      dot={{ r: 3, fill: areaStroke(area.slug) }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="maxAcertos"
                      name="Máximo"
                      stroke="#6AA5E8"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>{area.questionCount} questões</span>
                <span>•</span>
                <span>{area.sampleSize.toLocaleString("pt-BR")} alunos</span>
                <span>•</span>
                <span>{area.averageAccuracy.toFixed(1)}% de acerto médio</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Curvas de mínimo, média e máximo de acertos por bucket de nota.
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Alunos top
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-ink">
                {topMode === "score"
                  ? "Menor e maior nota entre quem fechou média geral 800+"
                  : "Faixa de acertos entre quem fechou média geral 800+"}
              </h3>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                O corte aqui é simples: alunos com média geral acima de {topStudents.threshold}.
                {topMode === "score"
                  ? " O painel mostra, em cada área e na redação, qual foi a menor nota e qual foi a maior nota observada dentro desse grupo."
                  : " O painel mostra, em cada área e no total da prova, qual foi a menor e a maior faixa de acertos observada dentro desse grupo."}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">
                Grupo top: {topStudents.sampleSize.toLocaleString("pt-BR")} alunos
              </p>
            </div>

            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setTopMode("score");
                  setActiveTopLabel(topStudents.scoreRanges[0]?.label ?? "");
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  topMode === "score"
                    ? "bg-ink text-white"
                    : "text-slate-600 hover:text-ink"
                }`}
              >
                Por nota
              </button>
              <button
                type="button"
                onClick={() => {
                  setTopMode("accuracy");
                  setActiveTopLabel(topStudents.accuracyRanges[0]?.label ?? "");
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  topMode === "accuracy"
                    ? "bg-clay text-white"
                    : "text-slate-600 hover:text-ink"
                }`}
              >
                Por acertos
              </button>
            </div>
          </div>
        </div>

        <article className="rounded-[28px] border border-slate-200/80 bg-slate-50 p-5">
          {activeTopRow ? (
            <div className="mb-5 rounded-[22px] border border-slate-200/80 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Seleção atual
              </p>
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
                <p className="text-xl font-semibold text-ink">{activeTopRow.label}</p>
                <p className="text-base font-medium text-slate-600">{activeTopRow.summary}</p>
              </div>
            </div>
          ) : null}

          <div className="space-y-5">
            {topRows.map((range) => {
              const left = `${(range.minValue / range.maxDomain) * 100}%`;
              const width = `${Math.max(((range.maxValue - range.minValue) / range.maxDomain) * 100, 1)}%`;
              const isActive = range.label === activeTopRow?.label;
              const middleTick = Math.round(range.maxDomain / 2);

              return (
                <button
                  key={range.label}
                  type="button"
                  onClick={() => setActiveTopLabel(range.label)}
                  className={`block w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-clay/30 bg-white shadow-sm"
                      : "border-transparent bg-transparent hover:border-slate-200/80 hover:bg-white/70"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <span className="text-base font-semibold text-ink">{range.label}</span>
                    <span className="text-sm text-slate-500">
                      {range.summary}
                    </span>
                  </div>
                  <div className="relative h-12 rounded-full bg-[#dbe8f8]">
                    <div
                      className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#d6e6ff] via-[#6AA5E8] to-[#2A4E7A]"
                      style={{ left, width }}
                    />
                    <div
                      className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-[#6AA5E8] shadow-sm"
                      style={{ left: `calc(${left} - 8px)` }}
                    />
                    <div
                      className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-[#2A4E7A] shadow-sm"
                      style={{ left: `calc(${(range.maxValue / range.maxDomain) * 100}% - 8px)` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-slate-400">
                    <span>0</span>
                    <span>{middleTick}</span>
                    <span>{range.maxDomain}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
}
