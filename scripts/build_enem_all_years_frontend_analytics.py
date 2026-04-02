#!/usr/bin/env python3

from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Any

import fitz
import pandas as pd


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_ROOT = ROOT / "src" / "data" / "generated"
DEFAULT_YEARS = [2017, 2018, 2019, 2020, 2021, 2022, 2023]
DEFAULT_MATRIX_CANDIDATES = [
    ROOT.parent / "matriz_referencia (2).pdf",
    ROOT.parent / "matriz_referencia (1).pdf",
    ROOT.parent / "matriz_referencia.pdf",
]

AREA_CONFIG = {
    "LC": {
        "slug": "linguagens",
        "label": "Linguagens",
        "question_limit": 45,
        "proof_color": "AZUL",
    },
    "CH": {
        "slug": "ciencias-humanas",
        "label": "Ciências Humanas",
        "question_limit": 45,
        "proof_color": "AZUL",
    },
    "CN": {
        "slug": "ciencias-natureza",
        "label": "Ciências da Natureza",
        "question_limit": 45,
        "proof_color": "AMARELA",
    },
    "MT": {
        "slug": "matematica",
        "label": "Matemática",
        "question_limit": 45,
        "proof_color": "AMARELA",
    },
}

PROFICIENCY_BUCKETS = [
    ("<600", "Até 599"),
    ("600-699", "600-699"),
    ("700-799", "700-799"),
    ("800-899", "800-899"),
    ("900+", "900+"),
]

DISTRACTOR_GROUP_LABELS = {
    "geral": "Geral",
    "media5_lt650": "Até 649",
    "media5_800plus": "800+",
    "area_high_perf_custom": "Grupo forte da área",
    "nota_area_lt600": "Nota da área <600",
    "nota_area_900plus": "Nota da área 900+",
}

AREA_HIGH_PERF_GROUP_META = {
    "LC": {
        "group": "area_high_perf_custom",
        "label": "700+ em Linguagens",
        "description": "alunos com nota de Linguagens igual ou acima de 700",
    },
    "CH": {
        "group": "area_high_perf_custom",
        "label": "780+ em Humanas",
        "description": "alunos com nota de Ciências Humanas igual ou acima de 780",
    },
    "CN": {
        "group": "area_high_perf_custom",
        "label": "800+ em Natureza",
        "description": "alunos com nota de Ciências da Natureza igual ou acima de 800",
    },
    "MT": {
        "group": "area_high_perf_custom",
        "label": "900+ em Matemática",
        "description": "alunos com nota de Matemática igual ou acima de 900",
    },
}

VALID_OPTIONS = ["A", "B", "C", "D", "E"]

MATRIX_PAGE_RANGES = {
    "LC": [1, 2, 3],
    "CN": [7, 8, 9],
    "CH": [10, 11, 12],
    "MT": [4, 5, 6],
}


def normalize_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def get_matrix_pdf_path() -> Path | None:
    for candidate in DEFAULT_MATRIX_CANDIDATES:
        if candidate.exists():
            return candidate
    return None


