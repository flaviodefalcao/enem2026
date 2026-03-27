import { latexPrompt } from "../prompts/latex";
import { latexSchema } from "../schemas/latex";
import { validateWithSchema } from "../services/json-schema";
import { runStructuredOutput } from "../services/openai-client";
import type {
  LatexOutput,
  QuestionInput,
  ReviewerOutput,
  StageArtifact,
  UsageSnapshot,
} from "../types";
import type OpenAI from "openai";

export async function runLatexStage(params: {
  client: OpenAI;
  model: string;
  maxOutputTokens: number;
  question: QuestionInput;
  reviewerOutput: ReviewerOutput;
}): Promise<StageArtifact<LatexOutput> & { usage: UsageSnapshot }> {
  const result = await runStructuredOutput<LatexOutput>({
    client: params.client,
    model: params.model,
    maxOutputTokens: params.maxOutputTokens,
    prompt: latexPrompt,
    schema: latexSchema,
    question: params.question,
    solverOutput: params.reviewerOutput.finalAnalysis,
  });

  return {
    stage: "latex",
    model: params.model,
    promptVersion: latexPrompt.version,
    generatedAt: new Date().toISOString(),
    questionId: params.question.id,
    payload: validateWithSchema<LatexOutput>(latexSchema.schema, result.payload, "latex"),
    usage: result.usage,
  };
}
