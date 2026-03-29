import { notFound } from "next/navigation";
import { ExamLandingPage } from "@/components/exam-overview/exam-landing-page";
import {
  getLandingPageData,
  isAvailableExamYear,
} from "@/data/exam-catalog";

type PageProps = {
  params: {
    year: string;
  };
};

export default function ExamYearLandingRoute({ params }: PageProps) {
  const year = Number(params.year);

  if (!isAvailableExamYear(year)) {
    notFound();
  }

  const landing = getLandingPageData(year);

  if (!landing) {
    notFound();
  }

  return <ExamLandingPage year={year} landing={landing} />;
}