def parse_matrix_sections(matrix_pdf_path: Path) -> dict[str, dict[int, dict[str, Any]]]:
    pdf = fitz.open(matrix_pdf_path)
    section_pattern = re.compile(
        r"Competência de área\s+(\d+)\s*[-–]\s*(.+?)(?=\n\s*Competência de área\s+\d+\s*[-–]|\Z)",
        re.S,
    )
    skill_pattern = re.compile(r"H(\d+)\s*[-–]\s*(.+?)(?=\nH\d+\s*[-–]|\Z)", re.S)

    by_area: dict[str, dict[int, dict[str, Any]]] = {}
    for area_code, pages in MATRIX_PAGE_RANGES.items():
        pages_text = "\n".join(pdf[i].get_text("text") for i in pages)
        competencies: dict[int, dict[str, Any]] = {}
        for section_match in section_pattern.finditer(pages_text):
            competence_number = int(section_match.group(1))
            section_text = section_match.group(2)
            lines = section_text.splitlines()
            competence_description_lines = []
            skill_start_index = 0

            for index, line in enumerate(lines):
                if re.match(r"\s*H\d+\s*[-–]", line):
                    skill_start_index = index
                    break
                competence_description_lines.append(line)

            skills_text = "\n".join(lines[skill_start_index:])
            skills: dict[int, dict[str, Any]] = {}
            for skill_match in skill_pattern.finditer(skills_text):
                skill_number = int(skill_match.group(1))
                skills[skill_number] = {
                    "skillNumber": skill_number,
                    "skillCode": f"H{skill_number}",
                    "skillDescription": normalize_spaces(skill_match.group(2)),
                }

            competencies[competence_number] = {
                "competenceNumber": competence_number,
                "competenceDescription": normalize_spaces("\n".join(competence_description_lines)),
                "skills": skills,
            }

        by_area[area_code] = competencies

    return by_area


def resolve_competence_metadata(
    matrix_by_area: dict[str, dict[int, dict[str, Any]]],
    area_code: str,
    co_habilidade: int,
) -> dict[str, Any]:
    competencies = matrix_by_area.get(area_code, {})
    for competence_number, competence_payload in competencies.items():
        skill_payload = competence_payload["skills"].get(co_habilidade)
        if skill_payload:
            return {
                "competenceNumber": competence_number,
                "competenceDescription": competence_payload["competenceDescription"],
                "skillCode": skill_payload["skillCode"],
                "skillDescription": skill_payload["skillDescription"],
            }

    return {
        "competenceNumber": 0,
        "competenceDescription": "",
        "skillCode": f"H{co_habilidade}" if co_habilidade else "",
        "skillDescription": "",
    }


def to_percent(value: Any, digits: int = 1) -> float:
    if value is None:
        return 0.0
    numeric = float(value)
    if math.isnan(numeric):
        return 0.0
    return round(numeric * 100, digits)


def to_float(value: Any, digits: int = 2) -> float:
    if value is None:
        return 0.0
    numeric = float(value)
    if math.isnan(numeric):
        return 0.0
    return round(numeric, digits)


def normalize_option_distribution(
    distractors_df: pd.DataFrame,
    question_num: int,
    group: str = "geral",
) -> dict[str, float]:
    filtered = distractors_df[
        (distractors_df["questao_num"] == question_num)
        & (distractors_df["grupo"] == group)
        & (distractors_df["resposta_cat"].isin(VALID_OPTIONS))
    ].copy()

    grouped = filtered.groupby("resposta_cat", dropna=False)["pct"].sum().to_dict()
    return {
        option: round(float(grouped.get(option, 0.0)) * 100, 1)
        for option in VALID_OPTIONS
    }


def build_bucket_snapshot(row: pd.Series, area_code: str) -> list[dict[str, Any]]:
    if area_code == "LC":
        payload: list[dict[str, Any]] = []
        lc_buckets = [
            ("<600", "Até 599", "taxa_<600", "n_<600"),
            ("600-699", "600-699", "taxa_600-699", "n_600-699"),
            ("700-799", "700-799", "taxa_700-799", "n_700-799"),
            ("800+", "800+", "taxa_acerto_media5_800plus", "n_media5_800plus"),
        ]
        for _, label, rate_key, count_key in lc_buckets:
            if rate_key not in row:
                continue
            payload.append(
                {
                    "faixa": label,
                    "acerto": to_percent(row.get(rate_key)),
                    "n": int(float(row.get(count_key, 0) or 0)),
                }
            )
        return payload

    payload: list[dict[str, Any]] = []
    for key, label in PROFICIENCY_BUCKETS:
        rate_key = f"taxa_{key}"
        count_key = f"n_{key}"
        if rate_key not in row:
            continue
        payload.append(
            {
                "faixa": label,
                "acerto": to_percent(row.get(rate_key)),
                "n": int(float(row.get(count_key, 0) or 0)),
            }
        )
    return payload


