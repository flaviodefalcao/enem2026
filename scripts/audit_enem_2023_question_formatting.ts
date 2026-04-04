import fs from "node:fs";
import path from "node:path";
import { getAreaQuestionPageData, type AreaSlug } from "../src/data/exam-catalog";

const AREAS: AreaSlug[] = [
  "linguagens",
  "ciencias-humanas",
  "ciencias-natureza",
  "matematica",
];

const COMMAND_PATTERN =
  /\b(Nesse|Nessa|Nesses|Nessas|No texto|Na tira|Na charge|Na imagem|No gráfico|Na tabela|Considerando|A partir|Com base|Em relação|Nesse contexto|Esse texto|Essa tirinha|Essa imagem|Esses dados|Esse cartaz|O texto|A tirinha|A charge|O gráfico|A tabela|Qual|Quais|A definição|O efeito|O princípio|A velocidade)\b/i;
const SOURCE_PATTERN =
  /(Dispon[ií]vel em:|Fonte:|Adaptado de:|Extra[ií]do de:|Acesso em:)/i;
const FULL_OPTION_BLOCK_PATTERN =
  /(?:^|\n)A(?:[.)]|\s)\s*[\s\S]*?(?:\n|^)B(?:[.)]|\s)\s*[\s\S]*?(?:\n|^)C(?:[.)]|\s)\s*[\s\S]*?(?:\n|^)D(?:[.)]|\s)\s*[\s\S]*?(?:\n|^)E(?:[.)]|\s)/i;

type QuestionAudit = {
  id: number;
  examQuestionNumber: number;
  area: AreaSlug;
  reasons: string[];
  summary: {
    statementLength: number;
    statementAssets: number;
    optionTextCount: number;
    optionAssetCount: number;
    hasSourceMarker: boolean;
    hasCommandMarker: boolean;
    rawHasOptionBlock: boolean;
  };
};

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function auditArea(area: AreaSlug) {
  const questions = Array.from({ length: 45 }, (_, index) =>
    getAreaQuestionPageData(2023, area, index + 1),
  ).filter((question): question is NonNullable<ReturnType<typeof getAreaQuestionPageData>> => Boolean(question));

  const doubts: QuestionAudit[] = [];

  for (const question of questions) {
    const statement = question.statement || "";
    const rawText = question.rawText || "";
    const optionTextCount = question.options.filter((option) => option.text.trim().length > 0).length;
    const optionAssetCount = question.options.reduce((sum, option) => sum + option.assets.length, 0);
    const statementAssets = question.statementAssets.length;
    const hasSourceMarker = SOURCE_PATTERN.test(statement) || SOURCE_PATTERN.test(rawText);
    const hasCommandMarker = COMMAND_PATTERN.test(statement) || COMMAND_PATTERN.test(rawText);
    const rawHasOptionBlock = FULL_OPTION_BLOCK_PATTERN.test(rawText);

    const reasons: string[] = [];

    if (!statement.trim() && statementAssets === 0) {
      reasons.push("sem_enunciado_e_sem_asset");
    }

    if (optionTextCount === 0 && optionAssetCount === 0) {
      reasons.push("sem_alternativas_renderizaveis");
    }

    if (optionTextCount === 0 && optionAssetCount === 0 && rawHasOptionBlock) {
      reasons.push("falha_na_recuperacao_das_alternativas");
    }

    if (statementAssets >= 2 && optionTextCount === 0 && optionAssetCount === 0) {
      reasons.push("questao_provavelmente_preservada_em_asset_com_layout_ambiguo");
    }

    if (!statement.trim() && statementAssets > 0) {
      reasons.push("depende_totalmente_do_asset");
    }

    if (hasSourceMarker && !hasCommandMarker && optionTextCount === 0) {
      reasons.push("fonte_detectada_sem_comando_claro");
    }

    if (reasons.length > 0) {
      doubts.push({
        id: question.id,
        examQuestionNumber: question.examQuestionNumber,
        area,
        reasons,
        summary: {
          statementLength: statement.trim().length,
          statementAssets,
          optionTextCount,
          optionAssetCount,
          hasSourceMarker,
          hasCommandMarker,
          rawHasOptionBlock,
        },
      });
    }
  }

  return doubts;
}

function main() {
  const outputDir = path.join(process.cwd(), "docs", "audit");
  ensureDir(outputDir);

  const byArea = Object.fromEntries(AREAS.map((area) => [area, auditArea(area)]));
  const flat = Object.values(byArea).flat();

  const jsonPath = path.join(outputDir, "enem-2023-question-formatting-audit.json");
  fs.writeFileSync(jsonPath, JSON.stringify({ year: 2023, byArea }, null, 2));

  const mdLines = [
    "# Auditoria de formatação ENEM 2023",
    "",
    `Total de questões com dúvida: ${flat.length}`,
    "",
  ];

  for (const area of AREAS) {
    const doubts = byArea[area];
    mdLines.push(`## ${area}`);
    mdLines.push("");
    mdLines.push(`Questões com dúvida: ${doubts.length}`);
    mdLines.push("");
    for (const item of doubts) {
      mdLines.push(
        `- Q${item.examQuestionNumber} (id ${item.id}): ${item.reasons.join(", ")} | statement=${item.summary.statementLength} chars | assets=${item.summary.statementAssets} | opções_texto=${item.summary.optionTextCount} | opções_asset=${item.summary.optionAssetCount}`,
      );
    }
    mdLines.push("");
  }

  const mdPath = path.join(outputDir, "enem-2023-question-formatting-audit.md");
  fs.writeFileSync(mdPath, mdLines.join("\n"));

  console.log(`Audit JSON: ${jsonPath}`);
  console.log(`Audit MD: ${mdPath}`);
  console.log(`Total doubtful questions: ${flat.length}`);
}

main();
