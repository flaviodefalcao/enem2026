import fs from "node:fs";
import path from "node:path";
import { remapDay2YellowToBlue } from "./day2-yellow-blue-mapping";
import {
  getExamOverviewAnalytics as getMathExamOverviewAnalytics,
  getExamQuestionSummaries as getMathExamQuestionSummaries,
  getQuestionPageData as getMathQuestionPageData,
  type QuestionPageData as BaseQuestionPageData,
  type OfficialResolutionContent,
  type QuestionRelation,
} from "./mock-question";

export type AreaSlug =
  | "linguagens"
  | "ciencias-humanas"
  | "ciencias-natureza"
  | "matematica";

export type ExamYear =
  | 2015
  | 2016
  | 2017
  | 2018
  | 2019
  | 2020
  | 2021
  | 2022
  | 2023
  | 2024;

export type ExamYearMeta = {
  year: ExamYear;
  label: string;
  status: "available" | "coming_soon";
  description: string;
};

export type AreaMeta = {
  year: ExamYear;
  slug: AreaSlug;
  label: string;
  shortLabel: string;
  dayLabel: string;
  pdfFile: string;
  questionOffset: number;
  lead: string;
};

export type AreaQuestionSummary = {
  id: number;
  displayNumber: number;
  theme: string;
  competenceNumber: number;
  competenceDescription: string;
  skill: string;
  difficulty: string;
  difficultyLevel: number;
  relativeDifficultyLabel: string;
  accuracy: number;
  areaSlug: AreaSlug;
  areaLabel: string;
};

export type AreaQuestionPageData = BaseQuestionPageData & {
  year: ExamYear;
  areaSlug: AreaSlug;
  areaLabel: string;
  areaShortLabel: string;
  dayLabel: string;
  yearRoute: string;
  areaRoute: string;
  questionRoute: string;
  pdfFile: string;
  skillDescription?: string;
  competenceDescription?: string;
};

type OverviewAnalytics = {
  themeDistribution: Array<{
    theme: string;
    competence: string;
    count: number;
    averageAccuracy: number;
  }>;
  competenceAccuracy: Array<{
    competence: string;
    itemCount: number;
    averageAccuracy: number;
  }>;
};

type LandingAreaCard = {
  slug: AreaSlug;
  label: string;
  shortLabel: string;
  dayLabel: string;
  proofColor: string;
  questionCount: number;
  averageAccuracy: number;
  lead: string;
};

type LandingDayStat = {
  dayLabel: string;
  areaLabels: string[];
  averageAccuracy: number;
  totalQuestions: number;
  scoreDistribution: Array<{
    faixa: string;
    n: number;
    share: number;
  }>;
};

type LandingBucket = {
  faixa: string;
  n: number;
  share: number;
};

type LandingAccuracyCurvePoint = {
  faixa: string;
  n: number;
  mediaAcertos: number;
  minAcertos: number;
  maxAcertos: number;
  stdAcertos: number;
  mediaNota: number;
};

type LandingAreaStatsPanel = {
  slug: AreaSlug | "geral";
  label: string;
  questionCount: number;
  sampleSize: number;
  averageAccuracy: number;
  averageScore: number;
  accuracyVsScore: LandingAccuracyCurvePoint[];
};

type LandingProofStats = {
  sampleSize: number;
  generalScoreDistribution: LandingBucket[];
  essayDistribution: LandingBucket[];
  topStudents: {
    threshold: number;
    sampleSize: number;
    scoreRanges: Array<{
      label: string;
      minScore: number;
      maxScore: number;
    }>;
    accuracyRanges: Array<{
      label: string;
      minAccuracy: number;
      maxAccuracy: number;
      maxPossible: number;
    }>;
  };
  overallAccuracyVsScore: LandingAccuracyCurvePoint[];
  areas: LandingAreaStatsPanel[];
};

const AREA_META_BASE: Record<AreaSlug, Omit<AreaMeta, "year" | "pdfFile">> = {
  linguagens: {
    slug: "linguagens",
    label: "Linguagens",
    shortLabel: "LG",
    dayLabel: "Dia 1",
    questionOffset: 0,
    lead: "Leitura, interpretação, gêneros, língua e artes em uma mesma trilha analítica.",
  },
  "ciencias-humanas": {
    slug: "ciencias-humanas",
    label: "Ciências Humanas",
    shortLabel: "CH",
    dayLabel: "Dia 1",
    questionOffset: 45,
    lead: "História, geografia, filosofia e sociologia organizadas como prova navegável.",
  },
  "ciencias-natureza": {
    slug: "ciencias-natureza",
    label: "Ciências da Natureza",
    shortLabel: "CN",
    dayLabel: "Dia 2",
    questionOffset: 90,
    lead: "Física, química e biologia com a mesma lógica de leitura por item e por desempenho.",
  },
  matematica: {
    slug: "matematica",
    label: "Matemática",
    shortLabel: "MT",
    dayLabel: "Dia 2",
    questionOffset: 135,
    lead: "Questões com assets extraídos, analytics e resolução editorial já integrados.",
  },
};

const EXAM_YEARS: ExamYearMeta[] = [
  {
    year: 2024,
    label: "ENEM 2024",
    status: "available",
    description: "Primeiro ano já estruturado com prova, áreas, analytics e leitura por questão.",
  },
  {
    year: 2023,
    label: "ENEM 2023",
    status: "available",
    description: "Conteúdo e estatísticas prontos no mesmo formato de navegação por prova, área e questão.",
  },
  {
    year: 2022,
    label: "ENEM 2022",
    status: "available",
    description: "Conteúdo e estatísticas prontos no mesmo formato de navegação por prova, área e questão.",
  },
  {
    year: 2021,
    label: "ENEM 2021",
    status: "available",
    description: "Conteúdo e estatísticas prontos no mesmo formato de navegação por prova, área e questão.",
  },
  {
    year: 2020,
    label: "ENEM 2020",
    status: "available",
    description: "Conteúdo e estatísticas prontos no mesmo formato de navegação por prova, área e questão.",
  },
  {
    year: 2019,
    label: "ENEM 2019",
    status: "available",
    description: "Conteúdo e estatísticas prontos no mesmo formato de navegação por prova, área e questão.",
  },
  {
    year: 2018,
    label: "ENEM 2018",
    status: "available",
    description: "Conteúdo e estatísticas prontos no mesmo formato de navegação por prova, área e questão.",
  },
  {
    year: 2017,
    label: "ENEM 2017",
    status: "available",
    description: "Conteúdo e estatísticas prontos no mesmo formato de navegação por prova, área e questão.",
  },
  {
    year: 2016,
    label: "ENEM 2016",
    status: "coming_soon",
    description: "Ano reservado no catálogo para expansão futura do produto.",
  },
  {
    year: 2015,
    label: "ENEM 2015",
    status: "coming_soon",
    description: "Ano reservado no catálogo para expansão futura do produto.",
  },
];

const MOCK_AREA_TEMPLATES: Record<
  AreaSlug,
  {
    themes: string[];
    subthemes: string[];
    competencies: string[];
    skillPrefix: string;
    lead: string;
  }
