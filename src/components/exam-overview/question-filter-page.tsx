"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type FilterQuestionItem = {
  year: number;
  areaSlug: string;
  areaLabel: string;
  questionId: number;
  displayNumber: number;
  theme: string;
  skill: string;
  skillKey: string;
  skillSummary: string;
  competenceSummary: string;
  difficultyLevel: number;
  relativeDifficultyLabel: string;
  accuracy: number;
  route: string;
};

type QuestionFilterPageProps = {
  questions: FilterQuestionItem[];
};

type AccuracyBand =
  | "all"
  | "lt30"
  | "30to50"
  | "50to70"
  | "70plus";

type SortMode =
  | "default"
  | "difficulty_desc"
  | "difficulty_asc"
  | "accuracy_asc"
  | "accuracy_desc";

function simplifyThemeLabel(theme: string) {
  const cleaned = theme
    .replace(
      /^(utilizar|utilize|conhecer|conhe[aç]a|compreender|interpretar|resolver|analisar|identificar|relacionar|aplicar|avaliar)\s+/i,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

  const cutByConnector =
    cleaned.split(/\s+(?:para|como|por meio de|a partir de)\s+/i)[0] ?? cleaned;
  const base = cutByConnector.length >= 12 ? cutByConnector : cleaned;

  if (base.length <= 38) {
    return base.charAt(0).toUpperCase() + base.slice(1);
  }

  const words = base.split(" ");
  let compact = "";
  for (const word of words) {
    const next = compact ? `${compact} ${word}` : word;
    if (next.length > 38) break;
    compact = next;
  }

  const finalLabel = compact || base.slice(0, 35).trim();
  return `${finalLabel.charAt(0).toUpperCase()}${finalLabel.slice(1)}`;
}

function summarizeSkillContext(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= 72) {
    return normalized;
  }

  const firstPart = normalized.split(/(?:,|\.)\s+/)[0]?.trim() ?? normalized;
  if (firstPart.length <= 72) {
    return firstPart;
  }

  return `${firstPart.slice(0, 69).trim()}...`;
}

function getDifficultyTheme(level: number) {
  if (level <= 1) {
    return {
      shell: "border-emerald-300/90 bg-gradient-to-br from-emerald-100 via-white to-emerald-200/90",
      badge: "bg-emerald-700 text-white",
      accent: "text-emerald-800",
    };
  }
  if (level === 2) {
    return {
      shell: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-green-100/80",
      badge: "bg-emerald-100 text-emerald-700",
      accent: "text-emerald-700",
    };
  }
  if (level === 3) {
    return {
      shell: "border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-yellow-100/80",
      badge: "bg-amber-100 text-amber-700",
      accent: "text-amber-700",
    };
  }
  if (level === 4) {
    return {
      shell: "border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-pink-100/80",
      badge: "bg-rose-100 text-rose-700",
      accent: "text-rose-700",
    };
  }
  return {
    shell: "border-red-300/90 bg-gradient-to-br from-red-100 via-white to-rose-200/90",
    badge: "bg-red-700 text-white",
    accent: "text-red-800",
  };
}

