import { QuestionFilterPage } from "@/components/exam-overview/question-filter-page";
import {
  getAreaQuestionPageData,
  getAreaQuestionSummaries,
  getExamYears,
  type AreaSlug,
  type ExamYear,
} from "@/data/exam-catalog";

const AREA_SLUGS: AreaSlug[] = [
  "linguagens",
  "ciencias-humanas",
  "ciencias-natureza",
  "matematica",
];

export default function FilterQuestionsRoute() {
  const years = getExamYears().map((entry) => entry.year as ExamYear);
  const questions = years.flatMap((year) =>
    AREA_SLUGS.flatMap((area) =>
      getAreaQuestionSummaries(year, area).map((question) => {
        const detail = getAreaQuestionPageData(year, area, question.id);
        return {
          year,
          areaSlug: area,
          areaLabel: question.areaLabel,
          questionId: question.id,
          displayNumber: question.displayNumber,
          theme: question.theme,
          skill: question.skill,
          skillKey: `${area}:${question.skill}`,
          skillSummary:
            detail?.skillDescription?.trim() ||
            question.competenceDescription,
          competenceSummary: question.competenceDescription,
          difficultyLevel: question.difficultyLevel,
          relativeDifficultyLabel: question.relativeDifficultyLabel,
          accuracy: question.accuracy,
          route: `/questoes/${year}/${area}/${question.id}`,
        };
      }),
    ),
  );

  return <QuestionFilterPage questions={questions} />;
}