> = {
  linguagens: {
    themes: [
      "Interpretação textual",
      "Gêneros discursivos",
      "Linguagem publicitária",
      "Literatura brasileira",
      "Artes visuais",
      "Variação linguística",
    ],
    subthemes: [
      "Leitura inferencial",
      "Estratégias argumentativas",
      "Relação texto e imagem",
      "Repertório literário",
      "Semiose e linguagem",
      "Efeito de sentido",
    ],
    competencies: [
      "Leitura e interpretação",
      "Análise de linguagem",
      "Repertório artístico-cultural",
      "Competência comunicativa",
    ],
    skillPrefix: "L",
    lead: "Mock estrutural até a entrada dos microdados e resoluções reais da área.",
  },
  "ciencias-humanas": {
    themes: [
      "História do Brasil",
      "Geopolítica",
      "Cidadania e direitos",
      "Espaço urbano",
      "Filosofia política",
      "Movimentos sociais",
    ],
    subthemes: [
      "Interpretação histórica",
      "Leitura cartográfica",
      "Análise de processos sociais",
      "Conceitos filosóficos",
      "Cultura e território",
      "Conflitos contemporâneos",
    ],
    competencies: [
      "Leitura de processos históricos",
      "Análise socioespacial",
      "Argumentação em humanidades",
      "Pensamento político e social",
    ],
    skillPrefix: "CH",
    lead: "Mock estrutural da área para preparar a mesma experiência de item e resolução.",
  },
  "ciencias-natureza": {
    themes: [
      "Ecologia",
      "Energia e trabalho",
      "Transformações químicas",
      "Genética",
      "Eletrodinâmica",
      "Saúde e ambiente",
    ],
    subthemes: [
      "Interpretação experimental",
      "Leitura de gráfico",
      "Modelagem de fenômeno",
      "Relação causa e efeito",
      "Análise de variáveis",
      "Aplicação conceitual",
    ],
    competencies: [
      "Raciocínio científico",
      "Interpretação de fenômenos",
      "Modelagem e evidência",
      "Aplicação tecnológica",
    ],
    skillPrefix: "CN",
    lead: "Mock estrutural para física, química e biologia com o mesmo esqueleto da matemática.",
  },
  matematica: {
    themes: [
      "Conhecimentos numéricos",
      "Conhecimentos algébricos",
      "Grandezas e medidas",
      "Geometria",
      "Estatística e probabilidade",
      "Funções e modelagem",
    ],
    subthemes: [
      "Leitura de problema",
      "Modelagem algébrica",
      "Interpretação gráfica",
      "Cálculo e comparação",
      "Raciocínio proporcional",
      "Resolução por etapas",
    ],
    competencies: [
      "Raciocínio matemático",
      "Modelagem e representação",
      "Leitura quantitativa",
      "Resolução de problemas",
    ],
    skillPrefix: "M",
    lead: "Estrutura matemática pronta para receber ou reaproveitar enunciado, analytics e leitura pedagógica.",
  },
};

const yearAreaQuestionCache = new Map<string, BaseQuestionPageData[]>();
const extractedAreaCache = new Map<string, ExtractedAreaQuestion[]>();
const analyticsAreaCache = new Map<string, AreaFrontendAnalyticsQuestion[]>();
const generatedQuestionAssetsCache = new Map<string, GeneratedQuestionAssets | null>();
const themeArtifactCache = new Map<string, { theme: string; subtheme: string } | null>();
const finalAnalysisCache = new Map<string, {
  technicalSolution?: { strategy?: string; steps?: string[] };
  didacticExplanation?: { shortExplanation?: string; stepByStep?: string[]; commonPitfalls?: string[] };
  distractors?: Array<{ option?: string; likelyReasoning?: string; whyItLooksPlausible?: string; whyItIsWrong?: string }>;
  officialResolution?: OfficialResolutionContent;
} | null>();
const latexAreaCache = new Map<string, BaseQuestionPageData["latexResolution"] | null>();
type ProofSummaryPayload = {
  sampleSize: number;
  generalScoreDistribution: LandingBucket[];
  essayDistribution: LandingBucket[];
  topStudents: {
    threshold: number;
    sampleSize: number;
    scoreRanges: Array<{
      label: string;
      minScore: number;
      maxScore: number;
    }>;
    accuracyRanges: Array<{
      label: string;
      minAccuracy: number;
      maxAccuracy: number;
      maxPossible: number;
    }>;
  };
  overallAccuracyVsScore: LandingAccuracyCurvePoint[];
  areas: Record<
    AreaSlug,
    {
      label: string;
      questionCount: number;
      sampleSize: number;
      averageScore: number;
      averageAccuracy: number;
      scoreDistribution: LandingBucket[];
      accuracyVsScore: LandingAccuracyCurvePoint[];
    }
  >;
};

const proofSummaryCache = new Map<ExamYear, ProofSummaryPayload | null>();

type ExtractedAreaQuestion = {
  id: number;
  examQuestionNumber: number;
  year: number;
  area: string;
  title: string;
  sourcePages: number[];
  statement: string;
  statementAssets: string[];
  imageUrl: string;
  options: Array<{
    option: "A" | "B" | "C" | "D" | "E";
    text: string;
    assets: string[];
  }>;
  rawText: string;
};

type AreaFrontendAnalyticsQuestion = {
  id: number;
  questionNumber: number;
  questaoCanonica: string;
  coItem: number;
  coHabilidade: number;
  competenceNumber?: number;
  competenceDescription?: string;
  skillCode?: string;
  skillDescription?: string;
  correctOption: string;
  accuracy: number;
  difficultyRank: number;
  difficultyRankB: number;
  difficultyRank800: number;
  topDistractor: string;
  topPerformerDistribution?: Record<"A" | "B" | "C" | "D" | "E", number>;
  topPerformerGroup?: string;
  topPerformerGroupLabel?: string;
  topPerformerGroupDescription?: string;
  topPerformerGroupSampleSize?: number;
  groupDistributions?: Array<{
    group: string;
    label: string;
    distribution: Record<"A" | "B" | "C" | "D" | "E", number>;
    sampleSize?: number;
  }>;
  optionDistribution: Record<"A" | "B" | "C" | "D" | "E", number>;
  proficiencyAccuracy: Array<{ faixa: string; acerto: number }>;
  comments: string[];
  analyticsSummary: string;
  sampleSize: number;
  bucketSnapshot: Array<{ faixa: string; acerto: number; n: number }>;
  distractorByBucket: Array<{ faixa: string; distractor: string; pct: number; n: number }>;
  empiricalCurve: Array<{ faixa: string; acerto: number; n: number; notaMedia: number }>;
  discriminationGapLt600To900: number;
  discriminationGap700To900: number;
  rankDiscrimination: number;
  rankInformation: number;
  informationLabel: string;
  averageScore: number;
  thetaAverage: number;
  tri: {
    a: number;
    b: number;
    c: number;
  };
  itemInformationProxy: number;
  distratorDominantePercent: number;
  difficultyBand: string;
  reviewPriorityLabel: string;
  qualityLabel: string;
  discriminationLabel: string;
  weakestBucket: { faixa: string; acerto: number; n: number } | null;
  strongestBucket: { faixa: string; acerto: number; n: number } | null;
  resolution: {
    whatItAsks: string;
    howToSolve: string;
    whyErrorsHappen: string;
    distractorCommentary: string[];
  };
};

type AreaFrontendAnalyticsDataset = {
  metadata: {
    areaCode: string;
    areaSlug: string;
    areaLabel: string;
    sourceDir: string;
  };
  questions?: AreaFrontendAnalyticsQuestion[];
};

type GeneratedQuestionAssets = {
  statementAssets: string[];
  imageUrl: string;
  optionAssets: Record<"A" | "B" | "C" | "D" | "E", string[]>;
};

function makeYearAreaKey(year: ExamYear, area: AreaSlug) {
  return `${year}:${area}`;
}

function getGeneratedAreaDirCandidates(year: ExamYear, area: AreaSlug) {
  if (area === "matematica") {
    return year === 2024 ? ["math", "math-blue", "matematica"] : ["matematica"];
  }

  if (area === "ciencias-natureza") {
    return year === 2024
      ? ["ciencias-natureza", "ciencias-natureza-azul"]
      : ["ciencias-natureza"];
  }

  return [area];
}

function buildEmptyOptionAssetsMap() {
  return {
    A: [],
    B: [],
    C: [],
    D: [],
    E: [],
  } as Record<"A" | "B" | "C" | "D" | "E", string[]>;
}

