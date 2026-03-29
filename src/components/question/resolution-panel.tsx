"use client";

type ResolutionContent = {
  whatItAsks: string;
  howToSolve: string;
  whyErrorsHappen: string;
  distractorCommentary: string[];
};

type LatexResolutionContent = {
  technicalSolution: string;
  formulasUsed: string;
  visualEvidenceUsed: string;
  didacticExplanation: string;
  commonPitfalls: string;
  teachingTips: string;
  distractors: string;
  itemProfile: string;
  fullDocument: string;
};

type OfficialResolutionContent = {
  emoji: string;
  shortThemeTitle: string;
  interpretationIntro: string;
  commandTerms: Array<{ term: string; explanation: string }>;
  whatTheQuestionAsks: string;
  strategyParagraph: string;
  reviewTable: Array<{ concept: string; keyIdea: string; application: string }>;
  theoryParagraphs: string[];
  resolutionParagraphs: string[];
  puloDoGato: string;
  alternatives: Array<{ option: string; isCorrect: boolean; explanation: string }>;
  questionCode: string;
};

type QuestionOption = {
  option: string;
  text: string;
  assets: string[];
};

type ResolutionPanelProps = {
  resolution: ResolutionContent;
  officialResolution: OfficialResolutionContent | null;
  latexResolution: LatexResolutionContent | null;
  examQuestionNumber: number;
  options: QuestionOption[];
  topDistractor: string;
};

type LatexSectionCardProps = {
  label: string;
  title: string;
  content: string;
  tone?: "sand" | "mist" | "clay" | "ink";
};

type LatexBlock =
  | { type: "paragraph"; content: string }
  | { type: "list"; items: string[] }
  | { type: "math"; content: string };

type DistractorCard = {
  option: string;
  optionText?: string;
  body: string[];
};

const toneStyles = {
  sand: "border-[#dfeafb] bg-[#fbfdff]",
  mist: "border-[#cfe0f7] bg-[#f5f9ff]",
  clay: "border-[#d6e6ff] bg-[#f4f8ff]",
  ink: "border-[#d7e4f3] bg-[#f7faff]",
} as const;

function splitLeadingLabel(text: string) {
  const normalized = normalizeInlineLatex(text);
  const match = normalized.match(/^([^:]{2,42}):\s+(.+)$/);
  if (!match) return null;
  return { label: match[1].trim(), content: match[2].trim() };
}

