import fs from "node:fs";
import path from "node:path";
import {
  getExamOverviewAnalytics as getMathExamOverviewAnalytics,
  getExamQuestionSummaries as getMathExamQuestionSummaries,
  getQuestionPageData as getMathQuestionPageData,
  type QuestionPageData as BaseQuestionPageData,
  type QuestionRelation,
} from "./mock-question";

export type AreaSlug =
  | "linguagens"
  | "ciencias-humanas"
  | "ciencias-natureza"
  | "matematica";

export type AreaMeta = {
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
  accuracy: number;
  areaSlug: AreaSlug;
  areaLabel: string;
};

export type AreaQuestionPageData = BaseQuestionPageData & {
  areaSlug: AreaSlug;
  areaLabel: string;
  areaShortLabel: string;
  dayLabel: string;
  areaRoute: string;
  questionRoute: string;
  pdfFile: string;
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
  pdfFile: string;
  questionCount: number;
  averageAccuracy: number;
  strongestTheme: string;
  sampleQuestion: number;
  lead: string;
};

const AREA_META: Record<AreaSlug, AreaMeta> = {
  linguagens: {
    slug: "linguagens",
    label: "Linguagens",
    shortLabel: "LG",
    dayLabel: "Dia 1",
    pdfFile: "ENEM_2024_P1_CAD_01_DIA_1_AZUL.pdf",
    questionOffset: 0,
    lead: "Leitura, interpretação, gêneros, língua e artes em uma mesma trilha analítica.",
  },
  "ciencias-humanas": {
    slug: "ciencias-humanas",
    label: "Ciências Humanas",
    shortLabel: "CH",
    dayLabel: "Dia 1",
    pdfFile: "ENEM_2024_P1_CAD_01_DIA_1_AZUL.pdf",
    questionOffset: 45,
    lead: "História, geografia, filosofia e sociologia organizadas como prova navegável.",
  },
  "ciencias-natureza": {
    slug: "ciencias-natureza",
    label: "Ciências da Natureza",
    shortLabel: "CN",
    dayLabel: "Dia 2",
    pdfFile: "ENEM_2024_P1_CAD_05_DIA_2_AMARELO.pdf",
    questionOffset: 90,
    lead: "Física, química e biologia com a mesma lógica de leitura por item e por desempenho.",
  },
  matematica: {
    slug: "matematica",
    label: "Matemática",
    shortLabel: "MT",
    dayLabel: "Dia 2",
    pdfFile: "ENEM_2024_P1_CAD_05_DIA_2_AMARELO.pdf",
    questionOffset: 135,
    lead: "Questões com assets extraídos, analytics e resolução editorial já integrados.",
  },
};

const MOCK_AREA_TEMPLATES: Record<
  Exclude<AreaSlug, "matematica">,
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
};

