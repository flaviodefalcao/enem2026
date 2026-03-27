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

export function QuestionImagePreview({
  imageUrl,
  title,
  statement,
  statementAssets,
  sourcePages,
  correctOption,
  options,
}: QuestionImagePreviewProps) {
  const [zoomedAsset, setZoomedAsset] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const contentBlocks = useMemo(() => parseStatementBlocks(statement), [statement]);
  const hasStatementAssets = statementAssets.length > 0;
  const primaryAsset = statementAssets[0] ?? imageUrl;

  return (
    <>
      <article className="overflow-hidden rounded-[30px] border border-[#dccfb8] bg-[#fffdf8] shadow-card">
        <div className="border-b border-[#e9dfce] bg-[#f7f0e4] px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d7350]">
                Questão formatada como prova
              </p>
              <p className="mt-2 font-display text-2xl text-ink">{title}</p>
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
                className="rounded-full border border-[#d7c6ae] bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-clay/40 hover:text-clay"
              >
                Ampliar imagem
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-8 px-5 py-6 sm:px-7 sm:py-7">
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-[#d9ccb8] bg-white text-sm font-semibold text-ink">
                01
              </span>
              <h2 className="font-display text-xl text-ink">Enunciado</h2>
            </div>

            <div className="space-y-4 rounded-[24px] border border-[#e5dac8] bg-white px-5 py-5">
              {contentBlocks.map((block, index) =>
                block.type === "paragraph" ? (
                  <p
                    key={`${index}-${block.text.slice(0, 24)}`}
                    className="text-[1.02rem] leading-8 text-[#2c3748]"
                  >
                    {block.text}
                  </p>
                ) : (
                  <ul
                    key={`${index}-${block.items[0]?.slice(0, 24) ?? "list"}`}
                    className="space-y-2 pl-6 text-[1.01rem] leading-8 text-[#2c3748]"
                  >
                    {block.items.map((item) => (
                      <li key={item} className="list-disc marker:text-[#8d7350]">
                        {item}
                      </li>
                    ))}
                  </ul>
                ),
              )}

              {hasStatementAssets ? (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Figuras, gráficos e tabelas da questão
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
                        className="group rounded-[24px] border border-[#e5dac8] bg-[#fcf8f2] p-3 text-left transition hover:border-clay/40"
                      >
                        <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-[18px] bg-white p-3">
                          <img
                            src={asset}
                            alt={`Elemento visual ${index + 1} da ${title}`}
                            className="max-h-[420px] w-auto max-w-full object-contain"
                          />
                        </div>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Asset {index + 1}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-[#d9ccb8] bg-white text-sm font-semibold text-ink">
                  02
                </span>
                <h2 className="font-display text-xl text-ink">Alternativas</h2>
              </div>
              <p className="text-sm text-slate-500">
                Clique para revelar a correta.
              </p>
            </div>

            <div className="space-y-3">
              {options.map((item) => (
                <button
                  key={item.option}
                  type="button"
                  onClick={() => setSelectedOption(item.option)}
                  className={`block w-full rounded-[24px] border px-5 py-4 text-left transition ${
                    selectedOption === null
                      ? "border-[#e5dac8] bg-white hover:border-clay/40 hover:bg-[#fffaf1]"
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
                        selectedOption === null
                          ? "border-[#d9ccb8] bg-[#f7f0e4] text-ink"
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
                        <p className="text-[1.01rem] leading-8 text-[#2c3748]">
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
                              className="rounded-[20px] border border-[#e5dac8] bg-[#fcf8f2] p-3 text-left transition hover:border-clay/40"
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

                      {selectedOption !== null ? (
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
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
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

            <div className="flex max-h-[80vh] items-center justify-center overflow-auto rounded-[24px] border border-slate-200 bg-[#fcf8f2] p-4">
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
