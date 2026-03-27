import { reviewerPrompt } from "../prompts/reviewer";
import { reviewerSchema } from "../schemas/reviewer";
import { validateWithSchema } from "../services/json-schema";
import { runStructuredOutput } from "../services/openai-client";
import type {
  ExplainerOutput,
  QuestionInput,
  ReviewerOutput,
  SolverOutput,
  StageArtifact,
} from "../types";
import type OpenAI from "openai";

export async function runReviewerStage(params: {
  client: OpenAI;
  model: string;
  maxOutputTokens: number;
  question: QuestionInput;
  solverOutput: SolverOutput;
  explainerOutput: ExplainerOutput;
}): Promise<StageArtifact<ReviewerOutput> & { usage: import("../types").UsageSnapshot }> {
  const result = await runStructuredOutput<ReviewerOutput>({
    client: params.client,
    model: params.model,
    maxOutputTokens: params.maxOutputTokens,
    prompt: reviewerPrompt,
    schema: reviewerSchema,
    question: params.question,
    solverOutput: params.solverOutput,
    explainerOutput: params.explainerOutput,
  });

  return {
    stage: "reviewer",
    model: params.model,
    promptVersion: reviewerPrompt.version,
    generatedAt: new Date().toISOString(),
    questionId: params.question.id,
    payload: validateWithSchema<ReviewerOutput>(
      reviewerSchema.schema,
      result.payload,
      "reviewer",
    ),
    usage: result.usage,
  };
}
