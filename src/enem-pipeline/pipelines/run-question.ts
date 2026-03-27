import path from "node:path";
import { runExplainerStage } from "./explainer";
import { runReviewerStage } from "./reviewer";
import { runSolverStage } from "./solver";
import {
  fileExists,
  readJsonFile,
  saveFinalOutput,
  saveStageArtifact,
} from "../services/file-utils";
import type { PipelineConfig, QuestionInput } from "../types";
import type OpenAI from "openai";

export async function runQuestionPipeline(params: {
  client: OpenAI;
  config: PipelineConfig;
  question: QuestionInput;
  spentUsd: number;
}) {
  const { client, config, question, spentUsd } = params;

  if (spentUsd >= config.budgetUsd) {
    throw new Error(
      `Orçamento local esgotado. Gasto acumulado: US$ ${spentUsd.toFixed(4)} / limite US$ ${config.budgetUsd.toFixed(2)}.`,
    );
  }

  const finalPath = path.join(config.outputDir, question.id, "final.json");
  if (await fileExists(finalPath)) {
    const existing = await readJsonFile<{ usage?: { totalEstimatedCostUsd?: number } }>(finalPath);
    return {
      finalPath,
      totalEstimatedCostUsd: Number(existing.usage?.totalEstimatedCostUsd ?? 0),
    };
  }

  const solverArtifact = await runSolverStage({
    client,
    model: config.models.solver,
    maxOutputTokens: config.stageLimits.solver.maxOutputTokens,
    question,
  });
  await saveStageArtifact(config.outputDir, question.id, "solver", solverArtifact);

  let totalCostUsd = spentUsd + solverArtifact.usage.estimatedCostUsd;
  if (totalCostUsd >= config.budgetUsd) {
    throw new Error(
      `Orçamento local atingido após solver da questão ${question.id}. Gasto: US$ ${totalCostUsd.toFixed(4)} / limite US$ ${config.budgetUsd.toFixed(2)}.`,
    );
  }

  const explainerArtifact = await runExplainerStage({
    client,
    model: config.models.explainer,
    maxOutputTokens: config.stageLimits.explainer.maxOutputTokens,
    question,
    solverOutput: solverArtifact.payload,
  });
  await saveStageArtifact(config.outputDir, question.id, "explainer", explainerArtifact);

  totalCostUsd += explainerArtifact.usage.estimatedCostUsd;
  if (totalCostUsd >= config.budgetUsd) {
    throw new Error(
      `Orçamento local atingido após explainer da questão ${question.id}. Gasto: US$ ${totalCostUsd.toFixed(4)} / limite US$ ${config.budgetUsd.toFixed(2)}.`,
    );
  }

  const reviewerArtifact = await runReviewerStage({
    client,
    model: config.models.reviewer,
    maxOutputTokens: config.stageLimits.reviewer.maxOutputTokens,
    question,
    solverOutput: solverArtifact.payload,
    explainerOutput: explainerArtifact.payload,
  });
  await saveStageArtifact(config.outputDir, question.id, "reviewer", reviewerArtifact);

  await saveFinalOutput(config.outputDir, question.id, {
    questionId: question.id,
    generatedAt: new Date().toISOString(),
    usage: {
      solver: solverArtifact.usage,
      explainer: explainerArtifact.usage,
      reviewer: reviewerArtifact.usage,
      totalEstimatedCostUsd: Number(
        (
          solverArtifact.usage.estimatedCostUsd +
          explainerArtifact.usage.estimatedCostUsd +
          reviewerArtifact.usage.estimatedCostUsd
        ).toFixed(6),
      ),
    },
    finalAnalysis: reviewerArtifact.payload.finalAnalysis,
  });

  return {
    finalPath,
    totalEstimatedCostUsd: Number(
      (
        solverArtifact.usage.estimatedCostUsd +
        explainerArtifact.usage.estimatedCostUsd +
        reviewerArtifact.usage.estimatedCostUsd
      ).toFixed(6),
    ),
  };
}