export function QuestionFilterPage({ questions }: QuestionFilterPageProps) {
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>("all");
  const [selectedSkill, setSelectedSkill] = useState<string>("all");
  const [accuracyBand, setAccuracyBand] = useState<AccuracyBand>("all");
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const years = useMemo(
    () => Array.from(new Set(questions.map((question) => question.year))).sort((a, b) => b - a),
    [questions],
  );
  const areas = useMemo(
    () =>
      Array.from(
        new Map(questions.map((question) => [question.areaSlug, question.areaLabel])).entries(),
      ).map(([slug, label]) => ({ slug, label })),
    [questions],
  );
  const themeOptions = useMemo(
    () =>
      Array.from(new Map(questions.map((question) => [question.theme, question.theme.trim()])).entries())
        .map(([value, label]) => ({ value, label }))
        .sort((left, right) => left.label.localeCompare(right.label, "pt-BR")),
    [questions],
  );
  const skillOptions = useMemo(
    () =>
      Array.from(
        new Map(
          questions.map((question) => [
            question.skillKey,
            `${question.areaLabel} · ${question.skill} — ${summarizeSkillContext(
              question.skillSummary || question.competenceSummary,
            )}`,
          ]),
        ).entries(),
      )
        .map(([value, label]) => ({ value, label }))
        .sort((left, right) => left.label.localeCompare(right.label, "pt-BR")),
    [questions],
  );
  const selectedThemeLabel =
    selectedTheme === "all"
      ? "Todos os temas"
      : themeOptions.find((theme) => theme.value === selectedTheme)?.label ?? selectedTheme;

  const toggleYear = (year: number) => {
    setSelectedYears((current) =>
      current.includes(year)
        ? current.filter((item) => item !== year)
        : [...current, year].sort((a, b) => b - a),
    );
  };

  const toggleArea = (slug: string) => {
    setSelectedAreas((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug],
    );
  };

  const toggleLevel = (level: number) => {
    setSelectedLevels((current) =>
      current.includes(level)
        ? current.filter((item) => item !== level)
        : [...current, level].sort((a, b) => a - b),
    );
  };

  const filteredQuestions = useMemo(() => {
    const filtered = questions.filter((question) => {
      const matchesYear =
        selectedYears.length === 0 || selectedYears.includes(question.year);
      const matchesArea =
        selectedAreas.length === 0 || selectedAreas.includes(question.areaSlug);
      const matchesLevel =
        selectedLevels.length === 0 || selectedLevels.includes(question.difficultyLevel);
      const matchesTheme =
        selectedTheme === "all" || question.theme === selectedTheme;
      const matchesSkill =
        selectedSkill === "all" || question.skillKey === selectedSkill;
      const matchesAccuracy =
        accuracyBand === "all" ||
        (accuracyBand === "lt30" && question.accuracy < 30) ||
        (accuracyBand === "30to50" && question.accuracy >= 30 && question.accuracy < 50) ||
        (accuracyBand === "50to70" && question.accuracy >= 50 && question.accuracy < 70) ||
        (accuracyBand === "70plus" && question.accuracy >= 70);

      return (
        matchesYear &&
        matchesArea &&
        matchesLevel &&
        matchesTheme &&
        matchesSkill &&
        matchesAccuracy
      );
    });

    const sorted = [...filtered];
    switch (sortMode) {
      case "difficulty_desc":
        sorted.sort(
          (left, right) =>
            right.difficultyLevel - left.difficultyLevel ||
            left.accuracy - right.accuracy ||
            right.year - left.year ||
            left.displayNumber - right.displayNumber,
        );
        break;
      case "difficulty_asc":
        sorted.sort(
          (left, right) =>
            left.difficultyLevel - right.difficultyLevel ||
            right.accuracy - left.accuracy ||
            right.year - left.year ||
            left.displayNumber - right.displayNumber,
        );
        break;
      case "accuracy_asc":
        sorted.sort(
          (left, right) =>
            left.accuracy - right.accuracy ||
            right.difficultyLevel - left.difficultyLevel ||
            right.year - left.year,
        );
        break;
      case "accuracy_desc":
        sorted.sort(
          (left, right) =>
            right.accuracy - left.accuracy ||
            left.difficultyLevel - right.difficultyLevel ||
            right.year - left.year,
        );
        break;
      default:
        sorted.sort(
          (left, right) =>
            right.year - left.year ||
            left.areaLabel.localeCompare(right.areaLabel, "pt-BR") ||
            left.displayNumber - right.displayNumber,
        );
    }

    return sorted;
  }, [
    accuracyBand,
    questions,
    selectedAreas,
    selectedLevels,
    selectedSkill,
    selectedTheme,
    selectedYears,
    sortMode,
  ]);

  const clearFilters = () => {
    setSelectedYears([]);
    setSelectedAreas([]);
    setSelectedLevels([]);
    setSelectedTheme("all");
    setSelectedSkill("all");
    setAccuracyBand("all");
    setSortMode("default");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="rounded-[34px] border border-white/70 bg-white/82 p-8 shadow-card backdrop-blur">
        <div className="flex justify-end">
          <Link
            href="/prova"
            className="inline-flex items-center rounded-full border border-[#d6e6ff] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-clay/50 hover:text-clay"
          >
            ← Voltar para provas
          </Link>
        </div>
        <span className="mt-5 inline-flex rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#4f79b0]">
          Filtrar questões
        </span>
        <h1 className="mt-5 font-display text-4xl leading-tight text-ink sm:text-5xl">
          Encontre questões de todos os anos por filtro
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-slate-600 sm:text-lg">
          Filtre por disciplina, tema, habilidade, nível de dificuldade e taxa de acerto para montar recortes específicos de estudo.
        </p>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-card backdrop-blur sm:p-7">
        <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Anos
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => toggleYear(year)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      selectedYears.includes(year)
                        ? "bg-ink text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-[#d6e6ff] hover:text-ink"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Disciplinas
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {areas.map((area) => (
                  <button
                    key={area.slug}
                    type="button"
                    onClick={() => toggleArea(area.slug)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      selectedAreas.includes(area.slug)
                        ? "bg-[#6AA5E8] text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-[#d6e6ff] hover:text-ink"
                    }`}
                  >
                    {area.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Nível de dificuldade
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((level) => {
                  const theme = getDifficultyTheme(level);
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
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Tema
              </span>
              <details className="group relative">
                <summary className="flex w-full cursor-pointer list-none items-center justify-between rounded-[16px] border border-[#d6e6ff] bg-[#f8fbff] px-4 py-3 text-left text-sm font-medium text-ink outline-none transition hover:border-[#6AA5E8] [&::-webkit-details-marker]:hidden">
                  <span className="pr-4 leading-6">{selectedThemeLabel}</span>
                  <span className="text-slate-400 transition group-open:rotate-180">▾</span>
                </summary>
                <div className="absolute z-20 mt-2 max-h-[320px] w-full overflow-auto rounded-[20px] border border-[#d6e6ff] bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.14)]">
                  <button
                    type="button"
                    onClick={() => setSelectedTheme("all")}
                    className={`block w-full rounded-[14px] px-3 py-2 text-left text-sm leading-6 transition ${
                      selectedTheme === "all"
                        ? "bg-[#6AA5E8] text-white"
                        : "text-slate-700 hover:bg-[#eef5ff]"
                    }`}
                  >
                    Todos os temas
                  </button>
                  {themeOptions.map((theme) => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => setSelectedTheme(theme.value)}
                      className={`mt-1 block w-full rounded-[14px] px-3 py-2 text-left text-sm leading-6 transition ${
                        selectedTheme === theme.value
                          ? "bg-[#6AA5E8] text-white"
                          : "text-slate-700 hover:bg-[#eef5ff]"
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </details>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Habilidade
              </span>
              <select
                value={selectedSkill}
                onChange={(event) => setSelectedSkill(event.target.value)}
                className="w-full rounded-[16px] border border-[#d6e6ff] bg-[#f8fbff] px-4 py-3 text-sm font-medium text-ink outline-none transition focus:border-[#6AA5E8]"
              >
                <option value="all">Todas as habilidades</option>
                {skillOptions.map((skill) => (
                  <option key={skill.value} value={skill.value}>
                    {skill.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Taxa de acerto
              </span>
              <select
                value={accuracyBand}
                onChange={(event) => setAccuracyBand(event.target.value as AccuracyBand)}
                className="w-full rounded-[16px] border border-[#d6e6ff] bg-[#f8fbff] px-4 py-3 text-sm font-medium text-ink outline-none transition focus:border-[#6AA5E8]"
              >
                <option value="all">Todas as faixas</option>
                <option value="lt30">Menor que 30%</option>
                <option value="30to50">30% a 49,9%</option>
                <option value="50to70">50% a 69,9%</option>
                <option value="70plus">70% ou mais</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Ordenar por
              </span>
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="w-full rounded-[16px] border border-[#d6e6ff] bg-[#f8fbff] px-4 py-3 text-sm font-medium text-ink outline-none transition focus:border-[#6AA5E8]"
              >
                <option value="default">Ano mais recente + ordem da prova</option>
                <option value="difficulty_desc">Mais difícil → mais fácil</option>
                <option value="difficulty_asc">Mais fácil → mais difícil</option>
                <option value="accuracy_asc">Menor acerto → maior acerto</option>
                <option value="accuracy_desc">Maior acerto → menor acerto</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span>
            {filteredQuestions.length} de {questions.length} questões visíveis
          </span>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:border-[#d6e6ff] hover:text-ink"
          >
            Limpar filtros
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredQuestions.map((question) => {
          const tone = getDifficultyTheme(question.difficultyLevel);
          return (
            <Link
              key={`${question.year}-${question.areaSlug}-${question.questionId}`}
              href={question.route}
              className={`rounded-[28px] border p-5 shadow-card transition hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(15,23,42,0.08)] ${tone.shell}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    ENEM {question.year}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {question.areaLabel} • Questão {question.displayNumber}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${tone.badge}`}
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

              <div className="mt-5 flex items-end justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Acerto
                </span>
                <span className={`text-2xl font-semibold ${tone.accent}`}>
                  {question.accuracy.toFixed(1)}%
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      {filteredQuestions.length === 0 ? (
        <section className="rounded-[28px] border border-dashed border-[#d6e6ff] bg-white/80 px-6 py-10 text-center shadow-card">
          <p className="text-lg font-semibold text-ink">Nenhuma questão encontrada</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Ajuste os filtros para ampliar o conjunto de questões visíveis.
          </p>
        </section>
      ) : null}
    </main>
  );
}
