import { QuestionFilterPage } from "@/components/exam-overview/question-filter-page";
import {
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
      getAreaQuestionSummaries(year, area).map((question) => ({
        year,
        areaSlug: area,
        areaLabel: question.areaLabel,
        questionId: question.id,
        displayNumber: question.displayNumber,
        theme: question.theme,
        skill: question.skill,
        difficultyLevel: question.difficultyLevel,
        relativeDifficultyLabel: question.relativeDifficultyLabel,
        accuracy: question.accuracy,
        route: `/questoes/${year}/${area}/${question.id}`,
      })),
    ),
  );

  return <QuestionFilterPage questions={questions} />;
}
