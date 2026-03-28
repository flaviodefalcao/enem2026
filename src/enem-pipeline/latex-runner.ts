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
import { runLatexStage } from "./pipelines/latex";
import type { LatexOutput, QuestionInput, ReviewerOutput } from "./types";

function readCliArg(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

async function readFinalAnalysis(outputDir: string, questionId: string) {
  const finalPath = path.join(outputDir, questionId, "final.json");
  const raw = await fs.readFile(finalPath, "utf-8");
  const parsed = JSON.parse(raw) as { finalAnalysis: ReviewerOutput["finalAnalysis"] };

  return {
    finalPath,
    reviewerOutput: {
      finalAnalysis: parsed.finalAnalysis,
    } satisfies ReviewerOutput,
  };
}

async function writeLatexFile(outputDir: string, questionId: string, payload: LatexOutput) {
  const texPath = path.join(outputDir, questionId, "final.tex");
  await fs.writeFile(texPath, payload.fullDocument, "utf-8");
  return texPath;
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
    .replace(/\\\^A/g, "Â")
    .replace(/\\\^E/g, "Ê")
    .replace(/\\\^I/g, "Î")
    .replace(/\\\^O/g, "Ô")
    .replace(/\\\^U/g, "Û")
    .replace(/\\`a/g, "à")
    .replace(/\\`e/g, "è")
    .replace(/\\`i/g, "ì")
    .replace(/\\`o/g, "ò")
    .replace(/\\`u/g, "ù")
    .replace(/\\c\{c\}/g, "ç")
    .replace(/\\c\{C\}/g, "Ç")
    .replace(/\\textbackslash\{\}/g, "\\")
    .replace(/\{\\o\}/g, "ø")
    .replace(/\\\"o/g, "ô")
    .replace(/\\\"a/g, "â")
    .replace(/\\\"e/g, "ê")
    .replace(/\\\"u/g, "ú")
    .replace(/\\hexagon/g, "\\mathrm{hex}")
    .replace(/\\square/g, "\\mathrm{quad}")
    .replace(/\\triangle/g, "\\mathrm{tri}");
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

async function main() {
  const config = getPipelineConfig();
  const inputPath = readCliArg("--input") ?? config.inputPath;
  const outputDir = readCliArg("--output") ?? config.outputDir;
  const questions = await readQuestionsFile(inputPath);
  await ensureDir(outputDir);

  const client = await createOpenAIClient(config.apiKey);
  let spentUsd = 0;
  const latexMaxOutputTokens = Number(process.env.OPENAI_ENEM_LATEX_MAX_OUTPUT ?? "5000");
  const concurrency = Number(process.env.OPENAI_ENEM_LATEX_CONCURRENCY ?? "3");

  const pendingQuestions = [];

  for (const question of questions) {
    const existingLatexPath = path.join(outputDir, question.id, "04-latex.json");
    if (await fileExists(existingLatexPath)) {
      const existing = await readJsonFile<{ usage?: { estimatedCostUsd?: number } }>(
        existingLatexPath,
      );
      spentUsd += Number(existing.usage?.estimatedCostUsd ?? 0);
      console.log(
        `LaTeX já existente para ${question.id}: ${existingLatexPath} | custo acumulado: US$ ${spentUsd.toFixed(6)}`,
      );
      continue;
    }

    pendingQuestions.push(question);
  }

  for (let index = 0; index < pendingQuestions.length; index += concurrency) {
    const batch = pendingQuestions.slice(index, index + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (question) => {
        const { reviewerOutput } = await readFinalAnalysis(outputDir, question.id);
        const artifact = await runLatexStage({
          client,
          model: config.models.reviewer,
          maxOutputTokens: latexMaxOutputTokens,
          question,
          reviewerOutput,
        });
        const sanitizedPayload = sanitizeLatexPayload(artifact.payload);

        await saveStageArtifact(outputDir, question.id, "latex", {
          ...artifact,
          payload: sanitizedPayload,
        });
        const texPath = await writeLatexFile(outputDir, question.id, sanitizedPayload);

        await writeJson(path.join(outputDir, question.id, "latex-summary.json"), {
          questionId: question.id,
          model: artifact.model,
          promptVersion: artifact.promptVersion,
          estimatedCostUsd: artifact.usage.estimatedCostUsd,
          texPath,
        });

        return {
          questionId: question.id,
          texPath,
          estimatedCostUsd: artifact.usage.estimatedCostUsd,
        };
      }),
    );

    for (const result of batchResults) {
      spentUsd += result.estimatedCostUsd;
      if (spentUsd > config.budgetUsd) {
        throw new Error(
          `Orçamento local excedido na etapa LaTeX. Gasto: US$ ${spentUsd.toFixed(6)} / limite US$ ${config.budgetUsd.toFixed(2)}.`,
        );
      }

      console.log(
        `LaTeX gerado para ${result.questionId}: ${result.texPath} | custo acumulado: US$ ${spentUsd.toFixed(6)}`,
      );
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
