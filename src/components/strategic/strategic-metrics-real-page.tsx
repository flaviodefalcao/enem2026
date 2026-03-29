"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { StrategicRealPayload } from "@/data/strategic-metrics-real";

type StrategicMetricsRealPageProps = {
  data: StrategicRealPayload;
};

type AreaFilter = "todas" | "LC" | "CH" | "CN" | "MT";
type YearFilter = number;

function rawAreaCodeToSlug(area: Exclude<AreaFilter, "todas">) {
  if (area === "LC") return "linguagens";
  if (area === "CH") return "ciencias-humanas";
  if (area === "CN") return "ciencias-natureza";
  return "matematica";
}

function rawAreaCodeToLabel(area: Exclude<AreaFilter, "todas">) {
  if (area === "LC") return "Linguagens";
  if (area === "CH") return "Ciências Humanas";
  if (area === "CN") return "Ciências da Natureza";
  return "Matemática";
}

function areaPillTone(area: Exclude<AreaFilter, "todas">) {
  if (area === "LC") return "bg-[#eef5ff] text-[#4f79b0]";
  if (area === "CH") return "bg-[#ecf4ff] text-[#3c6794]";
  if (area === "CN") return "bg-[#e9f2ff] text-[#537cac]";
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

export function StrategicMetricsRealPage({ data }: StrategicMetricsRealPageProps) {
  const [yearFilter, setYearFilter] = useState<YearFilter>(2024);
  const [areaFilter, setAreaFilter] = useState<AreaFilter>("todas");

  const filteredQuestions = useMemo(
    () =>
      data.questions.filter(
        (question) =>
          question.year === yearFilter && (areaFilter === "todas" ? true : question.area === areaFilter),
      ),
    [areaFilter, data.questions, yearFilter],
  );

  const filteredContents = useMemo(
    () =>
      data.contents.filter((content) => (areaFilter === "todas" ? true : content.area === areaFilter)),
    [areaFilter, data.contents],
  );

  const topGain = [...filteredQuestions].sort((a, b) => b.score_aumenta_nota - a.score_aumenta_nota)[0];
  const topPain = [...filteredQuestions].sort((a, b) => b.score_prejudica - a.score_prejudica)[0];
  const topContent = [...filteredContents].sort((a, b) => b.roi_estudo - a.roi_estudo)[0];

  const topGainRows = [...filteredQuestions]
    .sort((a, b) => b.score_aumenta_nota - a.score_aumenta_nota)
    .slice(0, 12);
  const topPainRows = [...filteredQuestions]
    .sort((a, b) => b.score_prejudica - a.score_prejudica)
    .slice(0, 12);
  const topContentRows = [...filteredContents]
    .sort((a, b) => b.roi_estudo - a.roi_estudo)
    .slice(0, 12);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="rounded-[34px] border border-white/70 bg-white/82 p-6 shadow-card backdrop-blur sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex rounded-full bg-gold/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4f79b0]">
            Inteligência analítica · base real
          </span>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/metricas-estrategicas"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-clay/40 hover:text-clay"
            >
              Ver versão MVP
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
          Métricas Estratégicas com base real
        </h1>
        <p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 sm:text-lg">
          Esta página usa a pasta <strong>strategic_metrics_raw</strong> como fonte principal, com
          scores já calculados por questão e por conteúdo.
        </p>
        <p className="mt-3 max-w-5xl text-sm leading-7 text-slate-500">
          O bloco de questões respeita o filtro de ano e área. O bloco de conteúdos usa o ranking
          histórico consolidado presente na base real, por isso ele não muda com o ano.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {data.metadata.years.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => setYearFilter(year)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  yearFilter === year
                    ? "bg-ink text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-clay/40"
                }`}
              >
                {year}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAreaFilter("todas")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                areaFilter === "todas"
                  ? "bg-ink text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-clay/40"
              }`}
            >
              Todas as áreas
            </button>
            {(["LC", "CH", "CN", "MT"] as const).map((area) => (
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
                {rawAreaCodeToLabel(area)}
              </button>
            ))}
          </div>
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
                  {rawAreaCodeToLabel(topGain.area)}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  {topGain.year} · Questão {topGain.question_number}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-ink">
                {topGain.content_group}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ganho estimado <strong>{topGain.score_aumenta_nota.toFixed(2)}</strong> · acerto{" "}
                <strong>{(topGain.acc_rate * 100).toFixed(1)}%</strong>
              </p>
              <Link
                href={`/questoes/${topGain.year}/${rawAreaCodeToSlug(topGain.area)}/${topGain.question_number}`}
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
                  {rawAreaCodeToLabel(topPain.area)}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  {topPain.year} · Questão {topPain.question_number}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-ink">
                {topPain.content_group}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Penalidade <strong>{topPain.score_prejudica.toFixed(2)}</strong> · erro no topo{" "}
                <strong>{(topPain.top_err_rate * 100).toFixed(1)}%</strong>
              </p>
              <Link
                href={`/questoes/${topPain.year}/${rawAreaCodeToSlug(topPain.area)}/${topPain.question_number}`}
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
                  {rawAreaCodeToLabel(topContent.area)}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  Histórico consolidado
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-ink">
                {topContent.content_group}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                ROI <strong>{topContent.roi_estudo.toFixed(2)}</strong> · frequência{" "}
                <strong>{topContent.freq_hist} itens</strong>
              </p>
              <Link
                href={`/prova/${yearFilter}/${rawAreaCodeToSlug(topContent.area)}`}
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
              Ranking direto pelo score real `score_aumenta_nota` da pasta estratégica.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <StrategicTable
            columns={["Questão", "Área", "Conteúdo", "Acerto", "Delta bucket", "Score real"]}
            rows={topGainRows.map((row) => [
              <Link
                key="q"
                href={`/questoes/${row.year}/${rawAreaCodeToSlug(row.area)}/${row.question_number}`}
                className="font-semibold text-ink hover:text-clay"
              >
                {row.year} · Q{row.question_number}
              </Link>,
              <span key="a" className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${areaPillTone(row.area)}`}>
                {rawAreaCodeToLabel(row.area)}
              </span>,
              <div key="c">
                <p className="font-medium text-ink">{row.content_group}</p>
                <p className="text-xs text-slate-500">H{row.CO_HABILIDADE ?? "—"}</p>
              </div>,
              <span key="acc">{(row.acc_rate * 100).toFixed(1)}%</span>,
              <span key="delta">{row.delta_tri_bucket_avg.toFixed(1)}</span>,
              <strong key="score" className="text-ink">{row.score_aumenta_nota.toFixed(2)}</strong>,
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
              Questões que mais prejudicam quando erradas
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Ranking direto pelo `score_prejudica`, com destaque para itens fáceis e erro entre alunos fortes.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <StrategicTable
            columns={["Questão", "Área", "Conteúdo", "Questão fácil", "Erro no topo", "Score real"]}
            rows={topPainRows.map((row) => [
              <Link
                key="q"
                href={`/questoes/${row.year}/${rawAreaCodeToSlug(row.area)}/${row.question_number}`}
                className="font-semibold text-ink hover:text-clay"
              >
                {row.year} · Q{row.question_number}
              </Link>,
              <span key="a" className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${areaPillTone(row.area)}`}>
                {rawAreaCodeToLabel(row.area)}
              </span>,
              <div key="c">
                <p className="font-medium text-ink">{row.content_group}</p>
                <p className="text-xs text-slate-500">{row.gabarito_ref ?? "—"}</p>
              </div>,
              <span key="easy">{row.easy_flag ? "Sim" : "Não"}</span>,
              <span key="err">{(row.top_err_rate * 100).toFixed(1)}%</span>,
              <strong key="score" className="text-ink">{row.score_prejudica.toFixed(2)}</strong>,
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
              Este bloco usa o ranking histórico consolidado da pasta real de métricas de conteúdo.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <StrategicTable
            columns={["Conteúdo", "Área", "Frequência", "Delta médio", "Penalidade média", "ROI real"]}
            rows={topContentRows.map((row) => [
              <div key="c">
                <p className="font-medium text-ink">{row.content_group}</p>
                <p className="text-xs text-slate-500">Histórico consolidado</p>
              </div>,
              <span key="a" className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${areaPillTone(row.area)}`}>
                {rawAreaCodeToLabel(row.area)}
              </span>,
              <span key="freq">{row.n_questions} q. · {row.freq_hist}</span>,
              <span key="delta">{row.delta_tri_mean.toFixed(2)}</span>,
              <span key="pen">{row.penalty_easy_mean.toFixed(2)}</span>,
              <strong key="roi" className="text-ink">{row.roi_estudo.toFixed(2)}</strong>,
            ])}
          />
        </div>
      </section>
    </main>
  );
}
