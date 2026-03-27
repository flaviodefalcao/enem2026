#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any

import pandas as pd


DEFAULT_FINAL_CARDS = "data/external/output_enem_mt_2024_debug/final_mt_question_cards.csv"
DEFAULT_DISTRACTORS = "data/external/output_enem_mt_2024_debug/gold_mt_item_distractors.csv"
DEFAULT_CURVE = "data/external/output_enem_mt_2024_debug/gold_mt_item_empirical_curve.csv"
DEFAULT_OUTPUT = "src/data/generated/enem-2024-math-frontend-analytics.json"

PROFICIENCY_BUCKETS = [
    ("<600", "Até 599"),
    ("600-699", "600-699"),
    ("700-799", "700-799"),
    ("800-899", "800-899"),
    ("900+", "900+"),
]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Gera um JSON leve de analytics de matemática do ENEM 2024 para o frontend."
    )
    parser.add_argument("--final-cards", default=DEFAULT_FINAL_CARDS)
    parser.add_argument("--distractors", default=DEFAULT_DISTRACTORS)
    parser.add_argument("--curve", default=DEFAULT_CURVE)
    parser.add_argument("--output", default=DEFAULT_OUTPUT)
    parser.add_argument("--family-id", type=int, default=3)
    return parser


def to_percent(value: Any) -> float:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return 0.0
    return round(float(value) * 100, 1)


def to_float(value: Any, digits: int = 1) -> float:
    if value is None:
        return 0.0

    numeric = float(value)
    if math.isnan(numeric):
        return 0.0

    return round(numeric, digits)


def prettify_label(value: str) -> str:
    return value.replace("_", " ").strip().capitalize()


def build_comments(row: pd.Series) -> list[str]:
    difficulty = map_difficulty_label(str(row["label_dificuldade"]))
    discriminacao = prettify_label(str(row["label_discriminacao"]))
    prioridade = prettify_label(str(row["label_prioridade_revisao"]))
    classificacao = prettify_label(str(row["classificacao"]))
    accuracy = to_percent(row["taxa_acerto"])
    ranking = int(row["rank_dificuldade_empirica"])
    distrator = str(row["distrator_dominante_total"])
    share = to_percent(row["share_erro_no_principal_distrator"])
    strong = bool(row["tem_distrator_muito_forte"])

    return [
        f"Questão {difficulty.lower()} com {accuracy:.1f}% de acerto e ranking {ranking} entre as 45 questões da família analítica.",
        f"O principal distrator foi {distrator}, concentrando {share:.1f}% dos erros válidos{' e com força alta' if strong else ''}.",
        f"A discriminação empírica foi {discriminacao.lower()}; classificação geral {classificacao.lower()}; prioridade de revisão {prioridade.lower()}.",
    ]


def build_option_distribution(
    distractors_df: pd.DataFrame,
    family_id: int,
    question_num: int,
) -> dict[str, float]:
    filtered = distractors_df[
        (distractors_df["family_id"] == family_id)
        & (distractors_df["questao_num"] == question_num)
        & (distractors_df["resposta_cat"].isin(list("ABCDE")))
    ].copy()

    grouped = filtered.groupby("resposta_cat", dropna=False)["n"].sum().to_dict()
    total = sum(float(value) for value in grouped.values())
    if total == 0:
        return {option: 0.0 for option in "ABCDE"}

    return {
        option: round((float(grouped.get(option, 0)) / total) * 100, 1)
        for option in "ABCDE"
    }


def build_proficiency_accuracy(row: pd.Series) -> list[dict[str, float | str]]:
    payload = []
    for key, label in PROFICIENCY_BUCKETS:
        payload.append(
            {
                "faixa": label,
                "acerto": to_percent(row[f"taxa_{key}"]),
            }
        )
    return payload


def build_bucket_snapshot(row: pd.Series) -> list[dict[str, float | str | int]]:
    payload = []
    for key, label in PROFICIENCY_BUCKETS:
        payload.append(
            {
                "faixa": label,
                "acerto": to_percent(row[f"taxa_{key}"]),
                "n": int(float(row[f"n_{key}"])),
            }
        )
    return payload


def build_distractor_by_bucket(row: pd.Series) -> list[dict[str, float | str | int]]:
    payload = []
    for key, label in PROFICIENCY_BUCKETS:
        payload.append(
            {
                "faixa": label,
                "distractor": str(row[f"distrator_dominante_{key}"]),
                "pct": to_percent(row[f"pct_distrator_dominante_{key}"]),
                "n": int(float(row[f"n_distrator_dominante_{key}"])),
            }
        )
    return payload


