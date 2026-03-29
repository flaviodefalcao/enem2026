import { StrategicMetricsRealPage } from "@/components/strategic/strategic-metrics-real-page";
import { getStrategicMetricsReal } from "@/data/strategic-metrics-real";

export default function StrategicMetricsRealRoute() {
  return <StrategicMetricsRealPage data={getStrategicMetricsReal()} />;
}
