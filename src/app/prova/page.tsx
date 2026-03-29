import { YearSelectorPage } from "@/components/exam-overview/year-selector-page";
import { getExamYears } from "@/data/exam-catalog";

export default function ProofYearSelectorRoute() {
  return <YearSelectorPage years={getExamYears()} />;
}

