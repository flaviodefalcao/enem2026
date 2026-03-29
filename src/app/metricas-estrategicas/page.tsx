import { StrategicMetricsPage } from "@/components/strategic/strategic-metrics-page";
import { getStrategicMetrics } from "@/data/strategic-metrics";

export default function StrategicMetricsRoute() {
  return <StrategicMetricsPage data={getStrategicMetrics(2024)} />;
}
