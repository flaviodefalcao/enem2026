"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AreaSlug } from "@/data/exam-catalog";
import type { StrategicMetricsPayload } from "@/data/strategic-metrics";

type StrategicMetricsPageProps = {
  data: StrategicMetricsPayload;
};

type AreaFilter = "todas" | AreaSlug;

const areaLabels: Record<AreaSlug, string> = {
  linguagens: "Linguagens",
  "ciencias-humanas": "Ciências Humanas",
  "ciencias-natureza": "Ciências da Natureza",
  matematica: "Matemática",
};

function areaPillTone(area: AreaSlug) {
  if (area === "linguagens") return "bg-[#eef5ff] text-[#4f79b0]";
  if (area === "ciencias-humanas") return "bg-[#ecf4ff] text-[#3c6794]";
  if (area === "ciencias-natureza") return "bg-[#e9f2ff] text-[#537cac]";
  return "bg-[#e4efff] text-[#2A4E7A]";
}

function StrategicTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-[#f5f9ff]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={index} className="align-top">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 text-sm leading-6 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StrategicMetricsPage({ data }: StrategicMetricsPageProps) {
  const [areaFilter, setAreaFilter] = useState<AreaFilter>("todas");

  const filteredQuestions = useMemo(
    () =>
      data.questions.filter((question) =>
        areaFilter === "todas" ? true : question.area === areaFilter,
      ),
    [areaFilter, data.questions],
  );

  const filteredContents = useMemo(
    () =>
      data.contents.filter((content) =>
        areaFilter === "todas" ? true : content.area === areaFilter,
      ),
    [areaFilter, data.contents],
  );

  const topGain = [...filteredQuestions].sort(
    (a, b) => b.scoreAumentaNota - a.scoreAumentaNota,
  )[0];
  const topPain = [...filteredQuestions].sort(
    (a, b) => b.scorePrejudica - a.scorePrejudica,
  )[0];
  const topContent = [...filteredContents].sort(
    (a, b) => b.roiEstudo - a.roiEstudo,
  )[0];

  const topGainRows = [...filteredQuestions]
    .sort((a, b) => b.scoreAumentaNota - a.scoreAumentaNota)
    .slice(0, 12);
  const topPainRows = [...filteredQuestions]
    .sort((a, b) => b.scorePrejudica - a.scorePrejudica)
    .slice(0, 12);
  const topContentRows = [...filteredContents]
    .sort((a, b) => b.roiEstudo - a.roiEstudo)
    .slice(0, 12);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="rounded-[34px] border border-white/70 bg-white/82 p-6 shadow-card backdrop-blur sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex rounded-full bg-gold/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4f79b0]">
            Inteligência analítica
          </span>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/metricas-estrategicas/reais"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-clay/40 hover:text-clay"
            >
              Ver base real
            </Link>
            <Link
              href="/prova"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-clay/40 hover:text-clay"
            >
              Voltar para provas
            </Link>
          </div>
        </div>

        <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
          Métricas Estratégicas
        </h1>
        <p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 sm:text-lg">
          Veja quais questões mais aumentam a nota, quais erros mais prejudicam e quais conteúdos
          devem ser priorizados no estudo.
        </p>
        <p className="mt-3 max-w-5xl text-sm leading-7 text-slate-500">
          {data.methodologyNote}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAreaFilter("todas")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              areaFilter === "todas"
                ? "bg-ink text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-clay/40"
            }`}
          >
            2024 · Todas as áreas
          </button>
          {(["linguagens", "ciencias-humanas", "ciencias-natureza", "matematica"] as AreaSlug[]).map(
            (area) => (
              <button
                key={area}
                type="button"
                onClick={() => setAreaFilter(area)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  areaFilter === area
                    ? "bg-ink text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-clay/40"
                }`}
              >
                {areaLabels[area]}
              </button>
            ),
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-card backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Questão que mais aumenta a nota
          </p>
          {topGain ? (
            <>
              <div className="mt-3 flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${areaPillTone(topGain.area)}`}>
                  {topGain.areaLabel}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  Questão {topGain.questionNumber}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-ink">
                {topGain.contentGroup}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ganho estimado <strong>{topGain.scoreAumentaNota.toFixed(1)}</strong> · acerto{" "}
                <strong>{topGain.accRate.toFixed(1)}%</strong>
              </p>
              <Link
                href={topGain.questionRoute}
                className="mt-4 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
              >
                Abrir questão
              </Link>
            </>
          ) : null}
        </article>

        <article className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-card backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Questão que mais prejudica
          </p>
          {topPain ? (
            <>
              <div className="mt-3 flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${areaPillTone(topPain.area)}`}>
                  {topPain.areaLabel}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  Questão {topPain.questionNumber}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-ink">
                {topPain.contentGroup}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Penalidade estimada <strong>{topPain.scorePrejudica.toFixed(1)}</strong> · erro no topo{" "}
                <strong>{topPain.topErrRate.toFixed(1)}%</strong>
              </p>
              <Link
                href={topPain.questionRoute}
                className="mt-4 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
              >
                Abrir questão
              </Link>
            </>
          ) : null}
        </article>

        <article className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-card backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Conteúdo com maior ROI
          </p>
          {topContent ? (
            <>
              <div className="mt-3 flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${areaPillTone(topContent.area)}`}>
                  {topContent.areaLabel}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  {topContent.nQuestions} questões
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-ink">
                {topContent.contentGroup}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                ROI estimado <strong>{topContent.roiEstudo.toFixed(1)}</strong> · frequência{" "}
                <strong>{topContent.freqHist.toFixed(1)}%</strong>
              </p>
              <Link
                href={`/prova/2024/${topContent.area}`}
                className="mt-4 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
              >
                Ver área
              </Link>
            </>
          ) : null}
        </article>
      </section>

      <section className="rounded-[30px] border border-white/70 bg-white/84 p-6 shadow-card backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Bloco A
            </p>
            <h2 className="mt-2 font-display text-3xl leading-tight text-ink">
              Questões que mais aumentam a nota
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Ranking baseado em contraste de desempenho entre grupos, força de discriminação e valor
              informacional do item.
            </p>
          </div>
          <details className="max-w-md rounded-[22px] border border-slate-200 bg-[#f7fbff] px-4 py-3 text-sm text-slate-600">
            <summary className="cursor-pointer font-semibold text-ink">
              Ver detalhes metodológicos
            </summary>
            <p className="mt-3 leading-7">
              Aqui usamos uma proxy estratégica do ganho: diferença de acerto entre topo e base,
              contraste entre grupos mais fortes e peso de discriminação do item. O objetivo é ordenar
              os itens que mais tendem a “puxar” a nota para cima.
            </p>
          </details>
        </div>

        <div className="mt-5">
          <StrategicTable
            columns={["Questão", "Área", "Conteúdo", "Acerto", "Ganho estimado"]}
            rows={topGainRows.map((row) => [
              <Link key="q" href={row.questionRoute} className="font-semibold text-ink hover:text-clay">
                Q{row.questionNumber}
              </Link>,
              <span key="a" className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${areaPillTone(row.area)}`}>
                {row.areaLabel}
              </span>,
              <div key="c">
                <p className="font-medium text-ink">{row.contentGroup}</p>
                <p className="text-xs text-slate-500">{row.skill}</p>
              </div>,
              <span key="acc">{row.accRate.toFixed(1)}%</span>,
              <div key="gain">
                <p className="font-semibold text-ink">{row.scoreAumentaNota.toFixed(1)}</p>
                <p className="text-xs text-slate-500">Gap amplo {row.deltaTriBucketAvg.toFixed(1)} p.p.</p>
              </div>,
            ])}
          />
        </div>
      </section>

      <section className="rounded-[30px] border border-white/70 bg-white/84 p-6 shadow-card backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Bloco B
            </p>
            <h2 className="mt-2 font-display text-3xl leading-tight text-ink">
              Questões cujo erro mais prejudica
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              O foco aqui é o custo estratégico de errar itens acessíveis e ainda assim relevantes
              entre alunos fortes.
            </p>
          </div>
          <details className="max-w-md rounded-[22px] border border-slate-200 bg-[#f7fbff] px-4 py-3 text-sm text-slate-600">
            <summary className="cursor-pointer font-semibold text-ink">
              Ver detalhes metodológicos
            </summary>
            <p className="mt-3 leading-7">
              A penalidade combina taxa de acerto geral, contraste entre grupos e erro observado entre
              alunos do topo. Itens fáceis e ainda assim muito punitivos sobem neste ranking.
            </p>
          </details>
        </div>

        <div className="mt-5">
          <StrategicTable
            columns={["Questão", "Área", "Conteúdo", "Acerto", "Erro entre 800+", "Penalidade"]}
            rows={topPainRows.map((row) => [
              <Link key="q" href={row.questionRoute} className="font-semibold text-ink hover:text-clay">
                Q{row.questionNumber}
              </Link>,
              <span key="a" className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${areaPillTone(row.area)}`}>
                {row.areaLabel}
              </span>,
              <div key="c">
                <p className="font-medium text-ink">{row.contentGroup}</p>
                <p className="text-xs text-slate-500">{row.easyFlag ? "Questão fácil/intermediária" : "Questão mais exigente"}</p>
              </div>,
              <span key="acc">{row.accRate.toFixed(1)}%</span>,
              <span key="err">{row.topErrRate.toFixed(1)}%</span>,
              <div key="pen">
                <p className="font-semibold text-ink">{row.scorePrejudica.toFixed(1)}</p>
                <p className="text-xs text-slate-500">Topo acerta {row.deltaTriTopStudents.toFixed(1)}%</p>
              </div>,
            ])}
          />
        </div>
      </section>

      <section className="rounded-[30px] border border-white/70 bg-white/84 p-6 shadow-card backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Bloco C
            </p>
            <h2 className="mt-2 font-display text-3xl leading-tight text-ink">
              O que estudar primeiro
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              O ranking prioriza conteúdos com boa combinação entre recorrência, ganho potencial e
              custo estratégico do erro.
            </p>
          </div>
          <details className="max-w-md rounded-[22px] border border-slate-200 bg-[#f7fbff] px-4 py-3 text-sm text-slate-600">
            <summary className="cursor-pointer font-semibold text-ink">
              Ver detalhes metodológicos
            </summary>
            <p className="mt-3 leading-7">
              O ROI combina frequência do conteúdo no ano, média de ganho estratégico das questões
              desse grupo e penalidade média quando o erro dói mais.
            </p>
          </details>
        </div>

        <div className="mt-5">
          <StrategicTable
            columns={["Conteúdo", "Área", "Frequência", "Ganho médio", "Penalidade média", "ROI"]}
            rows={topContentRows.map((row) => [
              <div key="c">
                <p className="font-medium text-ink">{row.contentGroup}</p>
                <p className="text-xs text-slate-500">{row.topic}</p>
              </div>,
              <span key="a" className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${areaPillTone(row.area)}`}>
                {row.areaLabel}
              </span>,
              <span key="freq">{row.nQuestions} q. · {row.freqHist.toFixed(1)}%</span>,
              <span key="gain">{row.deltaTriMean.toFixed(1)}</span>,
              <span key="pen">{row.penaltyEasyMean.toFixed(1)}</span>,
              <strong key="roi" className="text-ink">{row.roiEstudo.toFixed(1)}</strong>,
            ])}
          />
        </div>
      </section>
    </main>
  );
}