function getGeneratedQuestionAssets(
  year: ExamYear,
  area: AreaSlug,
  examQuestionNumber: number,
): GeneratedQuestionAssets | null {
  const cacheKey = `${year}:${area}:${examQuestionNumber}:generated-assets`;
  if (generatedQuestionAssetsCache.has(cacheKey)) {
    return generatedQuestionAssetsCache.get(cacheKey) ?? null;
  }

  for (const dirCandidate of getGeneratedAreaDirCandidates(year, area)) {
    const questionDir = path.join(
      process.cwd(),
      "public",
      "generated",
      `enem-${year}`,
      dirCandidate,
      `question-${examQuestionNumber}`,
    );

    if (!fs.existsSync(questionDir)) {
      continue;
    }

    const files = fs.readdirSync(questionDir).sort();
    const statementAssets = files
      .filter((file) => /^statement-\d+\.png$/i.test(file))
      .map((file) => `/generated/enem-${year}/${dirCandidate}/question-${examQuestionNumber}/${file}`);

    const optionAssets = buildEmptyOptionAssetsMap();
    for (const option of ["A", "B", "C", "D", "E"] as const) {
      optionAssets[option] = files
        .filter((file) => new RegExp(`^option-${option.toLowerCase()}-\\d+\\.png$`, "i").test(file))
        .map((file) => `/generated/enem-${year}/${dirCandidate}/question-${examQuestionNumber}/${file}`);
    }

    const payload: GeneratedQuestionAssets = {
      statementAssets,
      imageUrl: statementAssets[0] ?? "/placeholder.png",
      optionAssets,
    };

    generatedQuestionAssetsCache.set(cacheKey, payload);
    return payload;
  }

  generatedQuestionAssetsCache.set(cacheKey, null);
  return null;
}

function getAreaPipelineQuestionId(
  year: ExamYear,
  area: Exclude<AreaSlug, "matematica">,
  examQuestionNumber: number,
) {
  return `enem-${year}-${area}-q${String(examQuestionNumber).padStart(3, "0")}`;
}

function getPdfFile(year: ExamYear, area: AreaSlug) {
  if (area === "linguagens" || area === "ciencias-humanas") {
    return `ENEM_${year}_P1_CAD_01_DIA_1_AZUL.pdf`;
  }

  return `ENEM_${year}_P1_CAD_05_DIA_2_AMARELO.pdf`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDefaultTopPerformerMeta(areaSlug: AreaSlug) {
  switch (areaSlug) {
    case "linguagens":
      return {
        label: "700+ em Linguagens",
        description: "alunos com 700+ em Linguagens",
      };
    case "ciencias-humanas":
      return {
        label: "780+ em Humanas",
        description: "alunos com 780+ em Ciências Humanas",
      };
    case "ciencias-natureza":
      return {
        label: "800+ em Natureza",
        description: "alunos com 800+ em Ciências da Natureza",
      };
    case "matematica":
      return {
        label: "900+ em Matemática",
        description: "alunos com 900+ em Matemática",
      };
  }
}

function bucketStartValue(label: string) {
  const normalized = label.replace("[", "").replace(")", "").replace(", ", "–");
  const [start] = normalized.split("–");
  const parsed = Number.parseInt(start ?? "0", 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getProofSummary(year: ExamYear): ProofSummaryPayload | null {
  if (proofSummaryCache.has(year)) {
    return proofSummaryCache.get(year) ?? null;
  }

  const summaryPath = path.join(
    process.cwd(),
    "src",
    "data",
    "generated",
    `enem-${year}-proof-summary.json`,
  );

  if (!fs.existsSync(summaryPath)) {
    proofSummaryCache.set(year, null);
    return null;
  }

  const parsed = JSON.parse(fs.readFileSync(summaryPath, "utf-8")) as ProofSummaryPayload;
  proofSummaryCache.set(year, parsed);
  return parsed;
}

function buildMockAccuracy(id: number, area: AreaSlug) {
  const areaBias =
    area === "linguagens" ? 9 : area === "ciencias-humanas" ? 5 : 2;
  return Number((58 - ((id * 7 + areaBias) % 27) - ((id + areaBias) % 3) * 1.6).toFixed(1));
}

function buildMockDifficulty(accuracy: number) {
  if (accuracy >= 52) return "Fácil";
  if (accuracy >= 45) return "Média";
  if (accuracy >= 34) return "Difícil";
  return "Muito difícil";
}

function buildMockDifficultyLevel(rank: number) {
  if (rank <= 9) return 5;
  if (rank <= 18) return 4;
  if (rank <= 27) return 3;
  if (rank <= 36) return 2;
  return 1;
}

function buildMockDifficultyLabel(level: number) {
  switch (level) {
    case 5:
      return "Muito alta";
    case 4:
      return "Alta";
    case 3:
      return "Média";
    case 2:
      return "Baixa";
    default:
      return "Muito baixa";
  }
}

function getExtractedContentPath(year: ExamYear, area: AreaSlug) {
  return path.join(
    process.cwd(),
    "src/data/generated",
    `enem-${year}-${area}-content.json`,
  );
}

function loadExtractedAreaQuestions(year: ExamYear, area: AreaSlug) {
  const cacheKey = makeYearAreaKey(year, area);
  const cached = extractedAreaCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const filePath = getExtractedContentPath(year, area);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
      questions?: ExtractedAreaQuestion[];
    };
    const questions = parsed.questions ?? [];
    extractedAreaCache.set(cacheKey, questions);
    return questions;
  } catch {
    return null;
  }
}

function getFrontendAnalyticsPath(year: ExamYear, area: AreaSlug) {
  return path.join(
    process.cwd(),
    "src/data/generated",
    `enem-${year}-${area}-frontend-analytics.json`,
  );
}

function loadAreaFrontendAnalytics(year: ExamYear, area: AreaSlug) {
  const cacheKey = makeYearAreaKey(year, area);
  const cached = analyticsAreaCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const filePath = getFrontendAnalyticsPath(year, area);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as AreaFrontendAnalyticsDataset;
    const questions = parsed.questions ?? [];
    analyticsAreaCache.set(cacheKey, questions);
    return questions;
  } catch {
    return null;
  }
}

function loadThemeArtifact(
  year: ExamYear,
  area: Exclude<AreaSlug, "matematica">,
  examQuestionNumber: number,
) {
  const cacheKey = `${year}:${area}:${examQuestionNumber}:theme`;
  if (themeArtifactCache.has(cacheKey)) {
    return themeArtifactCache.get(cacheKey) ?? null;
  }

  const filePath = path.join(
    process.cwd(),
    `data/output-enem-${year}-all-areas`,
    getAreaPipelineQuestionId(year, area, examQuestionNumber),
    "00-theme.json",
  );

  if (!fs.existsSync(filePath)) {
    themeArtifactCache.set(cacheKey, null);
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
      payload?: { theme?: string; subtheme?: string };
    };
    const payload =
      parsed.payload?.theme && parsed.payload?.subtheme
        ? { theme: parsed.payload.theme, subtheme: parsed.payload.subtheme }
        : null;
    themeArtifactCache.set(cacheKey, payload);
    return payload;
  } catch {
    themeArtifactCache.set(cacheKey, null);
    return null;
  }
}

function loadFinalAnalysis(
  year: ExamYear,
  area: Exclude<AreaSlug, "matematica">,
  examQuestionNumber: number,
) {
  const cacheKey = `${year}:${area}:${examQuestionNumber}:final`;
  if (finalAnalysisCache.has(cacheKey)) {
    return finalAnalysisCache.get(cacheKey) ?? null;
  }

  const filePath = path.join(
    process.cwd(),
    `data/output-enem-${year}-all-areas`,
    getAreaPipelineQuestionId(year, area, examQuestionNumber),
    "final.json",
  );

  if (!fs.existsSync(filePath)) {
    finalAnalysisCache.set(cacheKey, null);
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
      finalAnalysis?: {
        technicalSolution?: { strategy?: string; steps?: string[] };
        didacticExplanation?: {
          shortExplanation?: string;
          stepByStep?: string[];
          commonPitfalls?: string[];
          teachingTips?: string[];
        };
        distractors?: Array<{
          option?: string;
          likelyReasoning?: string;
          whyItLooksPlausible?: string;
          whyItIsWrong?: string;
        }>;
        officialResolution?: OfficialResolutionContent;
      };
    };
    const payload = parsed.finalAnalysis ?? null;
    finalAnalysisCache.set(cacheKey, payload);
    return payload;
  } catch {
    finalAnalysisCache.set(cacheKey, null);
    return null;
  }
}