def build_empirical_curve(
    curve_df: pd.DataFrame,
    family_id: int,
    question_num: int,
) -> list[dict[str, float | str | int]]:
    filtered = curve_df[
        (curve_df["family_id"] == family_id) & (curve_df["questao_num"] == question_num)
    ].copy()
    filtered = filtered.sort_values("nota_bin_left")

    payload = []
    for row in filtered.to_dict(orient="records"):
        payload.append(
            {
                "faixa": str(row["nota_bin_label"]),
                "acerto": to_percent(row["taxa_acerto"]),
                "n": int(row["n"]),
                "notaMedia": to_float(row["nota_media_bin"], 1),
            }
        )
    return payload


def build_information_label(rank_item_information: int) -> str:
    if rank_item_information <= 10:
        return "Muito alta"
    if rank_item_information <= 20:
        return "Alta"
    if rank_item_information <= 32:
        return "Média"
    return "Baixa"


def map_difficulty_label(value: str) -> str:
    mapped = {
        "muito_dificil": "Muito difícil",
        "dificil": "Difícil",
        "media": "Média",
        "facil": "Fácil",
        "muito_facil": "Muito fácil",
    }
    return mapped.get(value, prettify_label(value))


def main() -> None:
    args = build_parser().parse_args()

    final_cards_path = Path(args.final_cards).expanduser().resolve()
    distractors_path = Path(args.distractors).expanduser().resolve()
    curve_path = Path(args.curve).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve()

    final_cards = pd.read_csv(final_cards_path)
    distractors = pd.read_csv(distractors_path)
    curve = pd.read_csv(curve_path)

    family_cards = (
        final_cards[final_cards["family_id"] == args.family_id]
        .copy()
        .sort_values("questao_num")
    )

    questions: list[dict[str, Any]] = []
    for row in family_cards.to_dict(orient="records"):
        series = pd.Series(row)
        question_num = int(series["questao_num"])
        questions.append(
            {
                "id": question_num,
                "familyId": int(series["family_id"]),
                "questaoCanonica": str(series["questao_canonica"]),
                "coItem": int(series["CO_ITEM"]),
                "coProvaRefAzul": int(series["CO_PROVA_REF_AZUL"]),
                "coHabilidade": int(series["CO_HABILIDADE"]),
                "correctOption": str(series["gabarito_ref"]),
                "accuracy": to_percent(series["taxa_acerto"]),
                "difficulty": map_difficulty_label(str(series["label_dificuldade"])),
                "difficultyRank": int(series["rank_dificuldade_empirica"]),
                "topDistractor": str(series["distrator_dominante_total"]),
                "optionDistribution": build_option_distribution(
                    distractors_df=distractors,
                    family_id=args.family_id,
                    question_num=question_num,
                ),
                "proficiencyAccuracy": build_proficiency_accuracy(series),
                "comments": build_comments(series),
                "analyticsSummary": str(series["summary_auto"]),
                "classification": str(series["classificacao"]),
                "difficultyLabel": str(series["label_dificuldade"]),
                "discriminationLabel": str(series["label_discriminacao"]),
                "distractorLabel": str(series["label_distrator"]),
                "qualityLabel": str(series["label_qualidade_item"]),
                "reviewPriorityLabel": str(series["label_prioridade_revisao"]),
                "sampleSize": int(series["n_alunos"]),
                "bucketSnapshot": build_bucket_snapshot(series),
                "distractorByBucket": build_distractor_by_bucket(series),
                "empiricalCurve": build_empirical_curve(
                    curve_df=curve,
                    family_id=args.family_id,
                    question_num=question_num,
                ),
                "discriminationGapLt600To900": to_percent(
                    series["disc_empirica_900_vs_lt600"]
                ),
                "discriminationGap700To900": to_percent(
                    series["disc_empirica_900_vs_700"]
                ),
                "rankDiscrimination": int(series["rank_discriminacao_empirica"]),
                "rankInformation": int(series["rank_item_information"]),
                "informationLabel": build_information_label(
                    int(series["rank_item_information"])
                ),
                "averageScore": to_float(series["nota_media"], 1),
                "thetaAverage": to_float(series["theta_medio"], 4),
                "tri": {
                    "a": round(float(series["NU_PARAM_A"]), 5),
                    "b": round(float(series["NU_PARAM_B"]), 5),
                    "c": round(float(series["NU_PARAM_C"]), 5),
                },
                "itemInformationProxy": round(float(series["item_information_proxy"]), 6),
                "shareErroNoPrincipalDistrator": to_percent(
                    series["share_erro_no_principal_distrator"]
                ),
                "distratorDominantePercent": to_percent(
                    series["pct_distrator_dominante_total"]
                ),
                "faixaDificuldadeEmpirica": str(series["faixa_dificuldade_empirica"]),
            }
        )

    payload = {
        "metadata": {
            "familyId": args.family_id,
            "finalCardsSource": str(final_cards_path),
            "distractorsSource": str(distractors_path),
            "curveSource": str(curve_path),
        },
        "questions": questions,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(
        f"Analytics frontend gerado com {len(questions)} questões em {output_path}"
    )


if __name__ == "__main__":
    main()
