import fs from "node:fs";
import path from "node:path";

type RawAreaCode = "LC" | "CH" | "CN" | "MT";

export type StrategicRealQuestionMetric = {
  year: number;
  area: RawAreaCode;
  question_id: string;
  question_number: number;
  questao_num: number;
  questao_canonica: string;
  question_col: string;
  content_group: string;
  topic: string | null;
  subtopic: string | null;
  CO_ITEM: number | null;
  CO_HABILIDADE: number | null;
  NU_PARAM_A: number | null;
  NU_PARAM_B: number | null;
  NU_PARAM_C: number | null;
  gabarito_ref: string | null;
  n_students: number;
  acc_rate: number;
  delta_tri_bucket_avg: number;
  delta_tri_global: number;
  delta_tri_top_students: number;
  top_err_rate: number;
  easy_flag: boolean;
  easy_penalty_index: number;
  capture_gain_index: number;
  score_aumenta_nota: number;
  score_prejudica: number;
  score_captura_ganho: number;
  score_importancia_questao: number;
  rank_aumenta_nota: number;
  rank_prejudica: number;
  rank_importancia_questao: number;
};

export type StrategicRealContentMetric = {
  area: RawAreaCode;
  content_group: string;
  n_questions: number;
  freq_hist: number;
  acc_rate_mean: number;
  delta_tri_mean: number;
  delta_tri_median: number;
  penalty_easy_mean: number;
  penalty_easy_median: number;
  capture_gain_mean: number;
  score_importancia_questao_mean: number;
  freq_norm: number;
  delta_norm: number;
  penalty_norm: number;
  capture_norm: number;
  roi_estudo: number;
  rank_estudar_primeiro: number;
  rank_delta_conteudo: number;
  rank_penalty_conteudo: number;
};

export type StrategicRealSummary = {
  scope: string;
  year: number | null;
  area: RawAreaCode | null;
  top_gain_question_id: string;
  top_pain_question_id: string;
  top_study_content: string;
  avg_delta_top10: number;
  avg_penalty_top10: number;
  avg_roi_top5: number;
};

export type StrategicRealPayload = {
  metadata: {
    sourceDir: string;
    questionCount: number;
    contentCount: number;
    summaryCount: number;
    years: number[];
  };
  questions: StrategicRealQuestionMetric[];
  contents: StrategicRealContentMetric[];
  summaries: StrategicRealSummary[];
};

const strategicRealPath = path.join(
  process.cwd(),
  "src",
  "data",
  "generated",
  "strategic-metrics-real.json",
);

let strategicRealCache: StrategicRealPayload | null = null;

export function getStrategicMetricsReal(): StrategicRealPayload {
  if (strategicRealCache) {
    return strategicRealCache;
  }

  const raw = fs.readFileSync(strategicRealPath, "utf8");
  strategicRealCache = JSON.parse(raw) as StrategicRealPayload;
  return strategicRealCache;
}

export function rawAreaCodeToSlug(area: RawAreaCode) {
  if (area === "LC") return "linguagens";
  if (area === "CH") return "ciencias-humanas";
  if (area === "CN") return "ciencias-natureza";
  return "matematica";
}

export function rawAreaCodeToLabel(area: RawAreaCode) {
  if (area === "LC") return "Linguagens";
  if (area === "CH") return "Ciências Humanas";
  if (area === "CN") return "Ciências da Natureza";
  return "Matemática";
}
