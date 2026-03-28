import { themePrompt } from "../prompts/theme";
import { themeSchema } from "../schemas/theme";
import { validateWithSchema } from "../services/json-schema";
import { runStructuredOutput } from "../services/openai-client";
import { getThemeTaxonomy } from "../theme-taxonomy";
import type {
  QuestionInput,
  StageArtifact,
  ThemeClassificationOutput,
} from "../types";
import type OpenAI from "openai";

export async function runThemeClassifierStage(params: {
  client: OpenAI;
  model: string;
  maxOutputTokens: number;
  question: QuestionInput;
}): Promise<StageArtifact<ThemeClassificationOutput> & { usage: import("../types").UsageSnapshot }> {
  const areaSlug = String(params.question.metadata?.areaSlug ?? "").trim();
  const taxonomy = getThemeTaxonomy(areaSlug);

  if (!taxonomy) {
    throw new Error(`Taxonomia de tema não encontrada para a área ${areaSlug || "(vazia)"}.`);
  }

  const result = await runStructuredOutput<ThemeClassificationOutput>({
    client: params.client,
    model: params.model,
    maxOutputTokens: params.maxOutputTokens,
    prompt: themePrompt,
    schema: themeSchema,
    question: params.question,
    extraContext: taxonomy,
  });

  return {
    stage: "theme",
    model: params.model,
    promptVersion: themePrompt.version,
    generatedAt: new Date().toISOString(),
    questionId: params.question.id,
    payload: validateWithSchema<ThemeClassificationOutput>(
      themeSchema.schema,
      result.payload,
      "theme",
    ),
    usage: result.usage,
  };
}
