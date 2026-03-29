import fs from "node:fs";
import path from "node:path";
import { remapDay2YellowToBlue } from "./day2-yellow-blue-mapping";
import contentDataset from "./generated/enem-2024-math-content.json";
import enrichedDataset from "./generated/enem-2024-math-enriched.json";
import frontendAnalyticsDataset from "./generated/enem-2024-math-frontend-analytics.json";
import extractionOverrides from "./extraction-overrides.json";

export type QuestionRelation = {
  id: number;
  relation: string;
  score: number;
  reasons: string[];
  description: string;
};

export type QuestionMetadata = {
  cognitiveType: string;
  usesChart: boolean;
  abstractionLevel: string;
};

export type QuestionOption = {
  option: string;
  text: string;
  assets: string[];
  displayMode?: "auto" | "asset_only" | "suppressed";
  suppressedReason?: string;
};

export type QuestionAnalyticsData = {
  id: number;
  examQuestionNumber: number;
  year: number;
  area: string;
  theme: string;
  subtheme: string;
  skill: string;
  difficulty: string;
  accuracy: number;
  correctOption: string;
  topDistractor: string;
  difficultyRank: number;
  imageUrl: string;
  comments: string[];
  metadata: QuestionMetadata;
  optionDistribution: Record<"A" | "B" | "C" | "D" | "E", number>;
  relatedQuestions: QuestionRelation[];
};

export type ResolutionContent = {
  whatItAsks: string;
  howToSolve: string;
  whyErrorsHappen: string;
  distractorCommentary: string[];
};

export type LatexResolutionContent = {
  technicalSolution: string;
  formulasUsed: string;
  visualEvidenceUsed: string;
  didacticExplanation: string;
  commonPitfalls: string;
  teachingTips: string;
  distractors: string;
  itemProfile: string;
  fullDocument: string;
};

export type OfficialResolutionContent = {
  emoji: string;
  shortThemeTitle: string;
  interpretationIntro: string;
  commandTerms: Array<{ term: string; explanation: string }>;
  whatTheQuestionAsks: string;
  strategyParagraph: string;
  reviewTable: Array<{ concept: string; keyIdea: string; application: string }>;
  theoryParagraphs: string[];
  resolutionParagraphs: string[];
  puloDoGato: string;
  alternatives: Array<{ option: string; isCorrect: boolean; explanation: string }>;
  questionCode: string;
};

type ProficiencyBucketSnapshot = {
  faixa: string;
  acerto: number;
  n: number;
};

type DistractorBucketSnapshot = {
  faixa: string;
  distractor: string;
  pct: number;
  n: number;
};

type EmpiricalCurvePoint = {
  faixa: string;
  acerto: number;
  n: number;
  notaMedia: number;
};

export type AnalyticsSnapshot = {
  sampleSize: number;
  averageScore: number;
  thetaAverage: number;
  informationLabel: string;
  rankDiscrimination: number;
  rankInformation: number;
  discriminationGapLt600To900: number;
  discriminationGap700To900: number;
  dominantDistractorShare: number;
  itemInformationProxy: number;
  difficultyBand: string;
  reviewPriorityLabel: string;
  qualityLabel: string;
  discriminationLabel: string;
  bucketSnapshot: ProficiencyBucketSnapshot[];
  distractorByBucket: DistractorBucketSnapshot[];
  empiricalCurve: EmpiricalCurvePoint[];
  weakestBucket: ProficiencyBucketSnapshot | null;
  strongestBucket: ProficiencyBucketSnapshot | null;
};

type ExtractedQuestionContent = {
  id: number;
  examQuestionNumber: number;
  year: number;
  area: string;
  title: string;
  sourcePages: number[];
  statement: string;
  statementAssets: string[];
  imageUrl: string;
  options: QuestionOption[];
  rawText: string;
  coPosicao: number;
  coItem: number;
  coProva: number;
  coProvasEquivalentes: number[];
  color: string;
  areaCode: string;
  areaDescription: string;
  gabarito: string;
  coHabilidade: number;
  skillCode: string;
  skillDescription: string;
  competenceNumber: number;
  competenceDescription: string;
  theme: string;
  subtheme: string;
  knowledgeObjects: string[];
};

