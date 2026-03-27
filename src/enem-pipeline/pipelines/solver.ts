import { solverPrompt } from "../prompts/solver";
import { solverSchema } from "../schemas/solver";
import { validateWithSchema } from "../services/json-schema";
import { runStructuredOutput } from "../services/openai-client";
import type { QuestionInput, SolverOutput, StageArtifact } from "../types";
import type OpenAI from "openai";

export async function runSolverStage(params: {
  client: OpenAI;
  model: string;
  maxOutputTokens: number;
  question: QuestionInput;
}): Promise<StageArtifact<SolverOutput> & { usage: import("../types").UsageSnapshot }> {
  const result = await runStructuredOutput<SolverOutput>({
    client: params.client,
    model: params.model,
    maxOutputTokens: params.maxOutputTokens,
    prompt: solverPrompt,
    schema: solverSchema,
    question: params.question,
  });

  return {
    stage: "solver",
    model: params.model,
    promptVersion: solverPrompt.version,
    generatedAt: new Date().toISOString(),
    questionId: params.question.id,
    payload: validateWithSchema<SolverOutput>(solverSchema.schema, result.payload, "solver"),
    usage: result.usage,
  };
}
