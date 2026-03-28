import { getPipelineConfig } from "./services/config";
import { createOpenAIClient } from "./services/openai-client";
import { ensureDir, readQuestionsFile } from "./services/file-utils";
import { runQuestionPipeline } from "./pipelines/run-question";

function readCliArg(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

async function main() {
  const config = getPipelineConfig();
  const inputPath = readCliArg("--input") ?? config.inputPath;
  const outputDir = readCliArg("--output") ?? config.outputDir;

  const questions = await readQuestionsFile(inputPath);
  if (questions.length === 0) {
    throw new Error("Nenhuma questão encontrada em questions.json.");
  }

  await ensureDir(outputDir);
  const client = await createOpenAIClient(config.apiKey);
  let spentUsd = 0;

  console.log(
    `Pipeline em modo econômico: solver=${config.models.solver}, explainer=${config.models.explainer}, reviewer=${config.models.reviewer}, orçamento local=US$ ${config.budgetUsd.toFixed(2)}.`,
  );

  for (const question of questions) {
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
    console.log(
      `Questão ${question.id} processada: ${result.finalPath} | custo estimado acumulado: US$ ${spentUsd.toFixed(6)}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
