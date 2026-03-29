import {
  getAreaQuestionPageData,
  type AreaQuestionPageData,
  type AreaSlug,
  type ExamYear,
} from "@/data/exam-catalog";

type StrategicQuestionMetric = {
  year: ExamYear;
  area: AreaSlug;
  areaLabel: string;
  questionId: number;
  questionNumber: number;
  questionRoute: string;
  contentGroup: string;
  topic: string;
  subtopic: string;
  skill: string;
  difficultyLevel: number;
  relativeDifficultyLabel: string;
  nStudents: number;
  accRate: number;
  deltaTriBucketAvg: number;
  deltaTriGlobal: number;
  deltaTriTopStudents: number;
  topErrRate: number;
  easyFlag: boolean;
  easyPenaltyIndex: number;
  scoreAumentaNota: number;
  scorePrejudica: number;
  scoreImportanciaQuestao: number;
  rankAumentaNota: number;
  rankPrejudica: number;
  rankImportanciaQuestao: number;
};

type StrategicContentMetric = {
  year: ExamYear;
  area: AreaSlug;
  areaLabel: string;
  contentGroup: string;
  topic: string;
  nQuestions: number;
  freqHist: number;
  deltaTriMean: number;
  deltaTriMedian: number;
  penaltyEasyMean: number;
  penaltyEasyMedian: number;
  roiEstudo: number;
  rankEstudarPrimeiro: number;
  rankDeltaConteudo: number;
  rankPenaltyConteudo: number;
};

type StrategicGeneralSummary = {
  scope: "global" | "year_area";
  year: ExamYear;
  area?: AreaSlug;
  topGainQuestionId: number;
  topPainQuestionId: number;
  topStudyContent: string;
  avgDeltaTop10: number;
  avgPenaltyTop10: number;
  avgRoiTop5: number;
};

export type StrategicMetricsPayload = {
  year: ExamYear;
  methodologyNote: string;
  questions: StrategicQuestionMetric[];
  contents: StrategicContentMetric[];
  summaries: StrategicGeneralSummary[];
};

const AREA_SLUGS: AreaSlug[] = [
  "linguagens",
  "ciencias-humanas",
  "ciencias-natureza",
  "matematica",
];

type OptionLetter = "A" | "B" | "C" | "D" | "E";

const strategicMetricsCache = new Map<ExamYear, StrategicMetricsPayload>();

function normalize(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (max === min) {
    return values.map(() => 0.5);
  }

  return values.map((value) => (value - min) / (max - min));
}

function percentileMedian(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle] ?? 0;
}

function rankDescending<T>(
  items: T[],
  value: (item: T) => number,
  setter: (item: T, rank: number) => T,
) {
  return [...items]
    .sort((a, b) => value(b) - value(a))
    .map((item, index) => setter(item, index + 1));
}

function getContentGroup(question: AreaQuestionPageData) {
  return (
    question.officialResolution?.shortThemeTitle ??
    question.subtheme ??
    question.theme
  );
}

function load2024Questions(): AreaQuestionPageData[] {
  const questions: AreaQuestionPageData[] = [];

  for (const area of AREA_SLUGS) {
    for (let id = 1; id <= 45; id += 1) {
      const question = getAreaQuestionPageData(2024, area, id);
      if (question) {
        questions.push(question);
      }
    }
  }

  return questions;
}

function getCorrectTopShare(question: AreaQuestionPageData) {
  const correctOption = question.correctOption;
  if (!["A", "B", "C", "D", "E"].includes(correctOption)) {
    return 0;
  }

  if (Array.isArray(question.topPerformerDistribution)) {
    const match = question.topPerformerDistribution.find(
      (entry) => entry.option === (correctOption as OptionLetter),
    );
    return match?.value ?? 0;
  }

  const distribution = (question.topPerformerDistribution ?? {}) as unknown as Record<
    OptionLetter,
    number
  >;
  return distribution[correctOption as OptionLetter] ?? 0;
}

