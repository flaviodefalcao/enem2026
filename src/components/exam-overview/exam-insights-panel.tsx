"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ThemeDistributionEntry = {
  theme: string;
  competence: string;
  count: number;
  averageAccuracy: number;
};

type CompetenceAccuracyEntry = {
  competence: string;
  itemCount: number;
  averageAccuracy: number;
};

type ExamInsightsPanelProps = {
  themeDistribution: ThemeDistributionEntry[];
  competenceAccuracy: CompetenceAccuracyEntry[];
};

const themeColors = ["#2A4E7A", "#416899", "#5B83B7", "#6AA5E8", "#91BDF0", "#BED8FA"];

export function ExamInsightsPanel({
  themeDistribution,
  competenceAccuracy,
}: ExamInsightsPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-card backdrop-blur sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Resumo da prova
          </p>
          <h2 className="mt-2 font-display text-2xl text-ink">
            Distribuição temática e acerto médio
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            Painel compacto com os temas e competências que mais aparecem na prova
            e a média de acerto agregada por competência.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="rounded-full border border-[#d6e6ff] bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-clay/50 hover:text-clay"
        >
          {open ? "Ocultar painel" : "Mostrar painel"}
        </button>
      </div>

      {open ? (
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <article className="rounded-[28px] border border-slate-200/80 bg-white p-5">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Temas e competências
              </p>
              <h3 className="mt-2 text-lg font-semibold text-ink">
                Itens mais recorrentes na prova
              </h3>
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={themeDistribution} layout="vertical" margin={{ left: 12, right: 12 }}>
                  <CartesianGrid stroke="#e3edf9" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="theme"
                    width={140}
                    tick={{ fill: "#587399", fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number, _name, item) => {
                      if (item.dataKey === "count") {
                        return [`${value} questões`, "Frequência"];
                      }

                      return [`${value}%`, "Acerto médio"];
                    }}
                    labelFormatter={(_, payload) => {
                      const row = payload?.[0]?.payload as ThemeDistributionEntry | undefined;
                      return row ? `${row.theme} • ${row.competence}` : "";
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 10, 10, 0]}>
                    {themeDistribution.map((entry, index) => (
                      <Cell
                        key={`${entry.theme}-${entry.competence}`}
                        fill={themeColors[index % themeColors.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200/80 bg-white p-5">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Acerto médio
              </p>
              <h3 className="mt-2 text-lg font-semibold text-ink">
                Média de acerto por competência
              </h3>
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={competenceAccuracy} margin={{ top: 8, left: 0, right: 12, bottom: 8 }}>
                  <CartesianGrid stroke="#e3edf9" vertical={false} />
                  <XAxis dataKey="competence" tick={{ fill: "#587399", fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    formatter={(value: number, _name, item) => {
                      if (item.dataKey === "averageAccuracy") {
                        return [`${value}%`, "Acerto médio"];
                      }

                      return [`${value} itens`, "Quantidade"];
                    }}
                  />
                  <Bar dataKey="averageAccuracy" fill="#6AA5E8" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
