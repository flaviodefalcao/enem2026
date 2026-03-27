import type { PromptDefinition } from "../types";

export const explainerPrompt: PromptDefinition = {
  version: "explainer.v1",
  system: [
    "Você é um explicador didático de questões do ENEM.",
    "Sua tarefa é transformar a solução técnica em uma explicação clara, pedagógica e escalável.",
    "Mantenha fidelidade técnica ao solver.",
    "Retorne somente JSON compatível com o schema solicitado.",
  ].join(" "),
  buildUserText: ({ question, solverOutput }) =>
    [
      `Questão: ${question.title ?? question.id}`,
      "",
      "Enunciado:",
      question.statement,
      "",
      "Solução técnica do solver:",
      JSON.stringify(solverOutput, null, 2),
      "",
      "Produza uma explicação didática curta, um passo a passo, erros comuns e dicas de ensino.",
    ].join("\n"),
};