function normalizeInlineLatex(text: string) {
  return text
    .replace(/\\section\*?\{([^}]+)\}/g, "$1")
    .replace(/\\subsection\*?\{([^}]+)\}/g, "$1")
    .replace(/\\textbf\{([^}]+)\}/g, "$1")
    .replace(/\\textit\{([^}]+)\}/g, "$1")
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\\Rightarrow/g, "⇒")
    .replace(/\\times/g, "×")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    .replace(/\\sqrt\[3\]\{([^}]+)\}/g, "∛($1)")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\boxed\{([^}]+)\}/g, "$1")
    .replace(/\\textordfeminine\{\}/g, "ª")
    .replace(/\\textordmasculine\{\}/g, "º")
    .replace(/\\%/g, "%")
    .replace(/\\noindent/g, "")
    .replace(/\\,/g, " ")
    .replace(/~/g, " ")
    .replace(/&=/g, "=")
    .replace(/&/g, " ")
    .replace(/\\\(/g, "")
    .replace(/\\\)/g, "")
    .replace(/\\\[/g, "")
    .replace(/\\\]/g, "")
    .replace(/\\quad/g, " ")
    .replace(/\\qquad/g, " ")
    .replace(/\\item/g, "")
    .replace(/\\begin\{[^}]+\}/g, "")
    .replace(/\\end\{[^}]+\}/g, "")
    .replace(/\\/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMathSnippet(text: string) {
  return text
    .replace(/\\section\*?\{([^}]+)\}/g, "$1")
    .replace(/\\subsection\*?\{([^}]+)\}/g, "$1")
    .replace(/\\textbf\{([^}]+)\}/g, "$1")
    .replace(/\\textit\{([^}]+)\}/g, "$1")
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\approx/g, "≈")
    .replace(/\\in/g, "∈")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\cdot/g, "·")
    .replace(/\\Rightarrow/g, "⇒")
    .replace(/\\times/g, "×")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    .replace(/\\sqrt\[3\]\{([^}]+)\}/g, "∛($1)")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\textordfeminine\{\}/g, "ª")
    .replace(/\\textordmasculine\{\}/g, "º")
    .replace(/\\%/g, "%")
    .replace(/\\quad/g, " ")
    .replace(/\\qquad/g, " ")
    .replace(/~/g, " ")
    .replace(/&=/g, "=")
    .replace(/&/g, " ")
    .replace(/([A-Za-z])_([A-Za-z0-9]+)/g, "$1$2")
    .replace(/[{}]/g, "")
    .replace(/\\/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compactDidacticExplanation(content: string) {
  return content.split("\\subsection*{Erros comuns}")[0]?.trim() ?? content;
}

function parseLatexBlocks(content: string): LatexBlock[] {
  const stripped = content
    .replace(/\\section\*?\{[^}]+\}/g, "")
    .replace(/\\subsection\*?\{[^}]+\}/g, "")
    .trim();

  const blocks: LatexBlock[] = [];
  const mathMatches: string[] = [];
  const withDisplayMathPlaceholders = stripped.replace(/\\\[([\s\S]*?)\\\]/g, (_, mathContent) => {
    const token = `__MATH_BLOCK_${mathMatches.length}__`;
    mathMatches.push(normalizeMathSnippet(mathContent));
    return `\n\n${token}\n\n`;
  });
  const withMathPlaceholders = withDisplayMathPlaceholders.replace(
    /\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g,
    (_, mathContent) => {
      const token = `__MATH_BLOCK_${mathMatches.length}__`;
      mathMatches.push(normalizeMathSnippet(mathContent));
      return `\n\n${token}\n\n`;
    },
  );

  const normalized = withMathPlaceholders
    .replace(/\\begin\{itemize\}/g, "")
    .replace(/\\end\{itemize\}/g, "")
    .replace(/\\begin\{enumerate\}/g, "")
    .replace(/\\end\{enumerate\}/g, "")
    .replace(/\\\\/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const chunks = normalized
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    const mathTokenMatch = chunk.match(/^__MATH_BLOCK_(\d+)__$/);
    if (mathTokenMatch) {
      blocks.push({
        type: "math",
        content: mathMatches[Number(mathTokenMatch[1])] ?? "",
      });
      continue;
    }

    const lines = chunk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const listItems = lines
      .filter((line) => /^\\item\s+/.test(line) || /^\d+\.\s+/.test(line))
      .map((line) =>
        normalizeInlineLatex(
          line.replace(/^\\item\s+/, "").replace(/^\d+\.\s+/, ""),
        ),
      )
      .filter(Boolean);

    if (listItems.length === lines.length && listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      continue;
    }

    const paragraph = normalizeInlineLatex(
      lines
        .map((line) => line.replace(/^\\item\s+/, ""))
        .join(" "),
    );

    if (paragraph) {
      blocks.push({ type: "paragraph", content: paragraph });
    }
  }

  return blocks;
}

function normalizeComparableText(text: string) {
  return normalizeInlineLatex(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}.%,-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function resolveOptionLabel(
  rawOption: string,
  options: QuestionOption[],
): { option: string; optionText?: string } {
  const normalizedRaw = normalizeComparableText(rawOption);

  if (/^[A-E]$/i.test(rawOption.trim())) {
    const matched = options.find((option) => option.option === rawOption.trim().toUpperCase());
    return {
      option: rawOption.trim().toUpperCase(),
      optionText: matched?.text || undefined,
    };
  }

  const matchedByText = options.find((option) => {
    const normalizedOptionText = normalizeComparableText(option.text);
    return (
      normalizedOptionText === normalizedRaw ||
      normalizedOptionText.includes(normalizedRaw) ||
      normalizedRaw.includes(normalizedOptionText)
    );
  });

  if (matchedByText) {
    return {
      option: matchedByText.option,
      optionText: matchedByText.text || rawOption,
    };
  }

  return {
    option: rawOption,
    optionText: undefined,
  };
}

function parseDistractorCards(content: string, options: QuestionOption[]): DistractorCard[] {
  const cleaned = content
    .replace(/\\section\*?\{[^}]+\}/g, "")
    .replace(/\\begin\{itemize\}/g, "")
    .replace(/\\end\{itemize\}/g, "")
    .trim();

  const optionRegex = /(?:\\item\s+)?(?:\\textbf\{)?(?:Opção|Alternativa)\s+([A-E0-9]+)(?:\}|[:.)])?\s*:?\s*([\s\S]*?)(?=(?:\\item\s+)?(?:\\textbf\{)?(?:Opção|Alternativa)\s+[A-E0-9]+(?:\}|[:.)])?\s*:?\s*|$)/g;
  const cards: DistractorCard[] = [];

  for (const match of cleaned.matchAll(optionRegex)) {
    const rawOption = normalizeInlineLatex(match[1]).replace(/[:.]/g, "").trim();
    const resolved = resolveOptionLabel(rawOption, options);
    const body = match[2]
      .split(/\\item\s+/g)
      .map((item) => normalizeInlineLatex(item))
      .map((item) => item.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);

    if (resolved.option) {
      cards.push({
        option: resolved.option,
        optionText: resolved.optionText,
        body: body.length ? body : ["Sem comentário adicional."],
      });
    }
  }

  return cards;
}