export function getStrategicMetrics(year: ExamYear = 2024): StrategicMetricsPayload {
  if (strategicMetricsCache.has(year)) {
    return strategicMetricsCache.get(year)!;
  }

  if (year !== 2024) {
    const empty: StrategicMetricsPayload = {
      year,
      methodologyNote:
        "As métricas estratégicas ainda estão disponíveis apenas para 2024.",
      questions: [],
      contents: [],
      summaries: [],
    };
    strategicMetricsCache.set(year, empty);
    return empty;
  }

  const questions = load2024Questions();
  const broadGapValues = questions.map((question) =>
    Math.max(0, question.analyticsSnapshot.discriminationGapLt600To900),
  );
  const focusedGapValues = questions.map((question) =>
    Math.max(0, question.analyticsSnapshot.discriminationGap700To900),
  );
  const discriminationValues = questions.map((question) =>
    Math.max(0, question.triMetrics.a),
  );
  const informationStrengthValues = questions.map((question) =>
    Math.max(0, 46 - question.analyticsSnapshot.rankInformation),
  );
  const easyValues = questions.map((question) => question.accuracy);
  const topErrValues = questions.map((question) => {
    const topCorrect = getCorrectTopShare(question);
    return Math.max(0, 100 - topCorrect);
  });

  const broadGapNorm = normalize(broadGapValues);
  const focusedGapNorm = normalize(focusedGapValues);
  const discriminationNorm = normalize(discriminationValues);
  const informationNorm = normalize(informationStrengthValues);
  const easyNorm = normalize(easyValues);
  const topErrNorm = normalize(topErrValues);

  let enrichedQuestions = questions.map((question, index) => {
    const broadGap = Math.max(0, question.analyticsSnapshot.discriminationGapLt600To900);
    const focusedGap = Math.max(0, question.analyticsSnapshot.discriminationGap700To900);
    const topCorrect = getCorrectTopShare(question);
    const topErrRate = Math.max(0, 100 - topCorrect);
    const easyFlag = question.accuracy >= 55 || question.triMetrics.difficultyLevel <= 2;

    const scoreAumentaNota =
      broadGapNorm[index] * 0.45 +
      focusedGapNorm[index] * 0.2 +
      discriminationNorm[index] * 0.2 +
      informationNorm[index] * 0.15;

    const easyPenaltyIndex =
      broadGapNorm[index] * 0.4 + easyNorm[index] * 0.35 + topErrNorm[index] * 0.25;

    const scoreImportanciaQuestao = scoreAumentaNota * 0.55 + easyPenaltyIndex * 0.45;

    return {
      year,
      area: question.areaSlug,
      areaLabel: question.areaLabel,
      questionId: question.id,
      questionNumber: question.examQuestionNumber,
      questionRoute: question.questionRoute,
      contentGroup: getContentGroup(question),
      topic: question.theme,
      subtopic: question.subtheme,
      skill: question.skill,
      difficultyLevel: question.triMetrics.difficultyLevel,
      relativeDifficultyLabel: question.triMetrics.relativeDifficultyLabel,
      nStudents: question.analyticsSnapshot.sampleSize,
      accRate: question.accuracy,
      deltaTriBucketAvg: Number(broadGap.toFixed(2)),
      deltaTriGlobal: Number(focusedGap.toFixed(2)),
      deltaTriTopStudents: Number(topCorrect.toFixed(2)),
      topErrRate: Number(topErrRate.toFixed(2)),
      easyFlag,
      easyPenaltyIndex: Number((easyPenaltyIndex * 100).toFixed(2)),
      scoreAumentaNota: Number((scoreAumentaNota * 100).toFixed(2)),
      scorePrejudica: Number((easyPenaltyIndex * 100).toFixed(2)),
      scoreImportanciaQuestao: Number((scoreImportanciaQuestao * 100).toFixed(2)),
      rankAumentaNota: 0,
      rankPrejudica: 0,
      rankImportanciaQuestao: 0,
    } satisfies StrategicQuestionMetric;
  });

  enrichedQuestions = rankDescending(
    enrichedQuestions,
    (question) => question.scoreAumentaNota,
    (question, rank) => ({ ...question, rankAumentaNota: rank }),
  );
  enrichedQuestions = rankDescending(
    enrichedQuestions,
    (question) => question.scorePrejudica,
    (question, rank) => ({ ...question, rankPrejudica: rank }),
  );
  enrichedQuestions = rankDescending(
    enrichedQuestions,
    (question) => question.scoreImportanciaQuestao,
    (question, rank) => ({ ...question, rankImportanciaQuestao: rank }),
  );

  const contentMap = new Map<
    string,
    {
      year: ExamYear;
      area: AreaSlug;
      areaLabel: string;
      contentGroup: string;
      topic: string;
      values: StrategicQuestionMetric[];
    }
  >();

  for (const question of enrichedQuestions) {
    const key = `${question.area}::${question.contentGroup}`;
    const entry = contentMap.get(key) ?? {
      year,
      area: question.area,
      areaLabel: question.areaLabel,
      contentGroup: question.contentGroup,
      topic: question.topic,
      values: [],
    };
    entry.values.push(question);
    contentMap.set(key, entry);
  }

  const areaCounts = Object.fromEntries(
    AREA_SLUGS.map((area) => [
      area,
      enrichedQuestions.filter((question) => question.area === area).length,
    ]),
  ) as Record<AreaSlug, number>;

  let contents = Array.from(contentMap.values()).map((entry) => {
    const deltaValues = entry.values.map((value) => value.scoreAumentaNota);
    const penaltyValues = entry.values.map((value) => value.scorePrejudica);
    const captureEase =
      entry.values.reduce((sum, value) => {
        const ease = 1 - Math.min(Math.abs(value.difficultyLevel - 3) / 2, 1);
        return sum + ease;
      }, 0) / entry.values.length;

    const freqHist = (entry.values.length / (areaCounts[entry.area] || 1)) * 100;
    const deltaMean =
      deltaValues.reduce((sum, value) => sum + value, 0) / deltaValues.length;
    const penaltyMean =
      penaltyValues.reduce((sum, value) => sum + value, 0) / penaltyValues.length;

    return {
      year,
      area: entry.area,
      areaLabel: entry.areaLabel,
      contentGroup: entry.contentGroup,
      topic: entry.topic,
      nQuestions: entry.values.length,
      freqHist: Number(freqHist.toFixed(2)),
      deltaTriMean: Number(deltaMean.toFixed(2)),
      deltaTriMedian: Number(percentileMedian(deltaValues).toFixed(2)),
      penaltyEasyMean: Number(penaltyMean.toFixed(2)),
      penaltyEasyMedian: Number(percentileMedian(penaltyValues).toFixed(2)),
      roiEstudo: Number(
        (
          deltaMean * 0.35 +
          penaltyMean * 0.3 +
          freqHist * 0.2 +
          captureEase * 15
        ).toFixed(2),
      ),
      rankEstudarPrimeiro: 0,
      rankDeltaConteudo: 0,
      rankPenaltyConteudo: 0,
    } satisfies StrategicContentMetric;
  });

  contents = rankDescending(
    contents,
    (content) => content.roiEstudo,
    (content, rank) => ({ ...content, rankEstudarPrimeiro: rank }),
  );
  contents = rankDescending(
    contents,
    (content) => content.deltaTriMean,
    (content, rank) => ({ ...content, rankDeltaConteudo: rank }),
  );
  contents = rankDescending(
    contents,
    (content) => content.penaltyEasyMean,
    (content, rank) => ({ ...content, rankPenaltyConteudo: rank }),
  );

  const buildSummary = (scope: "global" | "year_area", area?: AreaSlug): StrategicGeneralSummary => {
    const scopedQuestions = area
      ? enrichedQuestions.filter((question) => question.area === area)
      : enrichedQuestions;
    const scopedContents = area
      ? contents.filter((content) => content.area === area)
      : contents;

    const topGain = [...scopedQuestions].sort(
      (a, b) => b.scoreAumentaNota - a.scoreAumentaNota,
    )[0];
    const topPain = [...scopedQuestions].sort(
      (a, b) => b.scorePrejudica - a.scorePrejudica,
    )[0];
    const topContent = [...scopedContents].sort(
      (a, b) => b.roiEstudo - a.roiEstudo,
    )[0];

    return {
      scope,
      year,
      area,
      topGainQuestionId: topGain?.questionId ?? 0,
      topPainQuestionId: topPain?.questionId ?? 0,
      topStudyContent: topContent?.contentGroup ?? "",
      avgDeltaTop10: Number(
        (
          scopedQuestions
            .slice()
            .sort((a, b) => b.scoreAumentaNota - a.scoreAumentaNota)
            .slice(0, 10)
            .reduce((sum, item) => sum + item.scoreAumentaNota, 0) / Math.max(1, Math.min(10, scopedQuestions.length))
        ).toFixed(2),
      ),
      avgPenaltyTop10: Number(
        (
          scopedQuestions
            .slice()
            .sort((a, b) => b.scorePrejudica - a.scorePrejudica)
            .slice(0, 10)
            .reduce((sum, item) => sum + item.scorePrejudica, 0) / Math.max(1, Math.min(10, scopedQuestions.length))
        ).toFixed(2),
      ),
      avgRoiTop5: Number(
        (
          scopedContents
            .slice()
            .sort((a, b) => b.roiEstudo - a.roiEstudo)
            .slice(0, 5)
            .reduce((sum, item) => sum + item.roiEstudo, 0) / Math.max(1, Math.min(5, scopedContents.length))
        ).toFixed(2),
      ),
    };
  };

  const payload: StrategicMetricsPayload = {
    year,
    methodologyNote:
      "MVP analítico de 2024: os rankings abaixo usam proxies construídas a partir dos agregados já disponíveis da base, com foco em discriminação empírica, taxa de acerto, erro entre alunos fortes e recorrência do conteúdo. Não é um cálculo TRI causal completo por aluno, mas já funciona como leitura estratégica forte.",
    questions: enrichedQuestions,
    contents,
    summaries: [
      buildSummary("global"),
      ...AREA_SLUGS.map((area) => buildSummary("year_area", area)),
    ],
  };

  strategicMetricsCache.set(year, payload);
  return payload;
}
