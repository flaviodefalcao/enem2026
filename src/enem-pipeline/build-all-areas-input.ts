import fs from "node:fs";
import path from "node:path";
import { DAY2_YELLOW_TO_BLUE_MAP } from "../data/day2-yellow-blue-mapping";

type QuestionOptionLike = {
  option?: string;
  label?: string;
  text?: string;
  assets?: string[];
};

type ExtractedContentQuestion = {
  id: number;
  examQuestionNumber: number;
  year: number;
  area: string;
  title: string;
  sourcePages?: number[];
  statement: string;
  statementAssets?: string[];
  options?: QuestionOptionLike[];
  gabarito?: string;
  skillCode?: string;
  skillDescription?: string;
  competenceNumber?: number;
  competenceDescription?: string;
  theme?: string;
  subtheme?: string;
  coItem?: number;
  coProva?: number;
};

type AnalyticsQuestion = {
  id: number;
  sourceQuestionNumber?: number;
  coItem: number;
  coHabilidade?: number;
  skillCode?: string;
  skillDescription?: string;
  competenceNumber?: number;
  competenceDescription?: string;
  correctOption?: string;
};

type AreaBuildConfig = {
  slug: "linguagens" | "ciencias-humanas" | "ciencias-natureza" | "matematica";
  label: string;
  contentPath: string;
  analyticsPath: string;
  kind: "content+analytics" | "enriched+analytics";
};

const AREA_CONFIG: AreaBuildConfig[] = [
  {
    slug: "linguagens",
    label: "Linguagens",
    contentPath: "src/data/generated/enem-2024-linguagens-content.json",
    analyticsPath: "src/data/generated/enem-2024-linguagens-frontend-analytics.json",
    kind: "content+analytics",
  },
  {
    slug: "ciencias-humanas",
    label: "Ciências Humanas",
    contentPath: "src/data/generated/enem-2024-ciencias-humanas-content.json",
    analyticsPath: "src/data/generated/enem-2024-ciencias-humanas-frontend-analytics.json",
    kind: "content+analytics",
  },
  {
    slug: "ciencias-natureza",
    label: "Ciências da Natureza",
    contentPath: "src/data/generated/enem-2024-ciencias-natureza-content.json",
    analyticsPath: "src/data/generated/enem-2024-ciencias-natureza-frontend-analytics.json",
    kind: "content+analytics",
  },
  {
    slug: "matematica",
    label: "Matemática",
    contentPath: "src/data/generated/enem-2024-math-enriched.json",
    analyticsPath: "src/data/generated/enem-2024-matematica-frontend-analytics.json",
    kind: "enriched+analytics",
  },
];

function readJson<T>(relativePath: string): T {
  const filePath = path.resolve(process.cwd(), relativePath);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function compactText(text: string) {
  return String(text ?? "")
    .replace(/\u208b/g, "-")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toLocalAssetPath(assetPath?: string) {
  if (!assetPath) return undefined;
  if (assetPath.startsWith("/")) {
    return path.join("public", assetPath.slice(1));
  }
  return assetPath;
}

function readCliArg(flag: string) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function padQuestionNumber(value: number) {
  return String(value).padStart(3, "0");
}

function getAnalyticsLookupId(areaSlug: AreaBuildConfig["slug"], localId: number) {
  if (areaSlug === "ciencias-natureza") {
    return (
      DAY2_YELLOW_TO_BLUE_MAP["ciencias-natureza"][
        localId as keyof typeof DAY2_YELLOW_TO_BLUE_MAP["ciencias-natureza"]
      ] ?? localId
    );
  }

  if (areaSlug === "matematica") {
    return (
      DAY2_YELLOW_TO_BLUE_MAP["matematica"][
        localId as keyof typeof DAY2_YELLOW_TO_BLUE_MAP["matematica"]
      ] ?? localId
    );
  }

  return localId;
}

function buildAreaQuestions(config: AreaBuildConfig) {
  const contentPayload = readJson<{ questions?: ExtractedContentQuestion[] }>(config.contentPath);
  const analyticsPayload = readJson<{ questions?: AnalyticsQuestion[] }>(config.analyticsPath);

  const contentQuestions = contentPayload.questions ?? [];
  const analyticsQuestions = analyticsPayload.questions ?? [];
  const analyticsMap = new Map<number, AnalyticsQuestion>(
    analyticsQuestions.map((question) => [question.id, question]),
  );

  return contentQuestions.map((question) => {
    const localId = question.id;
    const analytics = analyticsMap.get(getAnalyticsLookupId(config.slug, localId));
    const examQuestionNumber = question.examQuestionNumber;

    return {
      id: `enem-2024-${config.slug}-q${padQuestionNumber(examQuestionNumber)}`,
      year: question.year ?? 2024,
      area: config.label,
      title: question.title,
      statement: compactText(question.statement),
      supportImagePaths: (question.statementAssets ?? [])
        .map(toLocalAssetPath)
        .filter(Boolean),
      options: (question.options ?? []).map((option) => ({
        label: (option.option ?? option.label ?? "A") as "A" | "B" | "C" | "D" | "E",
        text: compactText(option.text ?? ""),
        imagePaths: (option.assets ?? []).map(toLocalAssetPath).filter(Boolean),
      })),
      answerKey: analytics?.correctOption ?? question.gabarito,
      metadata: {
        areaSlug: config.slug,
        localId,
        examQuestionNumber,
        sourcePages: String((question.sourcePages ?? []).join(",")),
        sourceQuestionNumber: Number(analytics?.sourceQuestionNumber ?? localId),
        skillCode: analytics?.skillCode ?? question.skillCode ?? "",
        skillDescription: analytics?.skillDescription ?? question.skillDescription ?? "",
        competenceNumber: Number(analytics?.competenceNumber ?? question.competenceNumber ?? 0),
        competenceDescription:
          analytics?.competenceDescription ?? question.competenceDescription ?? "",
        theme: question.theme ?? "",
        subtheme: question.subtheme ?? "",
        coItem: Number(analytics?.coItem ?? question.coItem ?? 0),
        coProva: Number(question.coProva ?? 0),
      },
    };
  });
}

async function main() {
  const outputPath = path.resolve(
    process.cwd(),
    readCliArg("--output") ?? "data/questions-enem-2024-all-areas.json",
  );
  const areaFilter = (readCliArg("--areas") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const selectedConfigs =
    areaFilter.length === 0
      ? AREA_CONFIG
      : AREA_CONFIG.filter((config) => areaFilter.includes(config.slug));

  const questions = selectedConfigs.flatMap(buildAreaQuestions);
  fs.writeFileSync(outputPath, JSON.stringify({ questions }, null, 2), "utf-8");
  console.log(`Arquivo gerado em ${outputPath} com ${questions.length} questões.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
