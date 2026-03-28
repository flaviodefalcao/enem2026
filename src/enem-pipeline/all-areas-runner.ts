import fs from "node:fs/promises";
import path from "node:path";
import { getPipelineConfig } from "./services/config";
import { createOpenAIClient } from "./services/openai-client";
import {
  ensureDir,
  fileExists,
  readJsonFile,
  readQuestionsFile,
  saveStageArtifact,
  writeJson,
} from "./services/file-utils";
import { runQuestionPipeline } from "./pipelines/run-question";
import { runLatexStage } from "./pipelines/latex";
import { runThemeClassifierStage } from "./pipelines/theme-classifier";
import type {
  LatexOutput,
  QuestionInput,
  ReviewerOutput,
  ThemeClassificationOutput,
} from "./types";

function readCliArg(flag: string) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function sanitizeLatexString(value: string) {
  return value
    .replace(/\\'a/g, "á")
    .replace(/\\'e/g, "é")
    .replace(/\\'i/g, "í")
    .replace(/\\'o/g, "ó")
    .replace(/\\'u/g, "ú")
    .replace(/\\'A/g, "Á")
    .replace(/\\'E/g, "É")
    .replace(/\\'I/g, "Í")
    .replace(/\\'O/g, "Ó")
    .replace(/\\'U/g, "Ú")
    .replace(/\\~a/g, "ã")
    .replace(/\\~o/g, "õ")
    .replace(/\\~A/g, "Ã")
    .replace(/\\~O/g, "Õ")
    .replace(/\\\^a/g, "â")
    .replace(/\\\^e/g, "ê")
    .replace(/\\\^i/g, "î")
    .replace(/\\\^o/g, "ô")
    .replace(/\\\^u/g, "û")
    .replace(/\\c\{c\}/g, "ç")
    .replace(/\\c\{C\}/g, "Ç");
}

function sanitizeLatexPayload(payload: LatexOutput): LatexOutput {
  const sanitizedFullDocument = sanitizeLatexString(payload.fullDocument);
  const fullDocument =
    sanitizedFullDocument.includes("\\documentclass")
      ? sanitizedFullDocument
      : [
          "\\documentclass{article}",
          "\\usepackage[utf8]{inputenc}",
          "\\usepackage{amsmath}",
          "\\usepackage{geometry}",
          "\\geometry{margin=2cm}",
          "\\begin{document}",
          "",
          sanitizedFullDocument,
          "",
          "\\end{document}",
        ].join("\n");

  return {
    technicalSolution: sanitizeLatexString(payload.technicalSolution),
    formulasUsed: sanitizeLatexString(payload.formulasUsed),
    visualEvidenceUsed: sanitizeLatexString(payload.visualEvidenceUsed),
    didacticExplanation: sanitizeLatexString(payload.didacticExplanation),
    commonPitfalls: sanitizeLatexString(payload.commonPitfalls),
    teachingTips: sanitizeLatexString(payload.teachingTips),
    distractors: sanitizeLatexString(payload.distractors),
    itemProfile: sanitizeLatexString(payload.itemProfile),
    fullDocument,
  };
}

async function readFinalAnalysis(outputDir: string, questionId: string) {
  const finalPath = path.join(outputDir, questionId, "final.json");
  const raw = await fs.readFile(finalPath, "utf-8");
  const parsed = JSON.parse(raw) as { finalAnalysis: ReviewerOutput["finalAnalysis"] };
  return parsed.finalAnalysis;
}

async function writeLatexFile(outputDir: string, questionId: string, payload: LatexOutput) {
  const texPath = path.join(outputDir, questionId, "final.tex");
  await fs.writeFile(texPath, payload.fullDocument, "utf-8");
  return texPath;
}

function getAreaSlug(question: QuestionInput) {
  return String(question.metadata?.areaSlug ?? "");
}

function shouldGenerateLatex(question: QuestionInput) {
  const areaSlug = getAreaSlug(question);
  return areaSlug === "matematica" || areaSlug === "ciencias-natureza";
}

async function main() {
  const config = getPipelineConfig();
  const inputPath = readCliArg("--input") ?? path.resolve(process.cwd(), "data/questions-enem-2024-all-areas.json");
  const outputDir = readCliArg("--output") ?? path.resolve(process.cwd(), "data/output-enem-2024-all-areas");
  const areas = (readCliArg("--areas") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const skipTheme = hasFlag("--skip-theme");
  const skipResolution = hasFlag("--skip-resolution");
  const skipLatex = hasFlag("--skip-latex");

  const questions = (await readQuestionsFile(inputPath)).filter((question) => {
    if (areas.length === 0) return true;
    return areas.includes(getAreaSlug(question));
  });

  await ensureDir(outputDir);
  const client = await createOpenAIClient(config.apiKey);
  let spentUsd = 0;

  console.log(
    `Pipeline multiárea: modelos solver=${config.models.solver}, explainer=${config.models.explainer}, reviewer=${config.models.reviewer}, orçamento local=US$ ${config.budgetUsd.toFixed(2)}.`,
  );

  for (const question of questions) {
    const themePath = path.join(outputDir, question.id, "00-theme.json");

    if (!skipTheme && getAreaSlug(question) !== "matematica") {
      if (!(await fileExists(themePath))) {
        const themeArtifact = await runThemeClassifierStage({
          client,
          model: config.models.solver,
          maxOutputTokens: config.stageLimits.theme.maxOutputTokens,
          question,
        });
        await saveStageArtifact(outputDir, question.id, "theme", themeArtifact);
        spentUsd += themeArtifact.usage.estimatedCostUsd;
      } else {
        const existing = await readJsonFile<{ usage?: { estimatedCostUsd?: number } }>(themePath);
        spentUsd += Number(existing.usage?.estimatedCostUsd ?? 0);
      }
    }

    if (spentUsd >= config.budgetUsd) {
      throw new Error(`Orçamento local esgotado antes da etapa de resolução. Gasto: US$ ${spentUsd.toFixed(6)}.`);
    }

    if (!skipResolution) {
      const result = await runQuestionPipeline({
        client,
        config: {
          ...config,
          inputPath,
          outputDir,
        },
        question,
        spentUsd,
      });
      spentUsd += result.totalEstimatedCostUsd;
    }

    if (
      !skipLatex &&
      shouldGenerateLatex(question) &&
      (await fileExists(path.join(outputDir, question.id, "final.json")))
    ) {
      const latexPath = path.join(outputDir, question.id, "04-latex.json");
      if (!(await fileExists(latexPath))) {
        const finalAnalysis = await readFinalAnalysis(outputDir, question.id);
        const artifact = await runLatexStage({
          client,
          model: config.models.reviewer,
          maxOutputTokens: Number(process.env.OPENAI_ENEM_LATEX_MAX_OUTPUT ?? "5000"),
          question,
          reviewerOutput: { finalAnalysis },
        });
        const payload = sanitizeLatexPayload(artifact.payload);
        await saveStageArtifact(outputDir, question.id, "latex", {
          ...artifact,
          payload,
        });
        const texPath = await writeLatexFile(outputDir, question.id, payload);
        await writeJson(path.join(outputDir, question.id, "latex-summary.json"), {
          questionId: question.id,
          model: artifact.model,
          promptVersion: artifact.promptVersion,
          estimatedCostUsd: artifact.usage.estimatedCostUsd,
          texPath,
        });
        spentUsd += artifact.usage.estimatedCostUsd;
      } else {
        const existing = await readJsonFile<{ usage?: { estimatedCostUsd?: number } }>(latexPath);
        spentUsd += Number(existing.usage?.estimatedCostUsd ?? 0);
      }
    }

    if (spentUsd >= config.budgetUsd) {
      throw new Error(`Orçamento local esgotado. Gasto acumulado: US$ ${spentUsd.toFixed(6)}.`);
    }
    console.log(`Questão ${question.id} processada | custo acumulado: US$ ${spentUsd.toFixed(6)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