def build_proficiency_accuracy(row: pd.Series, area_code: str) -> list[dict[str, Any]]:
    return [
        {"faixa": entry["faixa"], "acerto": entry["acerto"]}
        for entry in build_bucket_snapshot(row, area_code)
    ]


def build_distractor_by_bucket(row: pd.Series, area_code: str) -> list[dict[str, Any]]:
    payload: list[dict[str, Any]] = []
    groups = (
        [
            ("nota_area_lt600", "Até 599"),
            ("geral", "Geral"),
            ("media5_800plus", "800+"),
        ]
        if area_code == "LC"
        else [
            ("nota_area_lt600", "Até 599"),
            ("media5_lt650", "Até 649"),
            ("geral", "Geral"),
            ("media5_800plus", "800+"),
            ("nota_area_900plus", "900+"),
        ]
    )
    for group_key, label in groups:
        distractor_key = f"distrator_dominante_{group_key}"
        pct_key = f"pct_distrator_dominante_{group_key}"
        if distractor_key not in row:
            continue
        payload.append(
            {
                "faixa": label,
                "distractor": str(row.get(distractor_key) or "-"),
                "pct": to_percent(row.get(pct_key)),
                "n": 0,
            }
        )
    return payload


def build_empirical_curve(curve_df: pd.DataFrame, question_num: int) -> list[dict[str, Any]]:
    filtered = curve_df[
        (curve_df["questao_num"] == question_num) & (curve_df["tipo_curva"] == "media_5")
    ].copy()
    filtered = filtered.sort_values(["bin_left", "bin_right"])

    return [
        {
            "faixa": str(row["bin_label"]),
            "acerto": to_percent(row["taxa_acerto"]),
            "n": int(row["n"]),
            "notaMedia": to_float(row["valor_medio"], 1),
        }
        for row in filtered.to_dict(orient="records")
    ]


def build_group_distributions(
    distractors_df: pd.DataFrame, question_num: int
) -> list[dict[str, Any]]:
    payload: list[dict[str, Any]] = []
    for group in sorted(distractors_df["grupo"].dropna().unique().tolist()):
        filtered = distractors_df[
            (distractors_df["questao_num"] == question_num) & (distractors_df["grupo"] == group)
        ].copy()
        payload.append(
            {
                "group": group,
                "label": DISTRACTOR_GROUP_LABELS.get(group, group),
                "distribution": normalize_option_distribution(distractors_df, question_num, group),
                "sampleSize": int(filtered["n"].sum()) if not filtered.empty else 0,
            }
        )
    return payload


def resolve_high_perf_group(area_code: str, group_distributions: list[dict[str, Any]]) -> dict[str, Any]:
    preferred = AREA_HIGH_PERF_GROUP_META[area_code]

    for candidate_group in (preferred["group"], "media5_800plus", "geral"):
        match = next(
            (
                entry
                for entry in group_distributions
                if entry["group"] == candidate_group
                and sum(entry["distribution"].values()) > 0
            ),
            None,
        )
        if match:
            label = (
                preferred["label"]
                if candidate_group == preferred["group"]
                else match["label"]
            )
            description = (
                preferred["description"]
                if candidate_group == preferred["group"]
                else "grupo de referência disponível na base"
            )
            return {
                "group": candidate_group,
                "label": label,
                "description": description,
                "distribution": match["distribution"],
                "sampleSize": int(match.get("sampleSize", 0) or 0),
            }

    return {
        "group": "geral",
        "label": "Geral",
        "description": "grupo de referência disponível na base",
        "distribution": {option: 0.0 for option in VALID_OPTIONS},
        "sampleSize": 0,
    }


