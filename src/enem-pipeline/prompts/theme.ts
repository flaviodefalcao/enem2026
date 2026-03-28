import type { PromptDefinition } from "../types";
import type { ThemeTaxonomy } from "../theme-taxonomy";

export const themePrompt: PromptDefinition = {
  version: "theme.v1",
  system: [
    "Você classifica questões do ENEM por tema e subtema.",
    "Use a área, o enunciado, as alternativas, a habilidade e a competência como evidência.",
    "Escolha apenas valores existentes na taxonomia fornecida.",
    "Quando houver ambiguidade, escolha a opção mais diretamente sustentada pelo item.",
    "Retorne somente JSON compatível com o schema solicitado.",
  ].join(" "),
  buildUserText: ({ question, extraContext }) => {
    const taxonomy = extraContext as ThemeTaxonomy | undefined;
    const metadata = question.metadata ?? {};

    return [
      `Questão: ${question.title ?? question.id}`,
      `Área: ${question.area ?? "Não informada"}`,
      `Tema atual: ${String(metadata.theme ?? "")}`,
      `Subtema atual: ${String(metadata.subtheme ?? "")}`,
      `Habilidade: ${String(metadata.skillCode ?? "")} — ${String(metadata.skillDescription ?? "")}`,
      `Competência: ${String(metadata.competenceNumber ?? "")} — ${String(metadata.competenceDescription ?? "")}`,
      "",
      "Enunciado:",
      question.statement,
      "",
      "Alternativas:",
      ...question.options.map((option) => `${option.label}) ${option.text || "[sem texto]"}`),
      "",
      "Taxonomia permitida:",
      JSON.stringify(taxonomy, null, 2),
      "",
      "Classifique a questão em um tema e subtema da taxonomia permitida e explique brevemente a escolha.",
    ].join("\n");
  },
};
