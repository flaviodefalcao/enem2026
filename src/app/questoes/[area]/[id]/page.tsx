import { notFound } from "next/navigation";
import { QuestionPageView } from "@/components/question/question-page-view";
import { getAreaQuestionPageData, type AreaSlug } from "@/data/exam-catalog";

type PageProps = {
  params: {
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

export default function AreaQuestionPage({ params }: PageProps) {
  const area = params.area as AreaSlug;
  const id = Number(params.id);

  if (!validAreas.has(area) || !Number.isFinite(id)) {
    notFound();
  }

  const question = getAreaQuestionPageData(area, id);

  if (!question) {
    notFound();
  }

  return <QuestionPageView question={question} />;
}
