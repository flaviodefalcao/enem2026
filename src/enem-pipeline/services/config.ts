import path from "node:path";
import dotenv from "dotenv";
import type { PipelineConfig } from "../types";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

export function getPipelineConfig(): PipelineConfig {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada.");
  }

  return {
    apiKey,
    models: {
      solver: process.env.OPENAI_ENEM_MODEL_SOLVER ?? "gpt-4.1-nano",
      explainer: process.env.OPENAI_ENEM_MODEL_EXPLAINER ?? "gpt-4.1-nano",
      reviewer: process.env.OPENAI_ENEM_MODEL_REVIEWER ?? "gpt-4.1-nano",
    },
    stageLimits: {
      theme: {
        maxOutputTokens: Number(process.env.OPENAI_ENEM_THEME_MAX_OUTPUT ?? "450"),
      },
      solver: {
        maxOutputTokens: Number(process.env.OPENAI_ENEM_SOLVER_MAX_OUTPUT ?? "1000"),
      },
      explainer: {
        maxOutputTokens: Number(process.env.OPENAI_ENEM_EXPLAINER_MAX_OUTPUT ?? "900"),
      },
      reviewer: {
        maxOutputTokens: Number(process.env.OPENAI_ENEM_REVIEWER_MAX_OUTPUT ?? "1200"),
      },
    },
    budgetUsd: Number(process.env.OPENAI_ENEM_BUDGET_USD ?? "5"),
    inputPath: path.resolve(process.cwd(), process.env.OPENAI_ENEM_INPUT ?? "data/questions.json"),
    outputDir: path.resolve(process.cwd(), process.env.OPENAI_ENEM_OUTPUT ?? "data/output"),
  };
}