function loadAreaLatexResolution(
  year: ExamYear,
  area: Exclude<AreaSlug, "matematica">,
  examQuestionNumber: number,
) {
  const cacheKey = `${year}:${area}:${examQuestionNumber}:latex`;
  if (latexAreaCache.has(cacheKey)) {
    return latexAreaCache.get(cacheKey) ?? null;
  }

  const filePath = path.join(
    process.cwd(),
    `data/output-enem-${year}-all-areas`,
    getAreaPipelineQuestionId(year, area, examQuestionNumber),
    "04-latex.json",
  );

  if (!fs.existsSync(filePath)) {
    latexAreaCache.set(cacheKey, null);
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
      payload?: BaseQuestionPageData["latexResolution"];
    };
    const payload = parsed.payload ?? null;
    latexAreaCache.set(cacheKey, payload);
    return payload;
  } catch {
    latexAreaCache.set(cacheKey, null);
    return null;
  }
}

function buildMockOptionDistribution(
  id: number,
  correctOption: "A" | "B" | "C" | "D" | "E",
) {
  const options = ["A", "B", "C", "D", "E"] as const;
  const baseCorrect = 28 + ((id * 5) % 18);
  const leftover = 100 - baseCorrect;
  const slices = [0.33, 0.27, 0.22, 0.18];
  const wrongOptions = options.filter((option) => option !== correctOption);
  const distribution = {} as Record<(typeof options)[number], number>;

  wrongOptions.forEach((option, index) => {
    distribution[option] = Number((leftover * slices[index]).toFixed(1));
  });
  distribution[correctOption] = Number(baseCorrect.toFixed(1));

  const total = options.reduce((sum, option) => sum + distribution[option], 0);
  distribution.E = Number((distribution.E + (100 - total)).toFixed(1));

  return distribution;
}

function buildTopPerformerDistribution(
  correctOption: "A" | "B" | "C" | "D" | "E",
  optionDistribution: Record<"A" | "B" | "C" | "D" | "E", number>,
  analytics?: AreaFrontendAnalyticsQuestion,
) {
  const topGroup =
    analytics?.groupDistributions?.find((entry) => entry.group === "area_high_perf_custom")
      ?.distribution ??
    analytics?.groupDistributions?.find((entry) => entry.group === "media5_800plus")
      ?.distribution ??
    analytics?.topPerformerDistribution;

  if (topGroup) {
    return (["A", "B", "C", "D", "E"] as const).map((option) => ({
      option,
      value: Number((topGroup[option] ?? 0).toFixed(1)),
    }));
  }

  const boostedCorrect = Math.max(optionDistribution[correctOption] + 18, 46);
  const leftover = Math.max(100 - boostedCorrect, 0);
  const wrongOptions = (["A", "B", "C", "D", "E"] as const).filter(
    (option) => option !== correctOption,
  );
  const weights = wrongOptions.map((option) => Math.max(optionDistribution[option], 1));
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);

  const values = wrongOptions.map((option, index) => ({
    option,
    value: Number(((leftover * weights[index]) / totalWeight).toFixed(1)),
  }));

  const total = boostedCorrect + values.reduce((sum, entry) => sum + entry.value, 0);
  const adjustment = Number((100 - total).toFixed(1));
  if (values.length > 0) {
    values[values.length - 1].value = Number(
      (values[values.length - 1].value + adjustment).toFixed(1),
    );
  }

  return (["A", "B", "C", "D", "E"] as const).map((option) =>
    option === correctOption
      ? { option, value: Number(boostedCorrect.toFixed(1)) }
      : values.find((entry) => entry.option === option) ?? { option, value: 0 },
  );
}