type EnrichedDataset = {
  metadata: {
    year: number;
    areaCode: string;
    areaDescription: string;
    color: string;
    canonicalProof: number;
    equivalentProofs: number[];
  };
  questions: ExtractedQuestionContent[];
};

type DisplayOnlyQuestionContent = Pick<
  ExtractedQuestionContent,
  | "id"
  | "examQuestionNumber"
  | "year"
  | "area"
  | "title"
  | "sourcePages"
  | "statement"
  | "statementAssets"
  | "imageUrl"
  | "options"
  | "rawText"
>;

type DisplayDataset = {
  questions: DisplayOnlyQuestionContent[];
};

type FrontendAnalyticsQuestion = {
  id: number;
  familyId: number;
  questaoCanonica: string;
  coItem: number;
  coProvaRefAzul: number;
  coHabilidade: number;
  correctOption: string;
  accuracy: number;
  difficulty: string;
  difficultyRank: number;
  topDistractor: string;
  topPerformerDistribution?: Record<"A" | "B" | "C" | "D" | "E", number>;
  optionDistribution: Record<"A" | "B" | "C" | "D" | "E", number>;
  proficiencyAccuracy: Array<{ faixa: string; acerto: number }>;
  comments: string[];
  analyticsSummary: string;
  classification: string;
  difficultyLabel: string;
  discriminationLabel: string;
  distractorLabel: string;
  qualityLabel: string;
  reviewPriorityLabel: string;
  sampleSize: number;
  bucketSnapshot: ProficiencyBucketSnapshot[];
  distractorByBucket: DistractorBucketSnapshot[];
  empiricalCurve: EmpiricalCurvePoint[];
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
  shareErroNoPrincipalDistrator: number;
  distratorDominantePercent: number;
  faixaDificuldadeEmpirica: string;
};

type FrontendAnalyticsDataset = {
  metadata: {
    familyId: number;
    finalCardsSource: string;
    distractorsSource: string;
    curveSource: string;
  };
  questions: FrontendAnalyticsQuestion[];
};

export type QuestionPageData = QuestionAnalyticsData & {
  title: string;
  statement: string;
  statementAssets: string[];
  sourcePages: number[];
  rawText: string;
  options: QuestionOption[];
  topPerformerDistribution: Array<{ option: "A" | "B" | "C" | "D" | "E"; value: number }>;
  proficiencyAccuracy: Array<{ faixa: string; acerto: number }>;
  analyticsSnapshot: AnalyticsSnapshot;
  resolution: ResolutionContent;
  officialResolution: OfficialResolutionContent | null;
  latexResolution: LatexResolutionContent | null;
  analyticsSummary?: string;
  triMetrics: {
    a: number;
    b: number;
    c: number;
    rankA: number;
    rankB: number;
    difficultyLevel: number;
    relativeDifficultyLabel: string;
  };
};

type ExtractionOverrides = Record<
  string,
  {
    options?: Record<
      string,
      {
        mode?: "asset_only" | "suppress_text";
        reason?: string;
      }
    >;
  }
>;

const displayQuestionMap = new Map<number, DisplayOnlyQuestionContent>(
  (contentDataset as DisplayDataset).questions.map((question) => [
    question.id,
    question,
  ]),
);

const enrichedQuestionMap = new Map<number, ExtractedQuestionContent>(
  (enrichedDataset as EnrichedDataset).questions.map((question) => [
    question.id,
    question,
  ]),
);

const analyticsQuestions = (frontendAnalyticsDataset as FrontendAnalyticsDataset).questions;

const analyticsQuestionMapById = new Map<number, FrontendAnalyticsQuestion>(
  analyticsQuestions.map((question) => [question.id, question]),
);

const analyticsQuestionMapByItem = new Map<number, FrontendAnalyticsQuestion>(
  analyticsQuestions.map((question) => [question.coItem, question]),
);

const fallbackOptionDistribution: Record<"A" | "B" | "C" | "D" | "E", number> = {
  A: 20,
  B: 20,
  C: 20,
  D: 20,
  E: 20,
};

const extractionOverrideMap = extractionOverrides as ExtractionOverrides;

