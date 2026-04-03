"use client";

import { useMemo, useState } from "react";

type QuestionImagePreviewProps = {
  imageUrl: string;
  title: string;
  statement: string;
  statementAssets: string[];
  sourcePages: number[];
  correctOption: string;
  options: Array<{
    option: string;
    text: string;
    assets: string[];
    displayMode?: "auto" | "asset_only" | "suppressed";
    suppressedReason?: string;
  }>;
};

type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

type StatementLayout = {
  mainBlocks: ContentBlock[];
  sourceText: string | null;
  trailingBlocks: ContentBlock[];
};

const PROMPT_LEAD_PATTERN =
  /(Nesse|Nessa|Nesses|Nessas|No texto|Na tira|Na charge|Na imagem|No gr[aá]fico|Na tabela|Considerando|A partir|Com base|Em rela[cç][aã]o|Nesse contexto|Esse texto|Essa tirinha|Essa imagem|Esses dados|Esse cartaz|O texto|A tirinha|A charge|O gr[aá]fico|A tabela)/i;

function normalizeInlineText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseStatementBlocks(statement: string): ContentBlock[] {
  const lines = statement.split("\n").map((line) => line.trimEnd());
  const blocks: ContentBlock[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push({
      type: "paragraph",
      text: normalizeInlineText(paragraphLines.join(" ")),
    });
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    blocks.push({
      type: "list",
      items: listItems.map((item) => normalizeInlineText(item)),
    });
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("•")) {
      flushParagraph();
      listItems.push(line.replace(/^•\s*/, ""));
      continue;
    }

    if (listItems.length > 0) {
      listItems[listItems.length - 1] = `${listItems[listItems.length - 1]} ${line}`;
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

function splitInlineSourceLine(line: string) {
  const boundary = findInlineSourceBoundary(line);

  if (boundary === null || boundary <= 0 || boundary >= line.length) {
    return null;
  }

  const sourceText = normalizeInlineText(line.slice(0, boundary));
  const trailingText = line.slice(boundary).trim();

  if (!sourceText || !trailingText) {
    return null;
  }

  return {
    sourceText,
    trailingText,
  };
}

function trimStatementBeforeOptions(text: string) {
  const lines = text.split("\n");
  const optionPattern = /^[A-E][.):]?\s+/;
  const optionIndexes = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => optionPattern.test(line))
    .map(({ index }) => index);

  if (optionIndexes.length >= 2) {
    return lines.slice(0, optionIndexes[0]).join("\n").trim();
  }

  return text.trim();
}

function isSourceLine(line: string) {
  return /^(Dispon[ií]vel em:|Fonte:|Adaptado de:|Extra[ií]do de:|Acesso em:)/i.test(line);
}

function isPromptLead(line: string) {
  return new RegExp(`^${PROMPT_LEAD_PATTERN.source}`, "i").test(line);
}

function isParentheticalTailLine(line: string) {
  return /^\([^)]*\)\.?$/i.test(line);
}

function findInlineSourceBoundary(text: string) {
  const normalized = normalizeInlineText(text);
  const accessPattern =
    /Acesso em:\s*.*?\d{4}(?:\s*\([^)]*\))?\.?/i;
  const accessMatch = accessPattern.exec(normalized);

  if (accessMatch && accessMatch.index !== undefined) {
    return accessMatch.index + accessMatch[0].length;
  }

  const sourcePattern =
    /(?:Dispon[ií]vel em:|Fonte:|Adaptado de:|Extra[ií]do de:)\s*.*?(?:\([^)]*\))?\./i;
  const sourceMatch = sourcePattern.exec(normalized);

  if (sourceMatch && sourceMatch.index !== undefined) {
    return sourceMatch.index + sourceMatch[0].length;
  }

  return null;
}

function findPromptLeadIndex(text: string) {
  const normalized = normalizeInlineText(text);
  const inlinePromptPattern = new RegExp(`(?:^|[.?!]\\s+)${PROMPT_LEAD_PATTERN.source}`, "i");
  const match = inlinePromptPattern.exec(normalized);

  if (!match || match.index === undefined) {
    return null;
  }

  const boundaryOffset = match[0].length - match[1].length;
  return match.index + boundaryOffset;
}