def build_comments(row: pd.Series) -> list[str]:
    accuracy = to_percent(row.get("taxa_acerto"))
    top_800 = to_percent(row.get("taxa_acerto_media5_800plus"))
    rank_emp = int(float(row.get("rank_dificuldade_empirica", 0) or 0))
    rank_b = int(float(row.get("rank_dificuldade_b", 0) or 0))
    distractor = str(row.get("distrator_dominante_geral") or "-")
    share = to_percent(row.get("share_erro_no_principal_distrator_geral"))
    audit = str(row.get("classificacao_auditoria") or "ok").replace("_", " ")
    return [
        f"Taxa de acerto geral de {accuracy:.1f}% e {top_800:.1f}% entre os alunos de maior desempenho.",
        f"O principal distrator foi {distractor}, concentrando {share:.1f}% dos erros associados ao distrator dominante.",
        f"O item aparece em {rank_emp}º no ranking empírico de dificuldade e em {rank_b}º pelo parâmetro B; auditoria {audit}.",
    ]


def build_resolution(row: pd.Series, area_code: str) -> dict[str, Any]:
    top = str(row.get("distrator_dominante_geral") or "-")
    top_low = str(row.get("distrator_dominante_media5_lt650") or top)
    top_high = str(
        row.get("distrator_dominante_area_high_perf_custom")
        or row.get("distrator_dominante_media5_800plus")
        or top
    )
    delta = to_percent(row.get("delta_800plus_vs_lt650"))
    high_perf_label = AREA_HIGH_PERF_GROUP_META[area_code]["label"]
    summary = str(row.get("summary_auto") or "").strip()
    return {
        "whatItAsks": summary or "Leitura estruturada do item com base no comportamento observado nos microdados.",
        "howToSolve": "A resolução editorial específica ainda será refinada por área, mas os dados reais já destacam o padrão de acerto por faixa e a alternativa correta oficial.",
        "whyErrorsHappen": f"Os erros se concentram principalmente no distrator {top}, com mudança de padrão entre a base ({top_low}) e o grupo forte da área ({top_high}).",
        "distractorCommentary": [
            f"O gap entre {high_perf_label} e a base é de {delta:.1f} p.p., sugerindo forte separação entre níveis de proficiência.",
            f"O distrator {top} organiza a maior parte dos erros observados.",
            "A leitura pedagógica fina ainda pode ser refinada quando entrarem os temas e habilidades oficiais da área.",
        ],
    }


def build_top_performer_distribution(
    group_distributions: list[dict[str, Any]], area_code: str
) -> dict[str, Any]:
    return resolve_high_perf_group(area_code, group_distributions)


def resolve_reference_column(mapping: pd.DataFrame) -> str:
    if "is_reference_blue" in mapping.columns:
        return "is_reference_blue"
    if "is_reference_proof" in mapping.columns:
        return "is_reference_proof"
    raise KeyError("Mapping parquet sem coluna de referência reconhecida.")


def build_local_mapping(mapping: pd.DataFrame, area_code: str, proof_color: str, question_limit: int):
    ref_col = resolve_reference_column(mapping)
    reference_rows = mapping[mapping[ref_col] == True].copy()
    display_rows = mapping[mapping["TX_COR"].astype(str).str.upper() == proof_color].copy()

    if "TP_LINGUA_STUDENT" in mapping.columns and area_code == "LC":
        reference_rows = reference_rows[
            reference_rows["TP_LINGUA_STUDENT"] == reference_rows["TP_LINGUA_STUDENT"].min()
        ].copy()
        display_rows = display_rows[
            display_rows["TP_LINGUA_STUDENT"] == display_rows["TP_LINGUA_STUDENT"].min()
        ].copy()

    reference_rows = reference_rows.sort_values("response_pos")
    display_rows = display_rows.sort_values("response_pos").head(question_limit)

    reference_lookup = reference_rows[["questao_canonica", "questao_num"]].rename(
        columns={"questao_num": "reference_question_num"}
    )

    merged = display_rows[["response_pos", "questao_num", "questao_canonica"]].merge(
        reference_lookup,
        on="questao_canonica",
        how="left",
    )

    merged = merged.dropna(subset=["reference_question_num"]).copy()
    merged["response_pos"] = merged["response_pos"].astype(int)
    merged["reference_question_num"] = merged["reference_question_num"].astype(int)
    merged["questao_num"] = merged["questao_num"].astype(int)

    return merged


