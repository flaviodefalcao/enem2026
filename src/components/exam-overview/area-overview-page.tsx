"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExamInsightsPanel } from "@/components/exam-overview/exam-insights-panel";
import type { AreaMeta, AreaQuestionSummary } from "@/data/exam-catalog";

type AreaOverviewPageProps = {
  area: AreaMeta;
  questions: AreaQuestionSummary[];
  overviewAnalytics: {
    themeDistribution: Array<{
      theme: string;
      competence: string;
      count: number;
      averageAccuracy: number;
    }>;
    competenceAccuracy: Array<{
      competence: string;
      itemCount: number;
      averageAccuracy: number;
    }>;
  };
};

export function AreaOverviewPage({
  area,
  questions,
  overviewAnalytics,
}: AreaOverviewPageProps) {
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "default" | "difficulty_desc" | "difficulty_asc" | "accuracy_asc" | "accuracy_desc"
  >("default");

  const featuredQuestion = questions[11] ?? questions[0];
  const averageAccuracy = (
    questions.reduce((sum, question) => sum + question.accuracy, 0) / questions.length
  ).toFixed(1);

  const simplifyThemeLabel = (theme: string) => {
    const cleaned = theme
      .replace(
        /^(utilizar|utilize|conhecer|conhe[aç]a|compreender|interpretar|resolver|analisar|identificar|relacionar|aplicar|avaliar)\s+/i,
        "",
      )
      .replace(/\s+/g, " ")
      .trim();

    const cutByConnector = cleaned.split(/\s+(?:para|como|por meio de|a partir de)\s+/i)[0] ?? cleaned;
    const base = cutByConnector.length >= 12 ? cutByConnector : cleaned;
    if (base.length <= 34) {
      return base.charAt(0).toUpperCase() + base.slice(1);
    }

    const words = base.split(" ");
    let compact = "";
    for (const word of words) {
      const next = compact ? `${compact} ${word}` : word;
      if (next.length > 34) break;
      compact = next;
    }

    const finalLabel = compact || base.slice(0, 31).trim();
    return `${finalLabel.charAt(0).toUpperCase()}${finalLabel.slice(1)}`;
  };

  const themeOptions = useMemo(() => {
    const unique = new Map<string, string>();
    for (const question of questions) {
      if (!unique.has(question.theme)) {
        unique.set(question.theme, simplifyThemeLabel(question.theme));
      }
    }

    return Array.from(unique.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label, "pt-BR"));
  }, [questions]);

  const visibleQuestions = useMemo(() => {
    const filtered = questions.filter((question) => {
      const matchesLevel =
        selectedLevels.length === 0 || selectedLevels.includes(question.difficultyLevel);
      const matchesTheme = selectedTheme === "all" || question.theme === selectedTheme;
      return matchesLevel && matchesTheme;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case "difficulty_desc":
        sorted.sort(
          (left, right) =>
            right.difficultyLevel - left.difficultyLevel ||
            left.accuracy - right.accuracy ||
            left.id - right.id,
        );
        break;
      case "difficulty_asc":
        sorted.sort(
          (left, right) =>
            left.difficultyLevel - right.difficultyLevel ||
            right.accuracy - left.accuracy ||
            left.id - right.id,
        );
        break;
      case "accuracy_asc":
        sorted.sort((left, right) => left.accuracy - right.accuracy || left.id - right.id);
        break;
      case "accuracy_desc":
        sorted.sort((left, right) => right.accuracy - left.accuracy || left.id - right.id);
        break;
      default:
        sorted.sort((left, right) => left.id - right.id);
    }

    return sorted;
  }, [questions, selectedLevels, selectedTheme, sortBy]);

  const toggleLevel = (level: number) => {
    setSelectedLevels((current) =>
      current.includes(level)
        ? current.filter((item) => item !== level)
        : [...current, level].sort((left, right) => left - right),
    );
  };

  const getDifficultyCardTheme = (level: number) => {
    if (level <= 1) {
      return {
        card: "border-emerald-300/90 bg-gradient-to-br from-emerald-100 via-white to-emerald-200/90",
        badge: "bg-emerald-700 text-white",
        accent: "text-emerald-800",
      };
    }
    if (level === 2) {
      return {
        card: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-green-100/80",
        badge: "bg-emerald-100 text-emerald-700",
        accent: "text-emerald-700",
      };
    }
    if (level === 3) {
      return {
        card: "border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-yellow-100/80",
        badge: "bg-amber-100 text-amber-700",
        accent: "text-amber-700",
      };
    }
    if (level === 4) {
      return {
        card: "border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-pink-100/80",
        badge: "bg-rose-100 text-rose-700",
        accent: "text-rose-700",
      };
    }
    return {
      card: "border-red-300/90 bg-gradient-to-br from-red-100 via-white to-rose-200/90",
      badge: "bg-red-700 text-white",
      accent: "text-red-800",
    };
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-card backdrop-blur">
        <div className="mb-5 flex justify-end">
          <Link
            href={`/prova/${area.year}`}
            className="inline-flex items-center rounded-full border border-[#d6e6ff] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-clay/50 hover:text-clay"
          >
            ← Voltar para provas
          </Link>
        </div>
        <span className="mb-3 inline-flex rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#4f79b0]">
          {area.dayLabel}
        </span>
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
              ENEM {area.year} - {area.label} com leitura orientada por dados.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              {area.lead}
            </p>
            <p className="max-w-3xl text-sm leading-7 text-slate-500">
              Fonte-base atual: <span className="font-semibold text-slate-700">{area.pdfFile}</span>
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl bg-ink p-5 text-white">
              <div className="text-sm uppercase tracking-[0.2em] text-white/70">
                Questões
              </div>
              <div className="mt-2 text-4xl font-semibold">{questions.length}</div>
            </div>
            <div className="rounded-3xl bg-white p-5">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Acerto médio
              </div>
              <div className="mt-2 text-2xl font-semibold text-ink">
                {averageAccuracy}%
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {featuredQuestion.theme} • {featuredQuestion.skill}
              </div>
            </div>
          </div>
        </div>
      </section>

      <ExamInsightsPanel
        themeDistribution={overviewAnalytics.themeDistribution}
        competenceAccuracy={overviewAnalytics.competenceAccuracy}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">
            Navegação da área
          </h2>
          <p className="text-sm text-slate-500">
            Clique em qualquer card para abrir a questão.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-card backdrop-blur">
          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Filtrar por nível de dificuldade
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((level) => {
                    const theme = getDifficultyCardTheme(level);
                    const active = selectedLevels.includes(level);
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => toggleLevel(level)}
                        className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                          active
                            ? `${theme.badge} shadow-sm`
                            : "border border-slate-200 bg-white text-slate-600 hover:border-[#d6e6ff] hover:text-ink"
                        }`}
                      >
                        Nível {level}
                      </button>
                    );
                  })}
                  {selectedLevels.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setSelectedLevels([])}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500 transition hover:border-[#d6e6ff] hover:text-ink"
                    >
                      Limpar níveis
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Tema
                </span>
                <select
                  value={selectedTheme}
                  onChange={(event) => setSelectedTheme(event.target.value)}
                  className="w-full rounded-[16px] border border-[#d6e6ff] bg-[#f8fbff] px-4 py-3 text-sm font-medium text-ink outline-none transition focus:border-[#6AA5E8]"
                >
                  <option value="all">Todos os temas</option>
                  {themeOptions.map((theme) => (
                    <option key={theme.value} value={theme.value}>
                      {theme.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Ordenar por
                </span>
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value as
                        | "default"
                        | "difficulty_desc"
                        | "difficulty_asc"
                        | "accuracy_asc"
                        | "accuracy_desc",
                    )
                  }
                  className="w-full rounded-[16px] border border-[#d6e6ff] bg-[#f8fbff] px-4 py-3 text-sm font-medium text-ink outline-none transition focus:border-[#6AA5E8]"
                >
                  <option value="default">Ordem da prova</option>
                  <option value="difficulty_desc">Mais difícil → mais fácil</option>
                  <option value="difficulty_asc">Mais fácil → mais difícil</option>
                  <option value="accuracy_asc">Menor acerto → maior acerto</option>
                  <option value="accuracy_desc">Maior acerto → menor acerto</option>
                </select>
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>
              {visibleQuestions.length} de {questions.length} questões visíveis
            </span>
            {(selectedLevels.length > 0 || selectedTheme !== "all" || sortBy !== "default") ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedLevels([]);
                  setSelectedTheme("all");
                  setSortBy("default");
                }}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:border-[#d6e6ff] hover:text-ink"
              >
                Limpar filtros
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {visibleQuestions.map((question) => {
            const theme = getDifficultyCardTheme(question.difficultyLevel);

            return (
              <Link
                key={question.id}
                href={`/questoes/${area.year}/${area.slug}/${question.id}`}
                className={`rounded-[28px] border p-5 shadow-card transition hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(15,23,42,0.08)] ${theme.card} ${
                  question.id === featuredQuestion.id ? "ring-2 ring-clay/30" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Questão {question.displayNumber}
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${theme.badge}`}
                  >
                    Nível {question.difficultyLevel}
                  </span>
                </div>
                <div className="mt-4 text-xl font-semibold leading-8 text-ink">
                  {simplifyThemeLabel(question.theme)}
                </div>
                <div className="mt-3 text-sm leading-6 text-slate-600">
                  {question.skill} • {question.relativeDifficultyLabel}
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Acerto
                  </span>
                  <span className={`text-2xl font-semibold ${theme.accent}`}>
                    {question.accuracy.toFixed(1)}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {visibleQuestions.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#d6e6ff] bg-white/80 px-6 py-8 text-center shadow-card">
            <p className="text-lg font-semibold text-ink">Nenhuma questão encontrada</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ajuste os filtros para voltar a mostrar as questões desta área.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