function normalizeInlineOptionText(text: string) {
  return text
    .replace(/\*[0-9A-Z*]+\*/g, "")
    .replace(/\b(?:LC|CH|CN|MT)\s*-\s*\d[º°]\s*dia[\s|]+\s*Caderno.*$/gi, "")
    .replace(/\b(?:INSTRUÇÕES PARA A REDAÇÃO|RASCUNHO DA REDAÇÃO).*/gi, "")
    .replace(/\bENEM_[0-9A-Z_./-]+/gi, "")
    .replace(/\bA\.\s*B\.\s*C\.\s*D\.\s*E\.\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function trimOptionTailArtifacts(text: string) {
  return text
    .replace(/\*[0-9A-Z*]+\*.*/g, "")
    .replace(/\b(?:INSTRUÇÕES PARA A REDAÇÃO|RASCUNHO DA REDAÇÃO).*/gi, "")
    .replace(/\b(?:LC|CH|CN|MT)\s*-\s*\d[º°]\s*dia[\s|]+\s*Caderno.*$/gi, "")
    .replace(/\bENEM_[0-9A-Z_./-]+.*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isOptionTextLikelyCorrupted(text: string, area: AreaSlug) {
  const normalized = text.trim();
  if (!normalized) {
    return true;
  }

  if (
    /\*[0-9A-Z*]+\*/.test(normalized) ||
    /\b(?:INSTRUÇÕES PARA A REDAÇÃO|RASCUNHO DA REDAÇÃO|Caderno|Página)\b/i.test(normalized) ||
    /\bENEM_[0-9A-Z_./-]+/i.test(normalized) ||
    /! ! ! !/.test(normalized)
  ) {
    return true;
  }

  if (/^\d+[.,]?$/.test(normalized) || /^\d+\.$/.test(normalized)) {
    return false;
  }

  if (/\b\d(?:\s+\d){4,}\b/.test(normalized)) {
    return true;
  }

  if (normalized.length > 60) {
    const digits = (normalized.match(/\d/g) ?? []).length;
    const letters = (normalized.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
    if (digits > letters && area !== "matematica") {
      return true;
    }
  }

  return false;
}

function extractOptionsFromTail(
  source: string,
  collapseText: (text: string) => string = normalizeInlineOptionText,
) {
  const optionRegex = /(?:^|\n)([A-E])(?:[.)]|\s)\s*/g;
  const matches = [...source.matchAll(optionRegex)].map((match) => ({
    option: match[1] as "A" | "B" | "C" | "D" | "E",
    index: match.index ?? 0,
    length: match[0].length,
  }));

  if (matches.length < 5) {
    return null;
  }

  for (let index = matches.length - 5; index >= 0; index -= 1) {
    const window = matches.slice(index, index + 5);
    if (window.map((match) => match.option).join("") !== "ABCDE") {
      continue;
    }

    const options = window.map((match, optionIndex) => {
      const start = match.index + match.length;
      const end = window[optionIndex + 1]?.index ?? source.length;
      return {
        option: match.option,
        text: collapseText(source.slice(start, end)),
        index: match.index,
      };
    });

    const hasUsefulText = options.every(
      (option) =>
        option.text.length > 6 &&
        !/^[A-E][.)]?$/.test(option.text) &&
        !/^alternativa composta por elemento visual/i.test(option.text),
    );

    if (!hasUsefulText) {
      continue;
    }

    const statement = source
      .slice(0, window[0]?.index ?? 0)
      .replace(/\s+/g, " ")
      .trim();

    return {
      statement,
      options,
    };
  }

  return null;
}

function collapseCorruptedOptionText(text: string) {
  const normalized = trimOptionTailArtifacts(normalizeInlineOptionText(text));
  const firstSentence = normalized.match(/^(.+?[.;!?])(?:\s|$)/);
  if (firstSentence?.[1]) {
    return firstSentence[1].trim();
  }

  if (normalized.length > 180) {
    return `${normalized.slice(0, 177).trim()}...`;
  }

  return normalized;
}

function sanitizeCorruptedQuestionContent(
  question: ExtractedAreaQuestion | undefined,
  area: AreaSlug,
) {
  if (!question) {
    return null;
  }

  const rawText = (question.rawText || "").replace(/\r/g, "").trim();
  const markerMatches = rawText.match(/\*[0-9A-Z]+\*/g) ?? [];
  const hasCorruptionMarkers = markerMatches.length > 1;
  const hasHugeOption = question.options.some((option) => (option.text || "").length > 240);
  const hasPageTailOption = question.options.some((option) =>
    isOptionTextLikelyCorrupted(option.text || "", area),
  );

  if (!hasCorruptionMarkers && !hasHugeOption && !hasPageTailOption) {
    return null;
  }

  const relevantChunk = hasCorruptionMarkers
    ? rawText.split(markerMatches[0] ?? "")[0].trim()
    : rawText;

  const optionRegex =
    /(?:^|\n)([A-E])(?:[.)]|\s)\s*([\s\S]*?)(?=(?:\n[A-E](?:[.)]|\s)\s*)|$)/g;
  const tailExtraction = extractOptionsFromTail(relevantChunk, collapseCorruptedOptionText);
  if (!tailExtraction) {
    return null;
  }
  if (!tailExtraction.statement) {
    return null;
  }

  return {
    statement: tailExtraction.statement,
    options: tailExtraction.options.map((match) => ({
      option: match.option,
      text: match.text,
      assets: [],
    })),
    rawText: relevantChunk,
  };
}

function rescueInlineOptions(question: ExtractedAreaQuestion | undefined) {
  if (!question) {
    return null;
  }

  const hasUsableOptions = question.options.some(
    (option) => option.text.trim().length > 0 || option.assets.length > 0,
  );

  if (hasUsableOptions) {
    return null;
  }

  const source = (question.rawText || question.statement || "").replace(/\r/g, "").trim();
  if (!source) {
    return null;
  }

  const tailExtraction = extractOptionsFromTail(source);
  if (!tailExtraction) {
    return null;
  }
  const rescuedStatement = tailExtraction.statement;
  const rescuedOptions = tailExtraction.options.map((match) => ({
    option: match.option,
    text: match.text,
    assets: [],
  }));

  if (!rescuedStatement || rescuedOptions.some((option) => !option.text)) {
    return null;
  }

  return {
    statement: rescuedStatement,
    options: rescuedOptions,
  };
}

function shouldSuppressFragmentedStatementText(
  statement: string,
  statementAssets: string[],
  hasUsableOptions: boolean,
) {
  if (statementAssets.length === 0 || !statement) {
    return false;
  }

  if (!hasUsableOptions) {
    return false;
  }

  const normalized = statement.trim();
  if (/[.!?:…”"]$/.test(normalized)) {
    return false;
  }

  return /\b(a|o|os|as|de|da|do|das|dos|que|como|para|com|em|no|na|por|ao)\s*$/i.test(
    normalized,
  );
}

function buildCatalogAreaQuestions(year: ExamYear, area: AreaSlug) {
  const cacheKey = makeYearAreaKey(year, area);
  const cached = yearAreaQuestionCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const meta = getAreaMeta(year, area);
  const template = MOCK_AREA_TEMPLATES[area];
  const extractedQuestions = loadExtractedAreaQuestions(year, area);
  const analyticsQuestions = loadAreaFrontendAnalytics(year, area);
  const extractedQuestionMap = new Map<number, ExtractedAreaQuestion>(
    (extractedQuestions ?? []).map((question) => [question.id, question]),
  );
  const analyticsQuestionMap = new Map<number, AreaFrontendAnalyticsQuestion>(
    (analyticsQuestions ?? []).map((question) => [question.id, question]),
  );
  const options = ["A", "B", "C", "D", "E"] as const;
  const rawQuestions: BaseQuestionPageData[] = Array.from({ length: 45 }, (_, index) => {
    const id = index + 1;
    const examQuestionNumber = meta.questionOffset + id;
    const extracted = extractedQuestionMap.get(id);
    const analyticsLookupId =
      year === 2024 && area === "ciencias-natureza"
        ? remapDay2YellowToBlue("ciencias-natureza", id)
        : id;
    const analytics = analyticsQuestionMap.get(analyticsLookupId);
    const classifiedTheme =
      area === "matematica" ? null : loadThemeArtifact(year, area, extracted?.examQuestionNumber ?? examQuestionNumber);
    const theme =
      classifiedTheme?.theme ??
      (analytics?.competenceDescription?.trim() || template.themes[index % template.themes.length]);
    const subtheme =
      classifiedTheme?.subtheme ??
      (analytics?.skillDescription?.trim() || template.subthemes[(index + 2) % template.subthemes.length]);
    const generatedFinal =
      area === "matematica" ? null : loadFinalAnalysis(year, area, extracted?.examQuestionNumber ?? examQuestionNumber);
    const generatedLatex =
      area === "matematica" ? null : loadAreaLatexResolution(year, area, extracted?.examQuestionNumber ?? examQuestionNumber);
    const fallbackCompetence = template.competencies[index % template.competencies.length];
    const competenceNumber = analytics?.competenceNumber ?? 0;
    const competence =
      analytics?.competenceDescription?.trim() || fallbackCompetence;
    const skill =
      analytics?.skillCode?.trim() ||
      `${template.skillPrefix}${((index % 30) + 1).toString().padStart(2, "0")}`;
    const skillDescription = analytics?.skillDescription?.trim() || "";
    const correctOption =
      (analytics?.correctOption as "A" | "B" | "C" | "D" | "E") ??
      options[(index + 2) % options.length];
    const topDistractor =
      (analytics?.topDistractor as "A" | "B" | "C" | "D" | "E") ??
      options[(index + 3) % options.length];
    const accuracy = analytics?.accuracy ?? clamp(buildMockAccuracy(id, area), 19, 68);
    const difficulty = buildMockDifficulty(accuracy);
    const difficultyRank = analytics?.difficultyRank ?? (((index * 11) % 45) + 1);
    const difficultyLevel = buildMockDifficultyLevel(difficultyRank);
    const topPerformerMeta = getDefaultTopPerformerMeta(area);
    const distribution =
      analytics?.optionDistribution ?? buildMockOptionDistribution(id, correctOption);
    const triA = analytics?.tri.a ?? Number((0.9 + ((id * 13) % 23) / 10).toFixed(2));
    const triB = analytics?.tri.b ?? Number((-0.4 + ((id * 17) % 31) / 10).toFixed(2));
    const rescuedInlineContent = rescueInlineOptions(extracted);
    const sanitizedCorruptedContent = sanitizeCorruptedQuestionContent(extracted, area);
    const generatedAssets = getGeneratedQuestionAssets(
      year,
      area,
      extracted?.examQuestionNumber ?? examQuestionNumber,
    );
    const resolvedStatement =
      sanitizedCorruptedContent?.statement ??
      rescuedInlineContent?.statement ??
      extracted?.statement ??
      `Mock temporário da questão ${examQuestionNumber} de ${meta.label.toLowerCase()}, preparado para receber depois o enunciado real, alternativas reais, assets e resolução específica da área.`;
    const rawResolvedOptions =
      sanitizedCorruptedContent?.options ??
      rescuedInlineContent?.options ??
      extracted?.options ??
      options.map((option) => ({
        option,
        text: `Alternativa ${option} mockada para a área de ${meta.label.toLowerCase()} com foco em ${theme.toLowerCase()}.`,
        assets: [],
      }));
    const mergedStatementAssets =
      (extracted?.statementAssets?.length ? extracted.statementAssets : generatedAssets?.statementAssets) ?? [];
    const mergedImageUrl =
      extracted?.imageUrl && extracted.imageUrl !== "/placeholder.png"
        ? extracted.imageUrl
        : generatedAssets?.imageUrl ?? extracted?.imageUrl ?? "/placeholder.png";
    const fallbackOptionAssets =
      generatedAssets?.optionAssets ??
      ({
        A: [],
        B: [],
        C: [],
        D: [],
        E: [],
      } as Record<"A" | "B" | "C" | "D" | "E", string[]>);
    const corruptedOptionCount = rawResolvedOptions.filter((option) =>
      isOptionTextLikelyCorrupted(option.text || "", area),
    ).length;
    const hasFullGeneratedOptionSet = options.every(
      (option) => (fallbackOptionAssets[option] ?? []).length > 0,
    );
    const shouldPreferGeneratedOptionAssets =
      hasFullGeneratedOptionSet &&
      (corruptedOptionCount >= 2 ||
        rawResolvedOptions.filter((option) => !(option.text || "").trim()).length >= 2);
    const resolvedOptions = rawResolvedOptions.map((option) => {
      const generatedOptionAssets = fallbackOptionAssets[option.option] ?? [];
      const existingAssets = option.assets.length > 0 ? option.assets : generatedOptionAssets;
      const cleanedText = trimOptionTailArtifacts(option.text || "");
      const preferAssetOnly =
        generatedOptionAssets.length > 0 &&
        (shouldPreferGeneratedOptionAssets || isOptionTextLikelyCorrupted(cleanedText, area));

      return {
        option: option.option,
        text: preferAssetOnly ? "" : cleanedText,
        assets: existingAssets,
        displayMode: preferAssetOnly ? ("asset_only" as const) : ("auto" as const),
      };
    });
    const shouldSuppressStatement =
      !sanitizedCorruptedContent &&
      shouldSuppressFragmentedStatementText(
        resolvedStatement,
        mergedStatementAssets,
        resolvedOptions.some((option) => option.text.trim().length > 0 || option.assets.length > 0),
      );

    return {
      id,
      examQuestionNumber: extracted?.examQuestionNumber ?? examQuestionNumber,
      year: extracted?.year ?? year,
      area: extracted?.area ?? meta.label,
      title:
        extracted?.title ??
        `Questão ${examQuestionNumber} — ENEM ${year} — ${meta.label}`,
      statement: shouldSuppressStatement ? "" : resolvedStatement,
      statementAssets: mergedStatementAssets,
      sourcePages: extracted?.sourcePages ?? [Math.ceil(id / 3)],
      rawText: sanitizedCorruptedContent?.rawText ?? extracted?.rawText ?? "",
      options: resolvedOptions.map((option) => ({
        option: option.option,
        text: option.text,
        assets: option.assets,
        displayMode: option.displayMode,
        suppressedReason: undefined,
      })),
      topPerformerDistribution: buildTopPerformerDistribution(
        correctOption,
        distribution,
        analytics,
      ),
      theme,
      subtheme,
      skill,
      skillDescription,
      competenceNumber,
      competenceDescription: competence,
      difficulty,
      accuracy,
      correctOption,
      topDistractor,
      difficultyRank,
      imageUrl: mergedImageUrl,
      comments:
        analytics?.comments ??
        [
          extracted
            ? `${meta.label} já usa enunciado, alternativas e assets reais extraídos do PDF.`
            : `${meta.label} ainda está em modo mock, mas o item já segue a mesma leitura analítica da matemática.`,
          `O distrator ${topDistractor} foi definido como principal para a estrutura inicial de comentários e revisão.`,
          competenceNumber > 0
            ? `A questão está ligada à competência ${competenceNumber} da matriz da área.`
            : `${competence} aparece como eixo pedagógico provisório até a integração dos dados reais da área.`,
        ],
      metadata: {
        cognitiveType: competence,
        usesChart:
          (extracted?.statementAssets.length ?? 0) > 0 ||
          (extracted?.options ?? []).some((option) => option.assets.length > 0) ||
          (id + optionIndexSeed(area)) % 4 === 0,
        abstractionLevel: difficultyLevel >= 4 ? "Alto" : difficultyLevel === 3 ? "Médio" : "Básico",
      },
      optionDistribution: distribution,
      relatedQuestions: [],
      proficiencyAccuracy:
        analytics?.proficiencyAccuracy ??
        [
        { faixa: "Até 599", acerto: clamp(accuracy - 18, 6, 52) },
        { faixa: "600-699", acerto: clamp(accuracy - 8, 12, 60) },
        { faixa: "700-799", acerto: clamp(accuracy, 18, 72) },
        { faixa: "800-899", acerto: clamp(accuracy + 10, 24, 82) },
        { faixa: "900+", acerto: clamp(accuracy + 18, 30, 91) },
      ],
      analyticsSnapshot: {
        sampleSize: analytics?.sampleSize ?? (18000 + id * 97),
        averageScore: analytics?.averageScore ?? Number((610 + id * 2.9).toFixed(1)),
        thetaAverage: analytics?.thetaAverage ?? Number((0.4 + id * 0.03).toFixed(2)),
        informationLabel:
          analytics?.informationLabel ?? (triA >= 2.3 ? "Alta" : triA >= 1.6 ? "Média" : "Baixa"),
        rankDiscrimination: analytics?.rankDiscrimination ?? (((id * 9) % 45) + 1),
        rankInformation: analytics?.rankInformation ?? (((id * 5) % 45) + 1),
        discriminationGapLt600To900:
          analytics?.discriminationGapLt600To900 ?? Number((22 + (id % 14) * 2.1).toFixed(1)),
        discriminationGap700To900:
          analytics?.discriminationGap700To900 ?? Number((12 + (id % 9) * 1.8).toFixed(1)),
        dominantDistractorShare: analytics?.distratorDominantePercent ?? distribution[topDistractor],
        itemInformationProxy: analytics?.itemInformationProxy ?? Number((0.55 + id * 0.014).toFixed(3)),
        difficultyBand: analytics?.difficultyBand ?? buildMockDifficultyLabel(difficultyLevel).toLowerCase(),
        reviewPriorityLabel: analytics?.reviewPriorityLabel ?? (difficultyLevel >= 4 ? "alta" : "média"),
        qualityLabel: analytics?.qualityLabel ?? "boa",
        discriminationLabel: analytics?.discriminationLabel ?? (triA >= 2.2 ? "forte" : "moderada"),
        bucketSnapshot:
          analytics?.bucketSnapshot ??
          [
          { faixa: "Até 599", acerto: clamp(accuracy - 18, 6, 52), n: 3200 + id * 7 },
          { faixa: "600-699", acerto: clamp(accuracy - 8, 12, 60), n: 4100 + id * 7 },
          { faixa: "700-799", acerto: clamp(accuracy, 18, 72), n: 4700 + id * 7 },
          { faixa: "800-899", acerto: clamp(accuracy + 10, 24, 82), n: 3900 + id * 7 },
          { faixa: "900+", acerto: clamp(accuracy + 18, 30, 91), n: 2200 + id * 7 },
        ],
        distractorByBucket:
          analytics?.distractorByBucket ??
          [
          { faixa: "Até 599", distractor: topDistractor, pct: clamp(distribution[topDistractor] + 5, 12, 48), n: 1200 + id * 3 },
          { faixa: "600-699", distractor: topDistractor, pct: clamp(distribution[topDistractor] + 2, 10, 44), n: 1100 + id * 3 },
          { faixa: "700-799", distractor: options[(index + 4) % options.length], pct: clamp(distribution[topDistractor] - 5, 6, 30), n: 900 + id * 2 },
          { faixa: "800-899", distractor: options[index % options.length], pct: clamp(distribution[topDistractor] - 9, 4, 22), n: 650 + id * 2 },
          { faixa: "900+", distractor: options[(index + 1) % options.length], pct: clamp(distribution[topDistractor] - 12, 3, 16), n: 420 + id * 2 },
        ],
        empiricalCurve:
          analytics?.empiricalCurve ??
          [
          { faixa: "500-599", acerto: clamp(accuracy - 18, 6, 52), n: 2100, notaMedia: 560 },
          { faixa: "600-699", acerto: clamp(accuracy - 8, 12, 60), n: 3200, notaMedia: 650 },
          { faixa: "700-799", acerto: clamp(accuracy, 18, 72), n: 3600, notaMedia: 748 },
          { faixa: "800-899", acerto: clamp(accuracy + 10, 24, 82), n: 2700, notaMedia: 845 },
          { faixa: "900+", acerto: clamp(accuracy + 18, 30, 91), n: 1500, notaMedia: 925 },
        ],
        weakestBucket:
          analytics?.weakestBucket ?? { faixa: "Até 599", acerto: clamp(accuracy - 18, 6, 52), n: 3200 + id * 7 },
        strongestBucket:
          analytics?.strongestBucket ?? { faixa: "900+", acerto: clamp(accuracy + 18, 30, 91), n: 2200 + id * 7 },
        topPerformerGroupLabel:
          analytics?.topPerformerGroupLabel ?? topPerformerMeta.label,
        topPerformerGroupDescription:
          analytics?.topPerformerGroupDescription ?? topPerformerMeta.description,
        topPerformerGroupSampleSize:
          analytics?.topPerformerGroupSampleSize ?? 0,
      },
      resolution:
        generatedFinal
          ? {
              whatItAsks:
                generatedFinal.didacticExplanation?.shortExplanation ||
                `O item pede leitura e decisão em ${theme.toLowerCase()}, usando ${subtheme.toLowerCase()} como eixo principal.`,
              howToSolve:
                generatedFinal.didacticExplanation?.stepByStep?.slice(0, 4).join(" ") ||
                generatedFinal.technicalSolution?.strategy ||
                `A resolução completa ainda será substituída pelos dados reais da área. Por enquanto, o fluxo mantém a mesma estrutura da matemática: identificar a operação central, comparar evidências e validar a alternativa ${correctOption}.`,
              whyErrorsHappen:
                generatedFinal.didacticExplanation?.commonPitfalls?.slice(0, 2).join(" ") ||
                `O erro dominante foi associado à alternativa ${topDistractor}, normalmente por leitura incompleta do comando ou aproximação conceitual insuficiente.`,
              distractorCommentary:
                generatedFinal.distractors?.slice(0, 4).map((entry) =>
                  `Alternativa ${entry.option ?? "?"}: ${entry.likelyReasoning ?? ""} ${entry.whyItLooksPlausible ?? ""} ${entry.whyItIsWrong ?? ""}`.trim(),
                ) ||
                [
                  `O distrator ${topDistractor} organiza a maior parte dos erros observados nesta questão.`,
                  "A leitura por faixa já usa os microdados reais da área.",
                  template.lead,
                ],
            }
          : analytics?.resolution ??
            {
              whatItAsks: `O item pede leitura e decisão em ${theme.toLowerCase()}, usando ${subtheme.toLowerCase()} como eixo principal.`,
              howToSolve: `A resolução completa ainda será substituída pelos dados reais da área. Por enquanto, o fluxo mantém a mesma estrutura da matemática: identificar a operação central, comparar evidências e validar a alternativa ${correctOption}.`,
              whyErrorsHappen: `O erro dominante foi associado à alternativa ${topDistractor}, normalmente por leitura incompleta do comando ou aproximação conceitual insuficiente.`,
              distractorCommentary: [
                `O distrator ${topDistractor} organiza a maior parte dos erros observados nesta questão.`,
                "A leitura por faixa já usa os microdados reais da área.",
                template.lead,
              ],
            },
      officialResolution: generatedFinal?.officialResolution ?? null,
      latexResolution: generatedLatex,
      analyticsSummary:
        analytics?.analyticsSummary ??
        `${meta.label} com estrutura preparada para assets, microdados e leitura analítica do item.`,
      triMetrics: {
        a: triA,
        b: triB,
        c: analytics?.tri.c ?? 0.2,
        rankA: analytics?.rankDiscrimination ?? (((id * 13) % 45) + 1),
        rankB: analytics?.difficultyRankB ?? (((id * 17) % 45) + 1),
        difficultyLevel,
        relativeDifficultyLabel: buildMockDifficultyLabel(difficultyLevel),
      },
    };
  });

  const withRelations = rawQuestions.map((question) => {
    const relatedQuestions: QuestionRelation[] = rawQuestions
      .filter((candidate) => candidate.id !== question.id)
      .map((candidate) => {
        let score = 0;
        const reasons: string[] = [];

        if (candidate.theme === question.theme) {
          score += 30;
          reasons.push(`Mesmo tema: ${candidate.theme}`);
        }
        if (candidate.skill === question.skill) {
          score += 24;
          reasons.push(`Mesma habilidade ${candidate.skill}`);
        }
        if (candidate.metadata.cognitiveType === question.metadata.cognitiveType) {
          score += 16;
          reasons.push(`Mesmo eixo pedagógico`);
        }
        if (Math.abs(candidate.accuracy - question.accuracy) <= 6) {
          score += 12;
          reasons.push("Faixa de acerto parecida");
        }
        if (candidate.topDistractor === question.topDistractor) {
          score += 8;
          reasons.push(`Mesmo distrator ${candidate.topDistractor}`);
        }

        return {
          id: candidate.id,
          relation: reasons[0] ?? "Proximidade temática",
          score,
          reasons: reasons.slice(0, 3),
          description: `Questão ${candidate.examQuestionNumber}: ${reasons.slice(0, 3).join(" • ") || "Proximidade de conteúdo"}.`,
        };
      })
      .sort((left, right) => right.score - left.score || left.id - right.id)
      .slice(0, 4);

    return {
      ...question,
      relatedQuestions,
    };
  });

  yearAreaQuestionCache.set(cacheKey, withRelations);
  return withRelations;
}

function optionIndexSeed(area: AreaSlug) {
  return area === "linguagens" ? 1 : area === "ciencias-humanas" ? 2 : area === "ciencias-natureza" ? 3 : 4;
}

function isExamYear(value: number): value is ExamYear {
  return EXAM_YEARS.some((entry) => entry.year === value);
}

export function getExamYears() {
  return EXAM_YEARS;
}

export function getAvailableExamYears() {
  return EXAM_YEARS.filter((entry) => entry.status === "available");
}

export function isAvailableExamYear(year: number): year is ExamYear {
  return EXAM_YEARS.some((entry) => entry.year === year && entry.status === "available");
}

export function getExamYearMeta(year: number) {
  if (!isExamYear(year)) return null;
  return EXAM_YEARS.find((entry) => entry.year === year) ?? null;
}

export function getAreaMeta(year: ExamYear, area: AreaSlug): AreaMeta {
  return {
    year,
    ...AREA_META_BASE[area],
    pdfFile: getPdfFile(year, area),
  };
}

function withAreaContext(year: ExamYear, area: AreaSlug, question: BaseQuestionPageData): AreaQuestionPageData {
  const meta = getAreaMeta(year, area);
  return {
    ...question,
    year,
    areaSlug: area,
    areaLabel: meta.label,
    areaShortLabel: meta.shortLabel,
    dayLabel: meta.dayLabel,
    yearRoute: `/prova/${year}`,
    areaRoute: `/prova/${year}/${area}`,
    questionRoute: `/questoes/${year}/${area}/${question.id}`,
    pdfFile: meta.pdfFile,
  };
}

export function getAreaQuestionPageData(
  year: ExamYear,
  area: AreaSlug,
  id: number,
): AreaQuestionPageData | null {
  if (year === 2024 && area === "matematica") {
    const question = getMathQuestionPageData(id);
    return question ? withAreaContext(year, area, question) : null;
  }

  const question = buildCatalogAreaQuestions(year, area).find((entry) => entry.id === id);
  return question ? withAreaContext(year, area, question) : null;
}

export function getAreaQuestionSummaries(year: ExamYear, area: AreaSlug): AreaQuestionSummary[] {
  if (year === 2024 && area === "matematica") {
    return getMathExamQuestionSummaries().map((question) => {
      const summary = question as {
        id: number;
        displayNumber: number;
        theme: string;
        skill: string;
        difficulty: string;
        accuracy: number;
        competenceNumber?: number;
        competenceDescription?: string;
        difficultyLevel?: number;
        relativeDifficultyLabel?: string;
      };

      return {
        ...question,
        competenceNumber: Number(summary.competenceNumber ?? 0),
        competenceDescription: String(summary.competenceDescription ?? ""),
        areaSlug: area,
        areaLabel: AREA_META_BASE[area].label,
        difficultyLevel: Number(summary.difficultyLevel ?? 3),
        relativeDifficultyLabel: String(summary.relativeDifficultyLabel ?? summary.difficulty),
      };
    });
  }

  return buildCatalogAreaQuestions(year, area).map((question) => {
    const enrichedQuestion = question as BaseQuestionPageData & {
      competenceNumber?: number;
      competenceDescription?: string;
    };

    return {
      id: question.id,
      displayNumber: question.examQuestionNumber,
      theme: question.theme,
      competenceNumber: enrichedQuestion.competenceNumber ?? 0,
      competenceDescription:
        enrichedQuestion.competenceDescription ?? question.metadata.cognitiveType,
      skill: question.skill,
      difficulty: question.difficulty,
      difficultyLevel: question.triMetrics.difficultyLevel,
      relativeDifficultyLabel: question.triMetrics.relativeDifficultyLabel,
      accuracy: question.accuracy,
      areaSlug: area,
      areaLabel: AREA_META_BASE[area].label,
    };
  });
}

export function getAreaOverviewAnalytics(year: ExamYear, area: AreaSlug): OverviewAnalytics {
  if (year === 2024 && area === "matematica") {
    return getMathExamOverviewAnalytics();
  }

  const questions = getAreaQuestionSummaries(year, area);
  const themeMap = new Map<string, { theme: string; competence: string; count: number; totalAccuracy: number }>();
  const competenceMap = new Map<string, { competence: string; itemCount: number; totalAccuracy: number }>();

  for (const question of questions) {
    const themeEntry = themeMap.get(question.theme) ?? {
      theme: question.theme,
      competence: question.competenceDescription,
      count: 0,
      totalAccuracy: 0,
    };
    themeEntry.count += 1;
    themeEntry.totalAccuracy += question.accuracy;
    themeMap.set(question.theme, themeEntry);

    const competenceEntry = competenceMap.get(question.competenceDescription) ?? {
      competence: question.competenceDescription,
      itemCount: 0,
      totalAccuracy: 0,
    };
    competenceEntry.itemCount += 1;
    competenceEntry.totalAccuracy += question.accuracy;
    competenceMap.set(question.competenceDescription, competenceEntry);
  }

  return {
    themeDistribution: Array.from(themeMap.values())
      .map((entry) => ({
        theme: entry.theme,
        competence: entry.competence,
        count: entry.count,
        averageAccuracy: Number((entry.totalAccuracy / entry.count).toFixed(1)),
      }))
      .sort((left, right) => right.count - left.count || right.averageAccuracy - left.averageAccuracy),
    competenceAccuracy: Array.from(competenceMap.values())
      .map((entry) => ({
        competence: entry.competence,
        itemCount: entry.itemCount,
        averageAccuracy: Number((entry.totalAccuracy / entry.itemCount).toFixed(1)),
      }))
      .sort((left, right) => right.averageAccuracy - left.averageAccuracy),
  };
}

export function getLandingPageData(year: ExamYear) {
  const proofColorFromPdf = (pdfFile: string) =>
    pdfFile.toUpperCase().includes("AZUL")
      ? "Azul"
      : pdfFile.toUpperCase().includes("AMARELO")
        ? "Amarelo"
        : "Não identificado";

  const buildAreaDistribution = (area: AreaSlug) => {
    const questionIds = getAreaQuestionSummaries(year, area).map((question) => question.id);
    const bucketMap = new Map<string, { faixa: string; totalN: number; count: number }>();

    for (const id of questionIds) {
      const question = getAreaQuestionPageData(year, area, id);
      if (!question) continue;

      for (const bucket of question.analyticsSnapshot.empiricalCurve.filter((entry) => entry.n > 0)) {
        const entry = bucketMap.get(bucket.faixa) ?? {
          faixa: bucket.faixa,
          totalN: 0,
          count: 0,
        };
        entry.totalN += bucket.n;
        entry.count += 1;
        bucketMap.set(bucket.faixa, entry);
      }
    }

    return Array.from(bucketMap.values()).map((entry) => ({
      faixa: entry.faixa.replace("[", "").replace(")", "").replace(", ", "–"),
      n: Math.round(entry.totalN / Math.max(entry.count, 1)),
    }))
    .sort((left, right) => bucketStartValue(left.faixa) - bucketStartValue(right.faixa));
  };

  const areas = (Object.keys(AREA_META_BASE) as AreaSlug[]).map((area) => {
    const meta = getAreaMeta(year, area);
    const summaries = getAreaQuestionSummaries(year, area);
    const averageAccuracy = Number(
      (summaries.reduce((sum, question) => sum + question.accuracy, 0) / summaries.length).toFixed(1),
    );

    return {
      slug: area,
      label: meta.label,
      shortLabel: meta.shortLabel,
      dayLabel: meta.dayLabel,
      proofColor: proofColorFromPdf(meta.pdfFile),
      questionCount: summaries.length,
      averageAccuracy,
      lead: meta.lead,
    } satisfies LandingAreaCard;
  });

  const totalQuestions = areas.reduce((sum, area) => sum + area.questionCount, 0);
  const averageAccuracy = Number(
    (
      areas.reduce((sum, area) => sum + area.averageAccuracy * area.questionCount, 0) /
      totalQuestions
    ).toFixed(1),
  );

  const dayGroups = [
    { dayLabel: "Dia 1", areaSlugs: ["linguagens", "ciencias-humanas"] as AreaSlug[] },
    { dayLabel: "Dia 2", areaSlugs: ["ciencias-natureza", "matematica"] as AreaSlug[] },
  ];

  const dayStats: LandingDayStat[] = dayGroups.map((group) => {
    const relatedAreas = areas.filter((area) => group.areaSlugs.includes(area.slug));
    const totalQuestionsForDay = relatedAreas.reduce((sum, area) => sum + area.questionCount, 0);
    const averageAccuracyForDay = Number(
      (
        relatedAreas.reduce((sum, area) => sum + area.averageAccuracy * area.questionCount, 0) /
        totalQuestionsForDay
      ).toFixed(1),
    );

    const distributionMap = new Map<string, { faixa: string; n: number }>();
    for (const areaSlug of group.areaSlugs) {
      for (const bucket of buildAreaDistribution(areaSlug)) {
        const current = distributionMap.get(bucket.faixa) ?? { faixa: bucket.faixa, n: 0 };
        current.n += bucket.n;
        distributionMap.set(bucket.faixa, current);
      }
    }

    const distribution = Array.from(distributionMap.values()).sort(
      (left, right) => bucketStartValue(left.faixa) - bucketStartValue(right.faixa),
    );
    const totalN = distribution.reduce((sum, entry) => sum + entry.n, 0);

    return {
      dayLabel: group.dayLabel,
      areaLabels: relatedAreas.map((area) => area.label),
      averageAccuracy: averageAccuracyForDay,
      totalQuestions: totalQuestionsForDay,
      scoreDistribution: distribution.map((entry) => ({
        ...entry,
        share: totalN ? Number(((entry.n / totalN) * 100).toFixed(1)) : 0,
      })),
    };
  });

  const proofSummary = getProofSummary(year);
  const proofStats: LandingProofStats | null = proofSummary
    ? {
        sampleSize: proofSummary.sampleSize,
        generalScoreDistribution: proofSummary.generalScoreDistribution,
        essayDistribution: proofSummary.essayDistribution,
        topStudents: proofSummary.topStudents,
        overallAccuracyVsScore: proofSummary.overallAccuracyVsScore,
        areas: [
          ...(Object.keys(AREA_META_BASE) as AreaSlug[]).map((area) => ({
            slug: area,
            label: AREA_META_BASE[area].label,
            questionCount: proofSummary.areas[area]?.questionCount ?? 45,
            sampleSize: proofSummary.areas[area]?.sampleSize ?? 0,
            averageAccuracy: proofSummary.areas[area]?.averageAccuracy ?? 0,
            averageScore: proofSummary.areas[area]?.averageScore ?? 0,
            accuracyVsScore: proofSummary.areas[area]?.accuracyVsScore ?? [],
          })),
          {
            slug: "geral",
            label: "Prova completa",
            questionCount: totalQuestions,
            sampleSize: proofSummary.sampleSize,
            averageAccuracy,
            averageScore:
              proofSummary.overallAccuracyVsScore.reduce(
                (sum, entry) => sum + entry.mediaNota * entry.n,
                0,
              ) /
                Math.max(
                  proofSummary.overallAccuracyVsScore.reduce((sum, entry) => sum + entry.n, 0),
                  1,
                ) || 0,
            accuracyVsScore: proofSummary.overallAccuracyVsScore,
          },
        ],
      }
    : null;

  return {
    totalQuestions,
    averageAccuracy,
    areaCount: areas.length,
    areas,
    dayStats,
    proofStats,
  };
}