def build_area_payload(
    year: int,
    area_code: str,
    matrix_by_area: dict[str, dict[int, dict[str, Any]]],
) -> dict[str, Any]:
    input_root = ROOT / f"output_enem_all_areas_{year}"
    area_root = input_root / area_code
    config = AREA_CONFIG[area_code]

    final_cards = pd.read_parquet(area_root / "12_final_question_cards.parquet").copy()
    distractors = pd.read_parquet(area_root / "09_item_distractors.parquet").copy()
    curves = pd.read_parquet(area_root / "08_item_curves.parquet").copy()
    mapping = pd.read_parquet(area_root / "05_mapping.parquet").copy()

    local_mapping = build_local_mapping(
        mapping,
        area_code=area_code,
        proof_color=str(config["proof_color"]),
        question_limit=int(config["question_limit"]),
    )

    local_index_by_reference_qnum = {
        int(record["reference_question_num"]): int(record["response_pos"])
        for record in local_mapping.to_dict(orient="records")
    }
    source_question_by_reference_qnum = {
        int(record["reference_question_num"]): int(record["questao_num"])
        for record in local_mapping.to_dict(orient="records")
    }

    mapped_question_numbers = list(local_index_by_reference_qnum.keys())
    final_cards = final_cards[final_cards["questao_num"].isin(mapped_question_numbers)].copy()
    final_cards["local_id"] = final_cards["questao_num"].map(local_index_by_reference_qnum)
    final_cards = final_cards.sort_values("local_id")

    questions: list[dict[str, Any]] = []
    for record in final_cards.to_dict(orient="records"):
        row = pd.Series(record)
        reference_question_num = int(row["questao_num"])
        local_id = int(row["local_id"])
        display_question_num = source_question_by_reference_qnum.get(reference_question_num, local_id)
        co_habilidade = int(float(row.get("CO_HABILIDADE", 0) or 0))
        competence_meta = resolve_competence_metadata(matrix_by_area, area_code, co_habilidade)
        bucket_snapshot = build_bucket_snapshot(row, area_code)
        empirical_curve = build_empirical_curve(curves, reference_question_num)
        group_distributions = build_group_distributions(distractors, reference_question_num)
        high_perf_group = build_top_performer_distribution(group_distributions, area_code)
        option_distribution = normalize_option_distribution(distractors, reference_question_num, "geral")
        weakest_bucket = min(bucket_snapshot, key=lambda item: item["acerto"]) if bucket_snapshot else None
        strongest_bucket = max(bucket_snapshot, key=lambda item: item["acerto"]) if bucket_snapshot else None

        questions.append(
            {
                "id": local_id,
                "questionNumber": local_id,
                "sourceQuestionNumber": display_question_num,
                "referenceQuestionNumber": reference_question_num,
                "questaoCanonica": str(row.get("questao_canonica") or f"Q{reference_question_num:02d}"),
                "coItem": int(float(row.get("CO_ITEM", 0) or 0)),
                "coHabilidade": co_habilidade,
                "competenceNumber": competence_meta["competenceNumber"],
                "competenceDescription": competence_meta["competenceDescription"],
                "skillCode": competence_meta["skillCode"],
                "skillDescription": competence_meta["skillDescription"],
                "correctOption": str(row.get("gabarito_ref") or ""),
                "accuracy": to_percent(row.get("taxa_acerto")),
                "difficultyRank": int(float(row.get("rank_dificuldade_empirica", 0) or 0)),
                "difficultyRankB": int(float(row.get("rank_dificuldade_b", 0) or 0)),
                "difficultyRank800": int(float(row.get("rank_dificuldade_entre_800plus", 0) or 0)),
                "topDistractor": str(row.get("distrator_dominante_geral") or "-"),
                "topDistractor800plus": str(row.get("distrator_dominante_media5_800plus") or "-"),
                "topDistractorLt650": str(row.get("distrator_dominante_media5_lt650") or "-"),
                "optionDistribution": option_distribution,
                "topPerformerDistribution": high_perf_group["distribution"],
                "topPerformerGroup": high_perf_group["group"],
                "topPerformerGroupLabel": high_perf_group["label"],
                "topPerformerGroupDescription": high_perf_group["description"],
                "topPerformerGroupSampleSize": high_perf_group["sampleSize"],
                "proficiencyAccuracy": build_proficiency_accuracy(row, area_code),
                "comments": build_comments(row),
                "analyticsSummary": str(row.get("summary_auto") or ""),
                "sampleSize": int(float(row.get("n_alunos", 0) or 0)),
                "bucketSnapshot": bucket_snapshot,
                "distractorByBucket": build_distractor_by_bucket(row, area_code),
                "empiricalCurve": empirical_curve,
                "discriminationGapLt600To900": to_percent(row.get("delta_800plus_vs_lt650")),
                "discriminationGap700To900": to_percent(row.get("delta_800plus_vs_geral")),
                "rankDiscrimination": int(float(row.get("rank_dificuldade_entre_800plus", 0) or 0)),
                "rankInformation": int(float(row.get("rank_dificuldade_b", 0) or 0)),
                "informationLabel": "Alta" if to_float(row.get("NU_PARAM_A")) >= 2 else "Média" if to_float(row.get("NU_PARAM_A")) >= 1.2 else "Baixa",
                "averageScore": to_float(row.get("nota_media_area"), 1),
                "thetaAverage": 0.0,
                "tri": {
                    "a": to_float(row.get("NU_PARAM_A"), 5),
                    "b": to_float(row.get("NU_PARAM_B"), 5),
                    "c": to_float(row.get("NU_PARAM_C"), 5),
                },
                "itemInformationProxy": to_float(row.get("NU_PARAM_A"), 3),
                "shareErroNoPrincipalDistrator": to_percent(row.get("share_erro_no_principal_distrator_geral")),
                "distratorDominantePercent": to_percent(row.get("pct_distrator_dominante_geral")),
                "difficultyBand": "muito alta" if int(float(row.get("rank_dificuldade_empirica", 99) or 99)) <= 9 else "alta" if int(float(row.get("rank_dificuldade_empirica", 99) or 99)) <= 18 else "média" if int(float(row.get("rank_dificuldade_empirica", 99) or 99)) <= 27 else "baixa" if int(float(row.get("rank_dificuldade_empirica", 99) or 99)) <= 36 else "muito baixa",
                "reviewPriorityLabel": str(row.get("classificacao_auditoria") or "ok").replace("_", " "),
                "qualityLabel": "boa" if not bool(row.get("flag_discrepancia_rank_grande")) else "revisar",
                "discriminationLabel": "forte" if to_percent(row.get("delta_800plus_vs_lt650")) >= 45 else "moderada",
                "weakestBucket": weakest_bucket,
                "strongestBucket": strongest_bucket,
                "groupDistributions": group_distributions,
                "resolution": build_resolution(row, area_code),
            }
        )

    return {
        "metadata": {
            "year": year,
            "areaCode": area_code,
            "areaSlug": config["slug"],
            "areaLabel": config["label"],
            "proofColor": config["proof_color"],
            "sourceDir": str(area_root),
        },
        "questions": questions,
    }


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    matrix_pdf_path = get_matrix_pdf_path()
    matrix_by_area = parse_matrix_sections(matrix_pdf_path) if matrix_pdf_path else {}

    for year in DEFAULT_YEARS:
      for area_code, config in AREA_CONFIG.items():
        payload = build_area_payload(year, area_code, matrix_by_area)
        output_path = OUTPUT_ROOT / f"enem-{year}-{config['slug']}-frontend-analytics.json"
        output_path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"{year} {area_code}: {len(payload['questions'])} questões -> {output_path}")


if __name__ == "__main__":
    main()
