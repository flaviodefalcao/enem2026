import { explainerPrompt } from "../prompts/explainer";
import { explainerSchema } from "../schemas/explainer";
import { validateWithSchema } from "../services/json-schema";
import { runStructuredOutput } from "../services/openai-client";
import type { ExplainerOutput, QuestionInput, SolverOutput, StageArtifact } from "../types";
import type OpenAI from "openai";

export async function runExplainerStage(params: {
  client: OpenAI;
  model: string;
  maxOutputTokens: number;
  question: QuestionInput;
  solverOutput: SolverOutput;
}): Promise<StageArtifact<ExplainerOutput> & { usage: import("../types").UsageSnapshot }> {
  const result = await runStructuredOutput<ExplainerOutput>({
    client: params.client,
    model: params.model,
    maxOutputTokens: params.maxOutputTokens,
    prompt: explainerPrompt,
    schema: explainerSchema,
    question: params.question,
    solverOutput: params.solverOutput,
  });

  return {
    stage: "explainer",
    model: params.model,
    promptVersion: explainerPrompt.version,
    generatedAt: new Date().toISOString(),
    questionId: params.question.id,
    payload: validateWithSchema<ExplainerOutput>(
      explainerSchema.schema,
      result.payload,
      "explainer",
    ),
    usage: result.usage,
  };
}
