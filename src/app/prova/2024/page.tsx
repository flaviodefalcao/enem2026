import { ExamLandingPage } from "@/components/exam-overview/exam-landing-page";
import { getLandingPageData } from "@/data/exam-catalog";

export default function ExamLanding2024Page() {
  const landing = getLandingPageData(2024);

  if (!landing) {
    return null;
  }

  return <ExamLandingPage year={2024} landing={landing} />;
}