function LatexRichText({ content }: { content: string }) {
  const blocks = parseLatexBlocks(content);

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "math") {
          return (
            <div
              key={`${block.type}-${index}`}
              className="overflow-x-auto rounded-[22px] bg-[#f7fbff] px-4 py-4 font-mono text-base leading-8 text-[#3f6a9e] ring-1 ring-[#dfeafb]"
            >
              {block.content}
            </div>
          );
        }

        if (block.type === "list") {
          return (
            <ul
              key={`${block.type}-${index}`}
              className="space-y-3 rounded-[22px] bg-white/80 px-4 py-4 ring-1 ring-white/80"
            >
              {block.items.map((item) => (
                <li key={item} className="flex gap-3 text-[1.125rem] leading-9 text-slate-700">
                  <span className="mt-[10px] h-2 w-2 rounded-full bg-[#6aa5e8]" />
                  <InlineLatexText text={item} />
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={`${block.type}-${index}`}
            className="text-[1.125rem] leading-9 text-slate-700"
          >
            <InlineLatexText text={block.content} />
          </p>
        );
      })}
    </div>
  );
}

function InlineLatexText({ text }: { text: string }) {
  const labeled = splitLeadingLabel(text);
  if (labeled) {
    return (
      <span className="min-w-0 leading-9">
        <span className="mr-2 inline-flex rounded-full bg-[#eaf3ff] px-3 py-1 text-[0.78em] font-semibold tracking-[0.04em] text-[#2A4E7A]">
          {labeled.label}
        </span>
        <InlineLatexText text={labeled.content} />
      </span>
    );
  }

  const parts = text
    .split(/(\$[^$]+\$|\\\([\s\S]*?\\\))/g)
    .filter(Boolean);

  return (
    <span className="min-w-0 leading-8">
      {parts.map((part, index) => {
        const isDollarMath = part.startsWith("$") && part.endsWith("$");
        const isParenMath = part.startsWith("\\(") && part.endsWith("\\)");

        if (isDollarMath || isParenMath) {
          const rawMath = isDollarMath
            ? part.slice(1, -1)
            : part.slice(2, -2);

          return (
            <span
              key={`${part}-${index}`}
              className="mx-[0.15em] inline-block rounded-lg bg-[#eaf3ff] px-2.5 py-[0.22rem] align-baseline font-mono text-[0.83em] leading-7 text-[#2A4E7A] ring-1 ring-[#d6e6ff]"
            >
              {normalizeMathSnippet(rawMath)}
            </span>
          );
        }

        return (
          <span key={`${part}-${index}`} className="whitespace-normal">
            {normalizeInlineLatex(part)}
          </span>
        );
      })}
    </span>
  );
}

