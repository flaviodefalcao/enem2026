import { notFound } from "next/navigation";
import { AreaOverviewPage } from "@/components/exam-overview/area-overview-page";
import {
  getAreaMeta,
  getAreaOverviewAnalytics,
  getAreaQuestionSummaries,
  isAvailableExamYear,
  type AreaSlug,
} from "@/data/exam-catalog";

type PageProps = {
  params: {
    year: string;
    area: string;
  };
};

const validAreas = new Set<AreaSlug>([
  "linguagens",
  "ciencias-humanas",
  "ciencias-natureza",
  "matematica",
]);

export default function YearAreaOverviewRoute({ params }: PageProps) {
  const year = Number(params.year);
  const area = params.area as AreaSlug;

  if (!isAvailableExamYear(year) || !validAreas.has(area)) {
    notFound();
  }

  return (
    <AreaOverviewPage
      area={getAreaMeta(year, area)}
      questions={getAreaQuestionSummaries(year, area)}
      overviewAnalytics={getAreaOverviewAnalytics(year, area)}
    />
  );
}