const mockAreaCache = new Map<Exclude<AreaSlug, "matematica">, BaseQuestionPageData[]>();
const extractedAreaCache = new Map<Exclude<AreaSlug, "matematica">, ExtractedAreaQuestion[]>();

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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildMockAccuracy(id: number, area: Exclude<AreaSlug, "matematica">) {
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

function getExtractedContentPath(area: Exclude<AreaSlug, "matematica">) {
  return path.join(
    process.cwd(),
    "src/data/generated",
    `enem-2024-${area}-content.json`,
  );
}

function loadExtractedAreaQuestions(area: Exclude<AreaSlug, "matematica">) {
  const cached = extractedAreaCache.get(area);
  if (cached) {
    return cached;
  }

  const filePath = getExtractedContentPath(area);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
      questions?: ExtractedAreaQuestion[];
    };
    const questions = parsed.questions ?? [];
    extractedAreaCache.set(area, questions);
    return questions;
  } catch {
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

function buildMockAreaQuestions(area: Exclude<AreaSlug, "matematica">) {
  const cached = mockAreaCache.get(area);
  if (cached) {
    return cached;
  }

  const meta = AREA_META[area];
  const template = MOCK_AREA_TEMPLATES[area];
  const extractedQuestions = loadExtractedAreaQuestions(area);
  const extractedQuestionMap = new Map<number, ExtractedAreaQuestion>(
    (extractedQuestions ?? []).map((question) => [question.id, question]),
  );
  const options = ["A", "B", "C", "D", "E"] as const;
  const rawQuestions: BaseQuestionPageData[] = Array.from({ length: 45 }, (_, index) => {
    const id = index + 1;
    const examQuestionNumber = meta.questionOffset + id;
    const extracted = extractedQuestionMap.get(id);
    const theme = template.themes[index % template.themes.length];
    const subtheme = template.subthemes[(index + 2) % template.subthemes.length];
    const competence = template.competencies[index % template.competencies.length];
    const skill = `${template.skillPrefix}${((index % 30) + 1).toString().padStart(2, "0")}`;
    const correctOption = options[(index + 2) % options.length];
    const topDistractor = options[(index + 3) % options.length];
    const accuracy = clamp(buildMockAccuracy(id, area), 19, 68);
    const difficulty = buildMockDifficulty(accuracy);
    const difficultyRank = ((index * 11) % 45) + 1;
    const difficultyLevel = buildMockDifficultyLevel(difficultyRank);
    const distribution = buildMockOptionDistribution(id, correctOption);
    const triA = Number((0.9 + ((id * 13) % 23) / 10).toFixed(2));
    const triB = Number((-0.4 + ((id * 17) % 31) / 10).toFixed(2));

    return {
      id,
      examQuestionNumber: extracted?.examQuestionNumber ?? examQuestionNumber,
      year: extracted?.year ?? 2024,
      area: extracted?.area ?? meta.label,
      title:
        extracted?.title ??
        `Questão ${examQuestionNumber} — ENEM 2024 — ${meta.label}`,
      statement:
        extracted?.statement ??
        `Mock temporário da questão ${examQuestionNumber} de ${meta.label.toLowerCase()}, preparado para receber depois o enunciado real, alternativas reais, assets e resolução específica da área.`,
      statementAssets: extracted?.statementAssets ?? [],
      sourcePages: extracted?.sourcePages ?? [Math.ceil(id / 3)],
      rawText: extracted?.rawText ?? "",
      options: (extracted?.options ?? options.map((option) => ({
        option,
        text: `Alternativa ${option} mockada para a área de ${meta.label.toLowerCase()} com foco em ${theme.toLowerCase()}.`,
        assets: [],
      }))).map((option) => ({
        option: option.option,
        text: option.text,
        assets: option.assets,
        displayMode: "auto",
        suppressedReason: undefined,
      })),
      theme,
      subtheme,
      skill,
      difficulty,
      accuracy,
      correctOption,
      topDistractor,
      difficultyRank,
      imageUrl: extracted?.imageUrl ?? "/placeholder.png",
      comments: [
        extracted
          ? `${meta.label} já usa enunciado, alternativas e assets reais extraídos do PDF; analytics e metadados pedagógicos ainda estão mockados.`
          : `${meta.label} ainda está em modo mock, mas o item já segue a mesma leitura analítica da matemática.`,
        `O distrator ${topDistractor} foi definido como principal para a estrutura inicial de comentários e revisão.`,
        `${competence} aparece como eixo pedagógico provisório até a integração dos dados reais da área.`,
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
      proficiencyAccuracy: [
        { faixa: "Até 599", acerto: clamp(accuracy - 18, 6, 52) },
        { faixa: "600-699", acerto: clamp(accuracy - 8, 12, 60) },
        { faixa: "700-799", acerto: clamp(accuracy, 18, 72) },
        { faixa: "800-899", acerto: clamp(accuracy + 10, 24, 82) },
        { faixa: "900+", acerto: clamp(accuracy + 18, 30, 91) },
      ],
      analyticsSnapshot: {
        sampleSize: 18000 + id * 97,
        averageScore: Number((610 + id * 2.9).toFixed(1)),
        thetaAverage: Number((0.4 + id * 0.03).toFixed(2)),
        informationLabel: triA >= 2.3 ? "Alta" : triA >= 1.6 ? "Média" : "Baixa",
        rankDiscrimination: ((id * 9) % 45) + 1,
        rankInformation: ((id * 5) % 45) + 1,
        discriminationGapLt600To900: Number((22 + (id % 14) * 2.1).toFixed(1)),
        discriminationGap700To900: Number((12 + (id % 9) * 1.8).toFixed(1)),
        dominantDistractorShare: distribution[topDistractor],
        itemInformationProxy: Number((0.55 + id * 0.014).toFixed(3)),
        difficultyBand: buildMockDifficultyLabel(difficultyLevel).toLowerCase(),
        reviewPriorityLabel: difficultyLevel >= 4 ? "alta" : "média",
        qualityLabel: "boa",
        discriminationLabel: triA >= 2.2 ? "forte" : "moderada",
        bucketSnapshot: [
          { faixa: "Até 599", acerto: clamp(accuracy - 18, 6, 52), n: 3200 + id * 7 },
          { faixa: "600-699", acerto: clamp(accuracy - 8, 12, 60), n: 4100 + id * 7 },
          { faixa: "700-799", acerto: clamp(accuracy, 18, 72), n: 4700 + id * 7 },
          { faixa: "800-899", acerto: clamp(accuracy + 10, 24, 82), n: 3900 + id * 7 },
          { faixa: "900+", acerto: clamp(accuracy + 18, 30, 91), n: 2200 + id * 7 },
        ],
        distractorByBucket: [
          { faixa: "Até 599", distractor: topDistractor, pct: clamp(distribution[topDistractor] + 5, 12, 48), n: 1200 + id * 3 },
          { faixa: "600-699", distractor: topDistractor, pct: clamp(distribution[topDistractor] + 2, 10, 44), n: 1100 + id * 3 },
          { faixa: "700-799", distractor: options[(index + 4) % options.length], pct: clamp(distribution[topDistractor] - 5, 6, 30), n: 900 + id * 2 },
          { faixa: "800-899", distractor: options[index % options.length], pct: clamp(distribution[topDistractor] - 9, 4, 22), n: 650 + id * 2 },
          { faixa: "900+", distractor: options[(index + 1) % options.length], pct: clamp(distribution[topDistractor] - 12, 3, 16), n: 420 + id * 2 },
        ],
        empiricalCurve: [
          { faixa: "500-599", acerto: clamp(accuracy - 18, 6, 52), n: 2100, notaMedia: 560 },
          { faixa: "600-699", acerto: clamp(accuracy - 8, 12, 60), n: 3200, notaMedia: 650 },
          { faixa: "700-799", acerto: clamp(accuracy, 18, 72), n: 3600, notaMedia: 748 },
          { faixa: "800-899", acerto: clamp(accuracy + 10, 24, 82), n: 2700, notaMedia: 845 },
          { faixa: "900+", acerto: clamp(accuracy + 18, 30, 91), n: 1500, notaMedia: 925 },
        ],
        weakestBucket: { faixa: "Até 599", acerto: clamp(accuracy - 18, 6, 52), n: 3200 + id * 7 },
        strongestBucket: { faixa: "900+", acerto: clamp(accuracy + 18, 30, 91), n: 2200 + id * 7 },
      },
      resolution: {
        whatItAsks: `O item pede leitura e decisão em ${theme.toLowerCase()}, usando ${subtheme.toLowerCase()} como eixo principal.`,
        howToSolve: `A resolução completa ainda será substituída pelos dados reais da área. Por enquanto, o fluxo mantém a mesma estrutura da matemática: identificar a operação central, comparar evidências e validar a alternativa ${correctOption}.`,
        whyErrorsHappen: `O erro dominante mockado foi associado à alternativa ${topDistractor}, normalmente por leitura incompleta do comando ou aproximação conceitual insuficiente.`,
        distractorCommentary: [
          `O distrator ${topDistractor} foi configurado como o principal padrão de erro provisório desta questão.`,
          "A leitura por faixa será atualizada quando os dados reais da área forem integrados.",
          template.lead,
        ],
      },
      latexResolution: null,
      analyticsSummary: `${meta.label} em modo mock com estrutura preparada para assets, microdados e resolução futura.`,
      triMetrics: {
        a: triA,
        b: triB,
        c: 0.2,
        rankA: ((id * 13) % 45) + 1,
        rankB: ((id * 17) % 45) + 1,
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

  mockAreaCache.set(area, withRelations);
  return withRelations;
}

function optionIndexSeed(area: Exclude<AreaSlug, "matematica">) {
  return area === "linguagens" ? 1 : area === "ciencias-humanas" ? 2 : 3;
}

export function getAreaMeta(area: AreaSlug): AreaMeta {
  return AREA_META[area];
}

function withAreaContext(area: AreaSlug, question: BaseQuestionPageData): AreaQuestionPageData {
  const meta = AREA_META[area];
  return {
    ...question,
    areaSlug: area,
    areaLabel: meta.label,
    areaShortLabel: meta.shortLabel,
    dayLabel: meta.dayLabel,
    areaRoute: `/prova/2024/${area}`,
    questionRoute: `/questoes/${area}/${question.id}`,
    pdfFile: meta.pdfFile,
  };
}

export function getAreaQuestionPageData(
  area: AreaSlug,
  id: number,
): AreaQuestionPageData | null {
  if (area === "matematica") {
    const question = getMathQuestionPageData(id);
    return question ? withAreaContext(area, question) : null;
  }

  const question = buildMockAreaQuestions(area).find((entry) => entry.id === id);
  return question ? withAreaContext(area, question) : null;
}

export function getAreaQuestionSummaries(area: AreaSlug): AreaQuestionSummary[] {
  if (area === "matematica") {
    return getMathExamQuestionSummaries().map((question) => ({
      ...question,
      areaSlug: area,
      areaLabel: AREA_META[area].label,
    }));
  }

  return buildMockAreaQuestions(area).map((question) => ({
    id: question.id,
    displayNumber: question.examQuestionNumber,
    theme: question.theme,
    competenceNumber: 0,
    competenceDescription: question.metadata.cognitiveType,
    skill: question.skill,
    difficulty: question.difficulty,
    accuracy: question.accuracy,
    areaSlug: area,
    areaLabel: AREA_META[area].label,
  }));
}

export function getAreaOverviewAnalytics(area: AreaSlug): OverviewAnalytics {
  if (area === "matematica") {
    return getMathExamOverviewAnalytics();
  }

  const questions = getAreaQuestionSummaries(area);
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

export function getLandingPageData() {
  const areas = (Object.keys(AREA_META) as AreaSlug[]).map((area) => {
    const summaries = getAreaQuestionSummaries(area);
    const averageAccuracy = Number(
      (summaries.reduce((sum, question) => sum + question.accuracy, 0) / summaries.length).toFixed(1),
    );
    const themeFrequency = summaries.reduce<Record<string, number>>((acc, question) => {
      acc[question.theme] = (acc[question.theme] ?? 0) + 1;
      return acc;
    }, {});
    const strongestTheme =
      Object.entries(themeFrequency).sort((left, right) => right[1] - left[1])[0]?.[0] ??
      summaries[0]?.theme ??
      "-";

    return {
      slug: area,
      label: AREA_META[area].label,
      shortLabel: AREA_META[area].shortLabel,
      dayLabel: AREA_META[area].dayLabel,
      pdfFile: AREA_META[area].pdfFile,
      questionCount: summaries.length,
      averageAccuracy,
      strongestTheme,
      sampleQuestion: summaries[11]?.displayNumber ?? summaries[0]?.displayNumber ?? 0,
      lead: AREA_META[area].lead,
    } satisfies LandingAreaCard;
  });

  const totalQuestions = areas.reduce((sum, area) => sum + area.questionCount, 0);
  const averageAccuracy = Number(
    (
      areas.reduce((sum, area) => sum + area.averageAccuracy * area.questionCount, 0) /
      totalQuestions
    ).toFixed(1),
  );

  return {
    totalQuestions,
    averageAccuracy,
    areaCount: areas.length,
    areas,
  };
}
