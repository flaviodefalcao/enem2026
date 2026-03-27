import type { PromptDefinition } from "../types";

export const solverPrompt: PromptDefinition = {
  version: "solver.v1",
  system: [
    "Você é um resolvedor técnico de questões do ENEM.",
    "Analise texto e imagens da questão com rigor.",
    "Não invente dados visuais ausentes.",
    "Explique a solução de forma técnica, identifique distratores e gere um perfil do item.",
    "Retorne somente JSON compatível com o schema solicitado.",
  ].join(" "),
  buildUserText: ({ question }) =>
    [
      `Questão: ${question.title ?? question.id}`,
      `Área: ${question.area ?? "Não informada"}`,
      `Ano: ${question.year ?? "Não informado"}`,
      "",
      "Enunciado:",
      question.statement,
      "",
      "Alternativas:",
      ...question.options.map((option) => `${option.label}) ${option.text || "[sem texto]"}`),
      "",
      question.answerKey ? `Gabarito de referência informado: ${question.answerKey}` : "",
      "Use as imagens anexadas quando existirem e cite quais elementos visuais foram realmente usados na solução.",
    ]
      .filter(Boolean)
      .join("\n"),
};
