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

type QuestionOption = {
  option: string;
  text: string;
  assets: string[];
};

type ResolutionPanelProps = {
  resolution: ResolutionContent;
  latexResolution: LatexResolutionContent | null;
  examQuestionNumber: number;
  options: QuestionOption[];
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
  sand: "border-[#eadcc8] bg-[#fff8ed]",
  mist: "border-[#cddbe8] bg-[#f6fbff]",
  clay: "border-[#ecd2c7] bg-[#fff7f3]",
  ink: "border-[#d7dee7] bg-[#f7f9fc]",
} as const;

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
              className="overflow-x-auto rounded-[22px] bg-[#fffdf7] px-4 py-4 font-mono text-base leading-8 text-[#704c13] ring-1 ring-[#eadcc8]"
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
                <li key={item} className="flex gap-3 text-base leading-8 text-slate-700">
                  <span className="mt-[10px] h-2 w-2 rounded-full bg-[#8a6a22]" />
                  <InlineLatexText text={item} />
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={`${block.type}-${index}`}
            className="text-base leading-8 text-slate-700"
          >
            <InlineLatexText text={block.content} />
          </p>
        );
      })}
    </div>
  );
}

function InlineLatexText({ text }: { text: string }) {
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
              className="mx-[0.15em] inline-block rounded-md bg-[#fff1c9] px-2 py-[0.18rem] align-baseline font-mono text-[0.88em] leading-7 text-[#7a5518]"
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
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
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
}: {
  content: string;
  options: QuestionOption[];
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
    <article className="rounded-[28px] border border-[#ecd2c7] bg-[#fff7f3] p-5">
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
            className="rounded-[24px] border border-[#edd9d1] bg-white/85 p-4"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d9b6a6] bg-[#fff3ee] text-base font-semibold text-[#8e4f40]">
                {card.option}
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#8e4f40]">
                  Alternativa {card.option}
                </p>
                {card.optionText ? (
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {card.optionText}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {card.body.map((item) => (
                <p key={`${card.option}-${item}`} className="text-base leading-8 text-slate-700">
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
  latexResolution,
  examQuestionNumber,
  options,
}: ResolutionPanelProps) {
  const hasLatexResolution = Boolean(latexResolution);

  if (!hasLatexResolution) {
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
        <DistractorSection content={latexResolution.distractors} options={options} />
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
