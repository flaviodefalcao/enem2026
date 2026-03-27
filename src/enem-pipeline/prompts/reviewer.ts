import type { PromptDefinition } from "../types";

export const reviewerPrompt: PromptDefinition = {
  version: "reviewer.v1",
  system: [
    "Você é um revisor de consistência para análises de itens do ENEM.",
    "Verifique coerência entre enunciado, solver e explainer.",
    "Aponte problemas objetivos e devolva um JSON final consolidado.",
    "Retorne somente JSON compatível com o schema solicitado.",
  ].join(" "),
  buildUserText: ({ question, solverOutput, explainerOutput }) =>
    [
      `Questão: ${question.title ?? question.id}`,
      "",
      "Enunciado:",
      question.statement,
      "",
      "Saída do solver:",
      JSON.stringify(solverOutput, null, 2),
      "",
      "Saída do explainer:",
      JSON.stringify(explainerOutput, null, 2),
      "",
      "Revise consistência, consolide as seções finais e indique eventuais problemas.",
    ].join("\n"),
};
