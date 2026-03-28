const fs = require("node:fs");
const path = require("node:path");

const enrichedDataset = require("../src/data/generated/enem-2024-math-enriched.json");

const projectRoot = path.resolve(__dirname, "..");
const outputPath = path.join(projectRoot, "data/questions-enem-2024-mt-full.json");

function toLocalAssetPath(assetPath) {
  if (!assetPath) return undefined;
  if (assetPath.startsWith("/")) {
    return path.join("public", assetPath.slice(1));
  }
  return assetPath;
}

function compactText(text) {
  return String(text ?? "")
    .replace(/\u208b/g, "-")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const questions = enrichedDataset.questions.map((question) => ({
  id: `enem-2024-q${question.examQuestionNumber}`,
  year: question.year,
  area: question.area,
  title: question.title,
  statement: compactText(question.statement),
  supportImagePaths: (question.statementAssets ?? [])
    .map(toLocalAssetPath)
    .filter(Boolean),
  options: (question.options ?? []).map((option) => ({
    label: option.option,
    text: compactText(option.text),
    imagePaths: (option.assets ?? []).map(toLocalAssetPath).filter(Boolean),
  })),
  answerKey: question.gabarito,
  metadata: {
    examQuestionNumber: question.examQuestionNumber,
    sourcePages: (question.sourcePages ?? []).join(","),
    skillCode: question.skillCode,
    skillDescription: question.skillDescription,
    competenceNumber: question.competenceNumber,
    competenceDescription: question.competenceDescription,
    theme: question.theme,
    subtheme: question.subtheme,
    coItem: question.coItem,
    coProva: question.coProva,
  },
}));

fs.writeFileSync(outputPath, JSON.stringify({ questions }, null, 2), "utf-8");
console.log(`Arquivo gerado em ${outputPath} com ${questions.length} questões.`);
