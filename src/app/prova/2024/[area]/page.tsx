import { notFound } from "next/navigation";
import { AreaOverviewPage } from "@/components/exam-overview/area-overview-page";
import {
  getAreaMeta,
  getAreaOverviewAnalytics,
  getAreaQuestionSummaries,
  type AreaSlug,
} from "@/data/exam-catalog";

type PageProps = {
  params: {
    area: string;
  };
};

const validAreas = new Set<AreaSlug>([
  "linguagens",
  "ciencias-humanas",
  "ciencias-natureza",
  "matematica",
]);

export default function AreaOverviewRoute({ params }: PageProps) {
  const area = params.area as AreaSlug;

  if (!validAreas.has(area)) {
    notFound();
  }

  return (
    <AreaOverviewPage
      area={getAreaMeta(area)}
      questions={getAreaQuestionSummaries(area)}
      overviewAnalytics={getAreaOverviewAnalytics(area)}
    />
  );
}