function splitSourceAndPromptInline(text: string) {
  const normalized = normalizeInlineText(text);
  const hasSourceMarker = /(Dispon[ií]vel em:|Fonte:|Adaptado de:|Extra[ií]do de:|Acesso em:)/i.test(
    normalized,
  );

  if (!hasSourceMarker) {
    return null;
  }

  const boundaryAfterSource = findInlineSourceBoundary(normalized);

  if (boundaryAfterSource !== null && boundaryAfterSource < normalized.length) {
    const sourceText = normalized.slice(0, boundaryAfterSource).trim();
    const trailingText = normalized.slice(boundaryAfterSource).trim();

    if (sourceText && trailingText) {
      return {
        sourceText,
        trailingText,
      };
    }
  }

  const promptStart = findPromptLeadIndex(normalized);

  if (promptStart === null || promptStart <= 0) {
    return null;
  }

  const sourceText = normalized.slice(0, promptStart).trim();
  const trailingText = normalized.slice(promptStart).trim();

  if (!sourceText || !trailingText) {
    return null;
  }

  return {
    sourceText,
    trailingText,
  };
}

function parseStatementLayout(statement: string): StatementLayout {
  const lines = statement.split("\n").map((line) => line.trimEnd());
  const sourceStart = lines.findIndex((rawLine) => isSourceLine(rawLine.trim()));

  if (sourceStart === -1) {
    return {
      mainBlocks: parseStatementBlocks(statement),
      sourceText: null,
      trailingBlocks: [],
    };
  }

  const mainText = lines.slice(0, sourceStart).join("\n").trim();
  const sourceLines: string[] = [];
  let promptLines: string[] = [];

  for (let index = sourceStart; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (promptLines.length > 0) {
      promptLines.push(rawLine);
      continue;
    }

    if (!line) {
      if (sourceLines.length > 0) {
        promptLines = lines.slice(index + 1);
        break;
      }
      continue;
    }

    const inlineSplit = splitInlineSourceLine(rawLine);
    if (inlineSplit) {
      sourceLines.push(inlineSplit.sourceText);
      promptLines = [inlineSplit.trailingText, ...lines.slice(index + 1)];
      break;
    }

    if (
      sourceLines.length > 0 &&
      !isSourceLine(line) &&
      !isParentheticalTailLine(line)
    ) {
      promptLines = lines.slice(index);
      break;
    }

    sourceLines.push(rawLine);
  }

  const sourceText = normalizeInlineText(sourceLines.join(" "));
  const trailingText = trimStatementBeforeOptions(promptLines.join("\n").trim());

  if (sourceText) {
    return {
      mainBlocks: mainText ? parseStatementBlocks(mainText) : [],
      sourceText,
      trailingBlocks: trailingText ? parseStatementBlocks(trailingText) : [],
    };
  }

  const combinedSourceAndTail = lines.slice(sourceStart).join(" ").trim();
  const inlineSplit = splitSourceAndPromptInline(combinedSourceAndTail);

  if (inlineSplit) {
    return {
      mainBlocks: mainText ? parseStatementBlocks(mainText) : [],
      sourceText: inlineSplit.sourceText,
      trailingBlocks: parseStatementBlocks(trimStatementBeforeOptions(inlineSplit.trailingText)),
    };
  }

  return {
    mainBlocks: mainText ? parseStatementBlocks(mainText) : [],
    sourceText: null,
    trailingBlocks: [],
  };
}

