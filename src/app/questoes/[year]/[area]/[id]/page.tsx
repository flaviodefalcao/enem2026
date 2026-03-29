import { notFound } from "next/navigation";
import { QuestionPageView } from "@/components/question/question-page-view";
import {
  getAreaQuestionPageData,
  isAvailableExamYear,
  type AreaSlug,
} from "@/data/exam-catalog";

type PageProps = {
  params: {
    year: string;
    area: string;
    id: string;
  };
};

const validAreas = new Set<AreaSlug>([
  "linguagens",
  "ciencias-humanas",
  "ciencias-natureza",
  "matematica",
]);

export default function YearAreaQuestionPage({ params }: PageProps) {
  const year = Number(params.year);
  const area = params.area as AreaSlug;
  const id = Number(params.id);

  if (!isAvailableExamYear(year) || !validAreas.has(area) || !Number.isFinite(id)) {
    notFound();
  }

  const question = getAreaQuestionPageData(year, area, id);

  if (!question) {
    notFound();
  }

  return <QuestionPageView question={question} />;
}

