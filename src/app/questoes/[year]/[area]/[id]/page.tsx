import type { Metadata } from "next";
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

function resolveQuestion(params: PageProps["params"]) {
  const year = Number(params.year);
  const area = params.area as AreaSlug;
  const id = Number(params.id);

  if (!isAvailableExamYear(year) || !validAreas.has(area) || !Number.isFinite(id)) {
    return null;
  }

  return getAreaQuestionPageData(year, area, id);
}

export function generateMetadata({ params }: PageProps): Metadata {
  const question = resolveQuestion(params);

  if (!question) {
    return {
      title: "Questão do ENEM",
      description: "Página de questão do ENEM com resolução comentada.",
    };
  }

  const seoTitle = `Questão ${question.examQuestionNumber} do ENEM ${question.year} de ${question.areaLabel}: resolução comentada`;
  const seoDescription = `${question.title}. Veja o enunciado, a resolução passo a passo, os principais erros e a leitura dos dados desta questão do ENEM ${question.year}.`;

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: question.questionRoute,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      type: "article",
      url: question.questionRoute,
      locale: "pt_BR",
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
    },
    keywords: [
      `questão ${question.examQuestionNumber} enem ${question.year}`,
      `${question.areaLabel.toLowerCase()} enem ${question.year}`,
      `${question.theme.toLowerCase()}`,
      `resolução enem ${question.year}`,
    ],
  };
}

export default function YearAreaQuestionPage({ params }: PageProps) {
  const question = resolveQuestion(params);

  if (!question) {
    notFound();
  }

  return <QuestionPageView question={question} />;
}