export function QuestionImagePreview({
  imageUrl,
  title,
  statement,
  statementAssets,
  sourcePages,
  correctOption,
  options,
}: QuestionImagePreviewProps) {
  const hasOfficialAnswer = ["A", "B", "C", "D", "E"].includes(correctOption);
  const [zoomedAsset, setZoomedAsset] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const statementLayout = useMemo(() => parseStatementLayout(statement), [statement]);
  const hasStatementAssets = statementAssets.length > 0;
  const primaryAsset = statementAssets[0] ?? imageUrl;
  const hasMeaningfulOptionContent = options.some(
    (item) =>
      item.text.trim().length > 0 ||
      item.assets.length > 0 ||
      item.displayMode === "asset_only",
  );
  const hasRenderableOptions = hasMeaningfulOptionContent;
  const fullQuestionPreservedInStatementAsset =
    hasStatementAssets &&
    options.every(
      (item) =>
        item.text.trim().length === 0 &&
        item.assets.length === 0 &&
        item.displayMode !== "asset_only",
    );
  const hideAlternativesSection =
    fullQuestionPreservedInStatementAsset || (!hasMeaningfulOptionContent && hasStatementAssets);

  return (
    <>
      <article className="overflow-hidden rounded-[30px] border border-[#d6e6ff] bg-[#fbfdff] shadow-card">
        <div className="border-b border-[#e4eefb] bg-[#f1f7ff] px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5a7ead]">
                Questão formatada como prova
              </p>
              <p className="mt-2 font-display text-2xl text-ink">{title}</p>
              {!hasOfficialAnswer ? (
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
                  Questão anulada pelo Inep
                </p>
              ) : null}
              {sourcePages.length > 0 ? (
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  Extraída das páginas {sourcePages.join(", ")}
                </p>
              ) : null}
            </div>

            {primaryAsset ? (
              <button
                type="button"
                onClick={() => setZoomedAsset(primaryAsset)}
                className="rounded-full border border-[#d6e6ff] bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-clay/50 hover:text-clay"
              >
                Ampliar imagem
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-8 px-5 py-6 sm:px-7 sm:py-7">
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-[#d6e6ff] bg-white text-sm font-semibold text-ink">
                01
              </span>
              <h2 className="font-display text-xl text-ink">Enunciado</h2>
            </div>

            <div className="space-y-4 rounded-[24px] border border-[#dfeafb] bg-white px-5 py-5">
              {statementLayout.mainBlocks.map((block, index) =>
                block.type === "paragraph" ? (
                  <p
                    key={`${index}-${block.text.slice(0, 24)}`}
                    className="text-[1.02rem] leading-8 text-[#3d5f8a]"
                  >
                    {block.text}
                  </p>
                ) : (
                  <ul
                    key={`${index}-${block.items[0]?.slice(0, 24) ?? "list"}`}
                    className="space-y-2 pl-6 text-[1.01rem] leading-8 text-[#3d5f8a]"
                  >
                    {block.items.map((item) => (
                      <li key={item} className="list-disc marker:text-[#6aa5e8]">
                        {item}
                      </li>
                    ))}
                  </ul>
                ),
              )}

              {hasStatementAssets ? (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {fullQuestionPreservedInStatementAsset
                      ? "Questão preservada no asset"
                      : "Figuras, gráficos e tabelas da questão"}
                  </p>
                  <div
                    className={`grid gap-4 ${
                      statementAssets.length === 1 ? "grid-cols-1" : "md:grid-cols-2"
                    }`}
                  >
                    {statementAssets.map((asset, index) => (
                      <button
                        key={asset}
                        type="button"
                        onClick={() => setZoomedAsset(asset)}
                        className="group rounded-[24px] border border-[#dfeafb] bg-[#f7fbff] p-3 text-left transition hover:border-clay/50"
                      >
                        <div
                          className={`flex items-center justify-center overflow-hidden rounded-[18px] bg-white p-3 ${
                            fullQuestionPreservedInStatementAsset ? "min-h-[180px]" : "min-h-[260px]"
                          }`}
                        >
                          <img
                            src={asset}
                            alt={`Elemento visual ${index + 1} da ${title}`}
                            className={`w-auto max-w-full object-contain ${
                              fullQuestionPreservedInStatementAsset ? "max-h-[760px]" : "max-h-[420px]"
                            }`}
                          />
                        </div>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {fullQuestionPreservedInStatementAsset ? "Questão completa" : `Asset ${index + 1}`}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {statementLayout.sourceText ? (
                <div className="border-t border-[#e4eefb] pt-4">
                  <p className="text-right text-[0.84rem] font-semibold leading-6 text-[#5a6f8d]">
                    {statementLayout.sourceText}
                  </p>
                </div>
              ) : null}

              {statementLayout.trailingBlocks.length > 0 ? (
                <div className="space-y-4 border-t border-[#e4eefb] pt-5">
                  {statementLayout.trailingBlocks.map((block, index) =>
                    block.type === "paragraph" ? (
                      <p
                        key={`tail-${index}-${block.text.slice(0, 24)}`}
                        className="text-[1.02rem] leading-8 text-[#3d5f8a]"
                      >
                        {block.text}
                      </p>
                    ) : (
                      <ul
                        key={`tail-${index}-${block.items[0]?.slice(0, 24) ?? "list"}`}
                        className="space-y-2 pl-6 text-[1.01rem] leading-8 text-[#3d5f8a]"
                      >
                        {block.items.map((item) => (
                          <li key={item} className="list-disc marker:text-[#6aa5e8]">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ),
                  )}
                </div>
              ) : null}
            </div>
          </section>

          {!hideAlternativesSection ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-[#d6e6ff] bg-white text-sm font-semibold text-ink">
                  02
                </span>
                <h2 className="font-display text-xl text-ink">Alternativas</h2>
              </div>
              <p className="text-sm text-slate-500">
                {hasOfficialAnswer
                  ? "Clique para revelar a correta."
                  : "Item anulado: sem marcação de alternativa correta."}
              </p>
            </div>

            {!hasRenderableOptions && hasStatementAssets ? (
              <div className="rounded-[24px] border border-[#dfeafb] bg-white px-5 py-5">
                <p className="text-[1.01rem] italic leading-8 text-slate-500">
                  As alternativas desta questão estão preservadas no elemento visual do enunciado.
                </p>
              </div>
            ) : (
            <div className="space-y-3">
              {options.map((item) => (
                <button
                  key={item.option}
                  type="button"
                  onClick={() => setSelectedOption(item.option)}
                  className={`block w-full rounded-[24px] border px-5 py-4 text-left transition ${
                    !hasOfficialAnswer || selectedOption === null
                      ? "border-[#dfeafb] bg-white hover:border-clay/50 hover:bg-[#f7fbff]"
                      : item.option === correctOption
                        ? "border-emerald-300 bg-emerald-50"
                        : selectedOption === item.option
                          ? "border-rose-300 bg-rose-50"
                          : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                        !hasOfficialAnswer || selectedOption === null
                          ? "border-[#d6e6ff] bg-[#f1f7ff] text-ink"
                          : item.option === correctOption
                            ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                            : selectedOption === item.option
                              ? "border-rose-300 bg-rose-100 text-rose-900"
                              : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {item.option}
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      {item.text ? (
                        <p className="text-[1.01rem] leading-8 text-[#3d5f8a]">
                          {item.text}
                        </p>
                      ) : item.displayMode === "suppressed" ? (
                        <p className="text-[1.01rem] italic leading-8 text-slate-500">
                          {item.suppressedReason ??
                            "Texto da alternativa ocultado por baixa confiança na extração."}
                        </p>
                      ) : (
                        <p className="text-[1.01rem] italic leading-8 text-slate-500">
                          Alternativa composta por elemento visual extraído do PDF.
                        </p>
                      )}

                      {item.assets.length > 0 ? (
                        <div
                          className={`grid gap-3 ${
                            item.assets.length === 1 ? "grid-cols-1" : "md:grid-cols-2"
                          }`}
                        >
                          {item.assets.map((asset, assetIndex) => (
                            <button
                              key={asset}
                              type="button"
                              onClick={() => setZoomedAsset(asset)}
                              className="rounded-[20px] border border-[#dfeafb] bg-[#f7fbff] p-3 text-left transition hover:border-clay/50"
                            >
                              <div className="flex min-h-[180px] items-center justify-center overflow-hidden rounded-[16px] bg-white p-2">
                                <img
                                  src={asset}
                                  alt={`Asset ${assetIndex + 1} da alternativa ${item.option}`}
                                  className="max-h-[280px] w-auto max-w-full object-contain"
                                />
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {selectedOption !== null && hasOfficialAnswer ? (
                        item.option === correctOption || selectedOption === item.option ? (
                          <p
                            className={`text-sm font-semibold ${
                              item.option === correctOption
                                ? "text-emerald-700"
                                : "text-rose-700"
                            }`}
                          >
                            {item.option === correctOption
                              ? "Resposta correta"
                              : "Sua escolha"}
                          </p>
                        ) : null
                      ) : null}

                      {selectedOption !== null && !hasOfficialAnswer && selectedOption === item.option ? (
                        <p className="text-sm font-semibold text-amber-700">
                          Questão anulada
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            )}
          </section>
          ) : null}
        </div>
      </article>

      {zoomedAsset ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 py-10">
          <div className="w-full max-w-6xl rounded-[32px] bg-white p-4 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Visualização ampliada
                </p>
                <p className="mt-1 text-sm text-slate-600">{title}</p>
              </div>
              <button
                type="button"
                onClick={() => setZoomedAsset(null)}
                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
              >
                Fechar
              </button>
            </div>

            <div className="flex max-h-[80vh] items-center justify-center overflow-auto rounded-[24px] border border-slate-200 bg-[#f7fbff] p-4">
              <img
                src={zoomedAsset}
                alt={`Imagem ampliada da ${title}`}
                className="h-auto max-h-[72vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