function LatexSectionCard({
  label,
  title,
  content,
  tone = "sand",
}: LatexSectionCardProps) {
  return (
    <article className={`rounded-[28px] border p-5 ${toneStyles[tone]}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          {label}
        </span>
        <h3 className="text-[1.35rem] font-semibold text-ink">{title}</h3>
      </div>

      <div className="mt-4 rounded-[24px] border border-white/70 bg-white/75 p-4">
        <LatexRichText content={content} />
      </div>
    </article>
  );
}

function DistractorSection({
  content,
  options,
  topDistractor,
}: {
  content: string;
  options: QuestionOption[];
  topDistractor: string;
}) {
  const cards = parseDistractorCards(content, options);

  if (cards.length === 0) {
    return (
      <LatexSectionCard
        label="Parte 3"
        title="Leitura dos distratores"
        content={content}
        tone="clay"
      />
    );
  }

  return (
    <article className="rounded-[28px] border border-[#d6e6ff] bg-[#f4f8ff] p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Parte 3
        </span>
        <h3 className="text-lg font-semibold text-ink">Leitura dos distratores</h3>
      </div>

      <div className="mt-4 grid gap-4">
        {cards.map((card) => (
          <div
            key={card.option}
            className={`rounded-[24px] border bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.03)] ${
              card.option === topDistractor
                ? "border-amber-300 bg-amber-50/60"
                : "border-[#edd9d1]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#cfe0f7] bg-[#eef5ff] text-lg font-semibold text-[#2A4E7A]">
                {card.option}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#4f79b0]">
                    Alternativa {card.option}
                  </p>
                  {card.option === topDistractor ? (
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800 ring-1 ring-amber-200">
                      Distrator dominante
                    </span>
                  ) : null}
                </div>
                {card.optionText ? (
                  <p className="mt-2 rounded-xl bg-[#f7fbff] px-3 py-2 text-[0.95rem] leading-7 text-slate-700 ring-1 ring-[#dfeafb]">
                    {card.optionText}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {card.body.map((item) => (
                <p key={`${card.option}-${item}`} className="text-[1.05rem] leading-8 text-slate-700">
                  <InlineLatexText text={item} />
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export function ResolutionPanel({
  resolution,
  officialResolution,
  latexResolution,
  examQuestionNumber,
  options,
  topDistractor,
}: ResolutionPanelProps) {
  if (officialResolution) {
    return (
      <div className="space-y-5">
        <article className="rounded-[30px] border border-[#d6e6ff] bg-white/92 p-6 shadow-card backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Resolução editorial
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.7rem,3vw,2.5rem)] leading-[1.02] text-ink">
            {officialResolution.emoji} QUESTÃO — {officialResolution.shortThemeTitle}
          </h2>
        </article>

        <article className="rounded-[28px] border border-[#cfe0f7] bg-[#f5f9ff] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Parte 1
            </span>
            <h3 className="text-[1.35rem] font-semibold text-ink">Interpretação + estratégia + análise</h3>
          </div>

          <div className="mt-4 rounded-[24px] border border-white/70 bg-white/80 p-5">
            <p className="text-[1.125rem] leading-9 text-slate-700">
              <InlineLatexText text={officialResolution.interpretationIntro} />
            </p>

            {officialResolution.commandTerms.length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {officialResolution.commandTerms.map((item) => (
                  <div
                    key={item.term}
                    className="rounded-[20px] border border-[#d6e6ff] bg-[#f8fbff] p-4"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#4f79b0]">
                      {item.term}
                    </p>
                    <p className="mt-2 text-[1rem] leading-7 text-slate-700">
                      <InlineLatexText text={item.explanation} />
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-5 space-y-4">
              <p className="text-[1.125rem] leading-9 text-slate-700">
                <InlineLatexText text={officialResolution.whatTheQuestionAsks} />
              </p>
              <p className="text-[1.125rem] leading-9 text-slate-700">
                <InlineLatexText text={officialResolution.strategyParagraph} />
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-[#dfeafb] bg-[#fbfdff] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Parte 2
            </span>
            <h3 className="text-[1.35rem] font-semibold text-ink">Conteúdo + mini revisão</h3>
          </div>

          <div className="mt-4 overflow-hidden rounded-[22px] border border-[#dfeafb] bg-white">
            <table className="w-full border-collapse text-left">
              <thead className="bg-[#eef5ff] text-sm text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Conceito</th>
                  <th className="px-4 py-3 font-semibold">Ideia-chave</th>
                  <th className="px-4 py-3 font-semibold">Aplicação na questão</th>
                </tr>
              </thead>
              <tbody>
                {officialResolution.reviewTable.map((row) => (
                  <tr key={`${row.concept}-${row.keyIdea}`} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-[0.98rem] font-semibold text-ink">{row.concept}</td>
                    <td className="px-4 py-3 text-[0.98rem] leading-7 text-slate-700">{row.keyIdea}</td>
                    <td className="px-4 py-3 text-[0.98rem] leading-7 text-slate-700">{row.application}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-[24px] border border-white/70 bg-white/75 p-4">
            <div className="space-y-4">
              {officialResolution.theoryParagraphs.map((paragraph) => (
                <p key={paragraph} className="text-[1.125rem] leading-9 text-slate-700">
                  <InlineLatexText text={paragraph} />
                </p>
              ))}
            </div>
          </div>
        </article>

        <LatexSectionCard
          label="Parte 3"
          title="Resolução + pulo do gato"
          content={[
            ...officialResolution.resolutionParagraphs,
            `\\textbf{Pulo do gato}: ${officialResolution.puloDoGato}`,
          ].join("\n\n")}
          tone="sand"
        />

        <article className="rounded-[28px] border border-[#d6e6ff] bg-[#f4f8ff] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Parte 4
            </span>
            <h3 className="text-[1.35rem] font-semibold text-ink">Armadilhas</h3>
          </div>

          <div className="mt-4 grid gap-4">
            {officialResolution.alternatives.map((entry) => (
              <div
                key={entry.option}
                className={`rounded-[24px] border p-4 ${
                  entry.isCorrect
                    ? "border-emerald-200 bg-emerald-50/80"
                    : entry.option === topDistractor
                      ? "border-amber-300 bg-amber-50/80"
                    : "border-[#edd9d1] bg-white/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-lg font-semibold ${
                    entry.isCorrect
                      ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                      : "border-[#cfe0f7] bg-[#eef5ff] text-[#2A4E7A]"
                  }`}>
                    {entry.option}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">
                      {entry.isCorrect ? `Alternativa ${entry.option} • correta` : `Alternativa ${entry.option}`}
                    </p>
                    {!entry.isCorrect && entry.option === topDistractor ? (
                      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800 ring-1 ring-amber-200">
                        Distrator dominante
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="mt-3 text-[1.08rem] leading-8 text-slate-700">
                  <InlineLatexText text={entry.explanation} />
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[24px] border border-slate-200/80 bg-white px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Código do tipo de questão
          </p>
          <pre className="mt-3 overflow-x-auto rounded-[18px] bg-slate-950 px-4 py-4 text-sm text-slate-100">
{officialResolution.questionCode}
          </pre>
        </article>
      </div>
    );
  }

  if (!latexResolution) {
    return (
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-[28px] bg-sand p-5">
            <h3 className="text-lg font-semibold text-ink">O que a questão pede</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              {resolution.whatItAsks}
            </p>
          </article>

          <article className="rounded-[28px] bg-white p-5 ring-1 ring-slate-200/80">
            <h3 className="text-lg font-semibold text-ink">Como resolver</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              {resolution.howToSolve}
            </p>
          </article>

          <article className="rounded-[28px] bg-mist p-5">
            <h3 className="text-lg font-semibold text-ink">Por que os erros acontecem</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              {resolution.whyErrorsHappen}
            </p>
          </article>
        </div>

        <article className="rounded-[28px] border border-slate-200/80 bg-white p-5">
          <h3 className="text-lg font-semibold text-ink">
            Comentário local sobre distratores
          </h3>
          <div className="mt-4 space-y-3">
            {resolution.distractorCommentary.slice(0, 2).map((item) => (
              <div
                key={item}
                className="rounded-[22px] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <LatexSectionCard
          label="Parte 1"
          title="Solução técnica"
          content={latexResolution.technicalSolution}
          tone="sand"
        />
        <div className="space-y-5">
          <LatexSectionCard
            label="Apoio"
            title="Fórmulas usadas"
            content={latexResolution.formulasUsed}
            tone="ink"
          />
          <LatexSectionCard
            label="Visual"
            title="Evidências do enunciado"
            content={latexResolution.visualEvidenceUsed}
            tone="mist"
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <LatexSectionCard
          label="Parte 2"
          title="Explicação didática"
          content={compactDidacticExplanation(latexResolution.didacticExplanation)}
          tone="mist"
        />
        <div className="space-y-5">
          <LatexSectionCard
            label="Alertas"
            title="Erros comuns"
            content={latexResolution.commonPitfalls}
            tone="clay"
          />
          <LatexSectionCard
            label="Ensino"
            title="Dicas pedagógicas"
            content={latexResolution.teachingTips}
            tone="sand"
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DistractorSection
          content={latexResolution.distractors}
          options={options}
          topDistractor={topDistractor}
        />
        <LatexSectionCard
          label="Perfil"
          title="Perfil do item"
          content={latexResolution.itemProfile}
          tone="ink"
        />
      </div>
    </div>
  );
}
