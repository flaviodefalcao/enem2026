import { notFound } from "next/navigation";
import { QuestionPageView } from "@/components/question/question-page-view";
import { getQuestionPageData } from "@/data/mock-question";

type PageProps = {
  params: {
    id: string;
  };
};

export default function QuestionPage({ params }: PageProps) {
  const id = Number(params.id);

  if (!Number.isFinite(id)) {
    notFound();
  }

  const question = getQuestionPageData(id);

  if (!question) {
    notFound();
  }

  return <QuestionPageView question={question} />;
}