const triRankByA = new Map<number, number>(
  [...analyticsQuestions]
    .sort((left, right) => right.tri.a - left.tri.a)
    .map((question, index) => [question.id, index + 1]),
);

const triRankByB = new Map<number, number>(
  [...analyticsQuestions]
    .sort((left, right) => right.tri.b - left.tri.b)
    .map((question, index) => [question.id, index + 1]),
);

function getLatexResolutionContent(
  examQuestionNumber: number,
): LatexResolutionContent | null {
  const candidatePaths = [
    path.join(
      process.cwd(),
      `data/output-enem-2024-latex/enem-2024-q${examQuestionNumber}/04-latex.json`,
    ),
    path.join(
      process.cwd(),
      `data/output-latex-three/enem-2024-q${examQuestionNumber}/04-latex.json`,
    ),
    path.join(
      process.cwd(),
      `data/output-latex-batch/enem-2024-q${examQuestionNumber}/04-latex.json`,
    ),
  ];

  const filePath = candidatePaths.find((candidate) => fs.existsSync(candidate));
  if (!filePath) return null;

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as { payload?: LatexResolutionContent };
    return parsed.payload ?? null;
  } catch {
    return null;
  }
}

function createFallbackExtractedQuestion(id: number): ExtractedQuestionContent {
  const examQuestionNumber = 135 + id;

  return {
    id,
    examQuestionNumber,
    year: 2024,
    area: "Matemática",
    title: `Questão ${examQuestionNumber} — ENEM 2024 — Matemática`,
    sourcePages: [],
    statement:
      "Conteúdo ainda não extraído. Rode o pipeline de importação para preencher o enunciado, as alternativas e os assets visuais reais.",
    statementAssets: [],
    imageUrl: "/placeholder.png",
    options: [
      { option: "A", text: "", assets: [] },
      { option: "B", text: "", assets: [] },
      { option: "C", text: "", assets: [] },
      { option: "D", text: "", assets: [] },
      { option: "E", text: "", assets: [] },
    ],
    rawText: "",
    coPosicao: examQuestionNumber,
    coItem: 0,
    coProva: 0,
    coProvasEquivalentes: [],
    color: "AZUL",
    areaCode: "MT",
    areaDescription: "Matemática",
    gabarito: "A",
    coHabilidade: 0,
    skillCode: "H0",
    skillDescription: "Habilidade não identificada.",
    competenceNumber: 0,
    competenceDescription: "Competência não identificada.",
    theme: "Tema não identificado",
    subtheme: "Subtema não identificado",
    knowledgeObjects: [],
  };
}

function getExtractedContent(id: number) {
  const displayQuestion = displayQuestionMap.get(id);
  if (!displayQuestion) {
    return createFallbackExtractedQuestion(id);
  }

  const remappedId = remapDay2YellowToBlue("matematica", id);
  const enrichedQuestion =
    enrichedQuestionMap.get(remappedId) ??
    enrichedQuestionMap.get(id) ??
    null;

  if (!enrichedQuestion) {
    return {
      ...createFallbackExtractedQuestion(id),
      ...displayQuestion,
    };
  }

  return {
    ...enrichedQuestion,
    ...displayQuestion,
    id,
    examQuestionNumber: displayQuestion.examQuestionNumber,
    title: displayQuestion.title,
    sourcePages: displayQuestion.sourcePages,
    statement: displayQuestion.statement,
    statementAssets: displayQuestion.statementAssets,
    imageUrl: displayQuestion.imageUrl,
    options: displayQuestion.options,
    rawText: displayQuestion.rawText,
  };
}

function getAnalyticsContent(
  id: number,
  extractedContent: ExtractedQuestionContent,
): FrontendAnalyticsQuestion | null {
  const remappedId = remapDay2YellowToBlue("matematica", id);
  return (
    analyticsQuestionMapById.get(remappedId) ??
    analyticsQuestionMapByItem.get(extractedContent.coItem) ??
    analyticsQuestionMapById.get(id) ??
    null
  );
}

function isLowConfidenceOptionText(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return false;
  }

  const digitCount = (normalized.match(/\d/g) ?? []).length;
  const letterCount = (normalized.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
  const punctuationCount = (normalized.match(/[!@#$%^&*_=+~`|\\<>]/g) ?? []).length;
  const tokens = normalized.split(" ").filter(Boolean);
  const singleCharTokens = tokens.filter((token) => token.length === 1).length;

  if (/(?:!\s*){4,}/.test(normalized)) {
    return true;
  }

  if (digitCount >= 8 && letterCount === 0) {
    return true;
  }

  if (singleCharTokens >= 8 && singleCharTokens >= Math.ceil(tokens.length * 0.7)) {
    return true;
  }

  if (punctuationCount >= 6 && letterCount < 4) {
    return true;
  }

  return false;
}

function sanitizeOptions(extractedContent: ExtractedQuestionContent): QuestionOption[] {
  const overrides = extractionOverrideMap[String(extractedContent.examQuestionNumber)]?.options ?? {};

  return extractedContent.options.map((option) => {
    const override = overrides[option.option];

    if (override?.mode === "asset_only") {
      return {
        ...option,
        text: "",
        displayMode: "asset_only",
        suppressedReason: override.reason,
      };
    }

    if (override?.mode === "suppress_text") {
      return {
        ...option,
        text: "",
        displayMode: "suppressed",
        suppressedReason: override.reason,
      };
    }

    if (isLowConfidenceOptionText(option.text)) {
      return {
        ...option,
        text: "",
        displayMode: option.assets.length > 0 ? "asset_only" : "suppressed",
        suppressedReason: "Texto OCR com baixa confiança foi ocultado.",
      };
    }

    return {
      ...option,
      displayMode: option.assets.length > 0 ? "auto" : "auto",
    };
  });
}

function buildFallbackComments(extractedContent: ExtractedQuestionContent) {
  return [
    "Questão sem analytics consolidados no pipeline copiado para o projeto.",
    "O item mantém tema, habilidade e gabarito reais da base oficial enriquecida.",
    `A competência associada é: ${extractedContent.competenceDescription}`,
  ];
}

function buildFallbackProficiencyAccuracy() {
  return [
    { faixa: "Até 599", acerto: 0 },
    { faixa: "600-699", acerto: 0 },
    { faixa: "700-799", acerto: 0 },
    { faixa: "800-899", acerto: 0 },
    { faixa: "900+", acerto: 0 },
  ];
}

function buildTopPerformerDistribution(
  correctOption: string,
  distribution?: Record<"A" | "B" | "C" | "D" | "E", number>,
) {
  const options = ["A", "B", "C", "D", "E"] as const;
  const correct = options.includes(correctOption as (typeof options)[number])
    ? (correctOption as (typeof options)[number])
    : "C";

  const source = distribution ?? fallbackOptionDistribution;
  const boostedCorrect = Math.max(source[correct] + 22, 48);
  const leftover = Math.max(100 - boostedCorrect, 0);
  const wrongOptions = options.filter((option) => option !== correct);
  const weights = wrongOptions.map((option) => Math.max(source[option], 1));
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);

  const values = wrongOptions.map((option, index) => ({
    option,
    value: Number(((leftover * weights[index]) / totalWeight).toFixed(1)),
  }));

  const currentTotal =
    boostedCorrect + values.reduce((sum, entry) => sum + entry.value, 0);
  const adjustment = Number((100 - currentTotal).toFixed(1));
  if (values.length > 0) {
    values[values.length - 1].value = Number(
      (values[values.length - 1].value + adjustment).toFixed(1),
    );
  }

  return options.map((option) =>
    option === correct
      ? { option, value: Number(boostedCorrect.toFixed(1)) }
      : values.find((entry) => entry.option === option) ?? { option, value: 0 },
  );
}

function prettifyAnalyticLabel(value: string) {
  return value.replace(/_/g, " ").trim();
}

function buildFallbackAnalyticsSnapshot(): AnalyticsSnapshot {
  const bucketSnapshot = [
    { faixa: "Até 599", acerto: 0, n: 0 },
    { faixa: "600-699", acerto: 0, n: 0 },
    { faixa: "700-799", acerto: 0, n: 0 },
    { faixa: "800-899", acerto: 0, n: 0 },
    { faixa: "900+", acerto: 0, n: 0 },
  ];

  return {
    sampleSize: 0,
    averageScore: 0,
    thetaAverage: 0,
    informationLabel: "Indefinida",
    rankDiscrimination: 0,
    rankInformation: 0,
    discriminationGapLt600To900: 0,
    discriminationGap700To900: 0,
    dominantDistractorShare: 0,
    itemInformationProxy: 0,
    difficultyBand: "indefinida",
    reviewPriorityLabel: "indefinida",
    qualityLabel: "indefinida",
    discriminationLabel: "indefinida",
    bucketSnapshot,
    distractorByBucket: bucketSnapshot.map((bucket) => ({
      faixa: bucket.faixa,
      distractor: "-",
      pct: 0,
      n: 0,
    })),
    empiricalCurve: [],
    weakestBucket: bucketSnapshot[0],
    strongestBucket: bucketSnapshot[bucketSnapshot.length - 1],
  };
}

function buildAnalyticsSnapshot(
  analyticsContent: FrontendAnalyticsQuestion | null,
): AnalyticsSnapshot {
  if (!analyticsContent) {
    return buildFallbackAnalyticsSnapshot();
  }

  const bucketSnapshot = analyticsContent.bucketSnapshot;
  const weakestBucket =
    [...bucketSnapshot].sort((left, right) => left.acerto - right.acerto)[0] ?? null;
  const strongestBucket =
    [...bucketSnapshot].sort((left, right) => right.acerto - left.acerto)[0] ?? null;

  return {
    sampleSize: analyticsContent.sampleSize,
    averageScore: analyticsContent.averageScore,
    thetaAverage: analyticsContent.thetaAverage,
    informationLabel: analyticsContent.informationLabel,
    rankDiscrimination: analyticsContent.rankDiscrimination,
    rankInformation: analyticsContent.rankInformation,
    discriminationGapLt600To900: analyticsContent.discriminationGapLt600To900,
    discriminationGap700To900: analyticsContent.discriminationGap700To900,
    dominantDistractorShare: analyticsContent.shareErroNoPrincipalDistrator,
    itemInformationProxy: analyticsContent.itemInformationProxy,
    difficultyBand: prettifyAnalyticLabel(analyticsContent.faixaDificuldadeEmpirica),
    reviewPriorityLabel: prettifyAnalyticLabel(analyticsContent.reviewPriorityLabel),
    qualityLabel: prettifyAnalyticLabel(analyticsContent.qualityLabel),
    discriminationLabel: prettifyAnalyticLabel(analyticsContent.discriminationLabel),
    bucketSnapshot,
    distractorByBucket: analyticsContent.distractorByBucket,
    empiricalCurve: analyticsContent.empiricalCurve,
    weakestBucket,
    strongestBucket,
  };
}

function buildResolution(
  extractedContent: ExtractedQuestionContent,
  analyticsContent: FrontendAnalyticsQuestion | null,
  analyticsSnapshot: AnalyticsSnapshot,
): ResolutionContent {
  const lowBucketDistractor = analyticsSnapshot.distractorByBucket[0];
  const highBucketDistractor =
    analyticsSnapshot.distractorByBucket[analyticsSnapshot.distractorByBucket.length - 1];
  const sameDistractorAcrossBands =
    lowBucketDistractor?.distractor &&
    lowBucketDistractor.distractor === highBucketDistractor?.distractor &&
    lowBucketDistractor.distractor !== "-";

  const distractorCommentary = analyticsContent
    ? [
        `O distrator ${analyticsContent.topDistractor} concentrou ${analyticsSnapshot.dominantDistractorShare.toFixed(1)}% dos erros válidos, então ele merece leitura prioritária na revisão do item.`,
        sameDistractorAcrossBands
          ? `O mesmo distrator aparece das faixas mais baixas às mais altas (${lowBucketDistractor?.distractor}), sinal de erro conceitual persistente e não só de cálculo.`
          : `Nas faixas mais baixas o erro dominante foi ${lowBucketDistractor?.distractor ?? "-"}, enquanto no topo da distribuição aparece ${highBucketDistractor?.distractor ?? "-"}, sugerindo tropeços diferentes conforme a proficiência.`,
        analyticsSnapshot.discriminationGapLt600To900 > 40
          ? "A abertura de acerto entre a base e o topo da distribuição é alta, então a questão separa bem alunos que já dominam o repertório exigido."
          : "A abertura de acerto entre faixas é moderada, então o item informa mais por padrão de erro do que por separação extrema de desempenho.",
      ]
    : [
        "Sem analytics locais consolidados, os distratores ainda precisam ser lidos manualmente.",
      ];

  return {
    whatItAsks: `O item trabalha ${extractedContent.theme.toLowerCase()} no subtema ${extractedContent.subtheme.toLowerCase()}, mobilizando a habilidade ${extractedContent.skillCode}. O foco é identificar a relação matemática central do enunciado antes de comparar as alternativas.`,
    howToSolve: `Organize as informações relevantes, traduza a situação para uma expressão ou comparação coerente com ${extractedContent.theme.toLowerCase()} e só então confronte as opções até chegar à letra ${extractedContent.gabarito}. Este bloco ainda é local e pode ser substituído depois por uma resolução editorial passo a passo.`,
    whyErrorsHappen: analyticsContent
      ? `Nos microdados agregados, o distrator dominante foi ${analyticsContent.topDistractor}. A leitura por faixa mostra que os erros se concentram em interpretação/modelagem antes da validação final da alternativa correta.`
      : "Sem curva analítica disponível, os erros ainda precisam ser interpretados manualmente a partir do enunciado e dos distratores.",
    distractorCommentary,
  };
}

function buildAbstractionLevel(difficulty: string) {
  if (difficulty === "Muito difícil") {
    return "Alto";
  }
  if (difficulty === "Difícil") {
    return "Médio-alto";
  }
  if (difficulty === "Média") {
    return "Médio";
  }
  return "Básico";
}

function mapRelativeDifficultyLevel(difficultyRank: number) {
  if (!difficultyRank) {
    return 3;
  }

  if (difficultyRank <= 9) {
    return 5;
  }
  if (difficultyRank <= 18) {
    return 4;
  }
  if (difficultyRank <= 27) {
    return 3;
  }
  if (difficultyRank <= 36) {
    return 2;
  }
  return 1;
}

function getRelativeDifficultyLabel(level: number) {
  switch (level) {
    case 5:
      return "Muito alta";
    case 4:
      return "Alta";
    case 3:
      return "Média";
    case 2:
      return "Baixa";
    case 1:
      return "Muito baixa";
    default:
      return "Média";
  }
}

function buildRelationEntries(
  currentId: number,
  extractedContent: ExtractedQuestionContent,
  analyticsContent: FrontendAnalyticsQuestion | null,
) {
  const candidates: QuestionRelation[] = [];

  for (let candidateId = 1; candidateId <= 45; candidateId += 1) {
    if (candidateId === currentId) {
      continue;
    }

    const candidateExtracted = getExtractedContent(candidateId);
    const candidateAnalytics = getAnalyticsContent(candidateId, candidateExtracted);
    const reasons: string[] = [];
    let score = 0;

    if (candidateExtracted.skillCode === extractedContent.skillCode) {
      score += 40;
      reasons.push(`Mesma habilidade ${candidateExtracted.skillCode}`);
    }

    if (candidateExtracted.subtheme === extractedContent.subtheme) {
      score += 28;
      reasons.push(`Mesmo subtema: ${candidateExtracted.subtheme}`);
    } else if (candidateExtracted.theme === extractedContent.theme) {
      score += 18;
      reasons.push(`Mesmo tema: ${candidateExtracted.theme}`);
    }

    if (candidateExtracted.competenceNumber === extractedContent.competenceNumber) {
      score += 14;
      reasons.push(`Mesma competência C${candidateExtracted.competenceNumber}`);
    }

    if (analyticsContent && candidateAnalytics) {
      if (candidateAnalytics.difficulty === analyticsContent.difficulty) {
        score += 12;
        reasons.push(`Mesma dificuldade empírica (${candidateAnalytics.difficulty})`);
      }

      const accuracyDistance = Math.abs(candidateAnalytics.accuracy - analyticsContent.accuracy);
      if (accuracyDistance <= 4) {
        score += 10;
        reasons.push(`Acerto muito próximo (${accuracyDistance.toFixed(1)} p.p. de diferença)`);
      } else if (accuracyDistance <= 8) {
        score += 6;
        reasons.push(`Acerto próximo (${accuracyDistance.toFixed(1)} p.p. de diferença)`);
      }

      if (candidateAnalytics.topDistractor === analyticsContent.topDistractor) {
        score += 12;
        reasons.push(`Mesmo distrator dominante (${candidateAnalytics.topDistractor})`);
      }

      if (candidateAnalytics.discriminationLabel === analyticsContent.discriminationLabel) {
        score += 8;
        reasons.push(
          `Mesmo perfil de discriminação (${prettifyAnalyticLabel(candidateAnalytics.discriminationLabel)})`,
        );
      }

      const infoDistance = Math.abs(
        candidateAnalytics.itemInformationProxy - analyticsContent.itemInformationProxy,
      );
      if (infoDistance <= 0.08) {
        score += 8;
        reasons.push("Potencial informativo parecido");
      }
    }

    if (
      (candidateExtracted.statementAssets.length > 0) ===
      (extractedContent.statementAssets.length > 0)
    ) {
      score += 4;
      reasons.push(
        candidateExtracted.statementAssets.length > 0
          ? "Mesmo perfil visual no enunciado"
          : "Perfil predominantemente textual",
      );
    }

    if (score <= 0) {
      continue;
    }

    const primaryReason = reasons[0] ?? "Proximidade temática";
    candidates.push({
      id: candidateId,
      relation: primaryReason,
      score,
      reasons: reasons.slice(0, 3),
      description: `Questão ${candidateExtracted.examQuestionNumber} com alta proximidade em conteúdo e comportamento analítico.`,
    });
  }

  return candidates
    .sort((left, right) => right.score - left.score || left.id - right.id)
    .slice(0, 4)
    .map((relation) => {
      const related = getExtractedContent(relation.id);
      return {
        ...relation,
        description: `Questão ${related.examQuestionNumber}: ${relation.reasons.join(" • ")}.`,
      };
    });
}

export function getQuestionPageData(id: number): QuestionPageData | null {
  if (id < 1 || id > 45) {
    return null;
  }

  const extractedContent = getExtractedContent(id);
  const analyticsContent = getAnalyticsContent(id, extractedContent);
  const analyticsSnapshot = buildAnalyticsSnapshot(analyticsContent);
  const relatedEntries = buildRelationEntries(id, extractedContent, analyticsContent);
  const difficultyRank = analyticsContent?.difficultyRank ?? 0;
  const relativeDifficultyLevel = mapRelativeDifficultyLevel(difficultyRank);
  const canonicalResolutionQuestionNumber =
    enrichedQuestionMap.get(remapDay2YellowToBlue("matematica", id))?.examQuestionNumber ??
    extractedContent.examQuestionNumber;

  return {
    id,
    examQuestionNumber: extractedContent.examQuestionNumber,
    year: extractedContent.year,
    area: extractedContent.area,
    title: extractedContent.title,
    statement: extractedContent.statement,
    statementAssets: extractedContent.statementAssets,
    sourcePages: extractedContent.sourcePages,
    rawText: extractedContent.rawText,
    options: sanitizeOptions(extractedContent),
    topPerformerDistribution: buildTopPerformerDistribution(
      analyticsContent?.correctOption ?? extractedContent.gabarito,
      analyticsContent?.topPerformerDistribution,
    ),
    theme: extractedContent.theme,
    subtheme: extractedContent.subtheme,
    skill: extractedContent.skillCode,
    difficulty: analyticsContent?.difficulty ?? "Sem classificação",
    accuracy: analyticsContent?.accuracy ?? 0,
    correctOption: analyticsContent?.correctOption ?? extractedContent.gabarito,
    topDistractor: analyticsContent?.topDistractor ?? "-",
    difficultyRank,
    imageUrl: extractedContent.imageUrl,
    comments: analyticsContent?.comments ?? buildFallbackComments(extractedContent),
    metadata: {
      cognitiveType: extractedContent.competenceDescription,
      usesChart:
        extractedContent.statementAssets.length > 0 ||
        extractedContent.options.some((option) => option.assets.length > 0),
      abstractionLevel: buildAbstractionLevel(analyticsContent?.difficulty ?? "Média"),
    },
    optionDistribution:
      analyticsContent?.optionDistribution ?? fallbackOptionDistribution,
    relatedQuestions: relatedEntries,
    proficiencyAccuracy:
      analyticsContent?.proficiencyAccuracy ?? buildFallbackProficiencyAccuracy(),
    analyticsSnapshot,
    resolution: buildResolution(extractedContent, analyticsContent, analyticsSnapshot),
    officialResolution: null,
    latexResolution: getLatexResolutionContent(canonicalResolutionQuestionNumber),
    analyticsSummary: analyticsContent?.analyticsSummary,
    triMetrics: {
      a: Number((analyticsContent?.tri.a ?? 0).toFixed(2)),
      b: Number((analyticsContent?.tri.b ?? 0).toFixed(2)),
      c: Number((analyticsContent?.tri.c ?? 0).toFixed(2)),
      rankA: analyticsContent ? (triRankByA.get(analyticsContent.id) ?? 0) : 0,
      rankB: analyticsContent ? (triRankByB.get(analyticsContent.id) ?? 0) : 0,
      difficultyLevel: relativeDifficultyLevel,
      relativeDifficultyLabel: getRelativeDifficultyLabel(relativeDifficultyLevel),
    },
  };
}

export function getExamQuestionSummaries() {
  return Array.from({ length: 45 }, (_, index) => {
    const id = index + 1;
    const question = getQuestionPageData(id);

    if (!question) {
      throw new Error("Question summary generation failed.");
    }

    return {
      id: question.id,
      displayNumber: question.examQuestionNumber,
      theme: question.theme,
      competenceNumber: getExtractedContent(id).competenceNumber,
      competenceDescription: getExtractedContent(id).competenceDescription,
      skill: question.skill,
      difficulty: question.difficulty,
      difficultyLevel: question.triMetrics.difficultyLevel,
      relativeDifficultyLabel: question.triMetrics.relativeDifficultyLabel,
      accuracy: question.accuracy,
    };
  });
}

export function getExamOverviewAnalytics() {
  const questions = getExamQuestionSummaries();

  const themeMap = new Map<
    string,
    { theme: string; competence: string; count: number; totalAccuracy: number }
  >();
  const competenceMap = new Map<
    string,
    { competence: string; itemCount: number; averageAccuracy: number }
  >();

  for (const question of questions) {
    const themeEntry = themeMap.get(question.theme) ?? {
      theme: question.theme,
      competence:
        question.competenceNumber > 0
          ? `C${question.competenceNumber}`
          : "Sem competência",
      count: 0,
      totalAccuracy: 0,
    };
    themeEntry.count += 1;
    themeEntry.totalAccuracy += question.accuracy;
    themeMap.set(question.theme, themeEntry);

    const competenceLabel =
      question.competenceNumber > 0
        ? `C${question.competenceNumber}`
        : "Sem competência";
    const competenceEntry = competenceMap.get(competenceLabel) ?? {
      competence: competenceLabel,
      itemCount: 0,
      averageAccuracy: 0,
    };
    competenceEntry.itemCount += 1;
    competenceEntry.averageAccuracy += question.accuracy;
    competenceMap.set(competenceLabel, competenceEntry);
  }

  const themeDistribution = Array.from(themeMap.values())
    .map((entry) => ({
      theme: entry.theme,
      competence: entry.competence,
      count: entry.count,
      averageAccuracy: Number((entry.totalAccuracy / entry.count).toFixed(1)),
    }))
    .sort((left, right) => right.count - left.count || right.averageAccuracy - left.averageAccuracy);

  const competenceAccuracy = Array.from(competenceMap.values())
    .map((entry) => ({
      competence: entry.competence,
      itemCount: entry.itemCount,
      averageAccuracy: Number((entry.averageAccuracy / entry.itemCount).toFixed(1)),
    }))
    .sort((left, right) => right.averageAccuracy - left.averageAccuracy);

  return {
    themeDistribution,
    competenceAccuracy,
  };
}
