from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
INPUT_DIR = ROOT / "output_enem_all_areas_2024"
OUTPUT_PATH = ROOT / "src" / "data" / "generated" / "enem-2024-proof-summary.json"

AREA_META = {
    "LC": {"slug": "linguagens", "label": "Linguagens", "questionCount": 45},
    "CH": {"slug": "ciencias-humanas", "label": "Ciências Humanas", "questionCount": 45},
    "CN": {"slug": "ciencias-natureza", "label": "Ciências da Natureza", "questionCount": 45},
    "MT": {"slug": "matematica", "label": "Matemática", "questionCount": 45},
}


def load_area_frame(area_code: str) -> pd.DataFrame:
    parquet_path = INPUT_DIR / area_code / "06_gold_a_student_wide.parquet"
    return pd.read_parquet(
        parquet_path,
        columns=[
            "NU_SEQUENCIAL",
            "NU_NOTA_AREA",
            "NU_NOTA_CN",
            "NU_NOTA_CH",
            "NU_NOTA_LC",
            "NU_NOTA_MT",
            "NU_NOTA_REDACAO",
            "NU_NOTA_MEDIA_4",
            "NU_NOTA_MEDIA_5",
            "total_acertos",
        ],
    )


def build_bucket_labels(start: int, stop: int, step: int) -> list[str]:
    labels: list[str] = []
    current = start
    while current < stop:
        end = min(current + step, stop)
        labels.append(f"{current}–{end - 1}" if end < stop else f"{current}–{end}")
        current += step
    return labels


def bucketize_distribution(
    series: pd.Series,
    *,
    start: int,
    stop: int,
    step: int,
) -> list[dict[str, float | int | str]]:
    clean = pd.to_numeric(series, errors="coerce").dropna()
    bins = list(range(start, stop + step, step))
    labels = build_bucket_labels(start, stop, step)
    categorized = pd.cut(clean, bins=bins, labels=labels, right=False, include_lowest=True)
    counts = categorized.value_counts(sort=False)
    total = int(counts.sum())
    result: list[dict[str, float | int | str]] = []
    for label in labels:
        n = int(counts.get(label, 0))
        result.append(
            {
                "faixa": label,
                "n": n,
                "share": round((n / total) * 100, 1) if total else 0.0,
            }
        )
    return result


def bucketize_accuracy_vs_score(
    frame: pd.DataFrame,
    *,
    score_col: str,
    accuracy_col: str,
    start: int,
    stop: int,
    step: int,
) -> list[dict[str, float | int | str]]:
    data = frame[[score_col, accuracy_col]].copy()
    data[score_col] = pd.to_numeric(data[score_col], errors="coerce")
    data[accuracy_col] = pd.to_numeric(data[accuracy_col], errors="coerce")
    data = data.dropna()
    bins = list(range(start, stop + step, step))
    labels = build_bucket_labels(start, stop, step)
    data["bucket"] = pd.cut(
        data[score_col],
        bins=bins,
        labels=labels,
        right=False,
        include_lowest=True,
    )
    grouped = (
        data.groupby("bucket", observed=False)
        .agg(
            n=(accuracy_col, "size"),
            mediaAcertos=(accuracy_col, "mean"),
            minAcertos=(accuracy_col, "min"),
            maxAcertos=(accuracy_col, "max"),
            stdAcertos=(accuracy_col, "std"),
            mediaNota=(score_col, "mean"),
        )
        .reindex(labels)
        .fillna(0)
    )

    return [
        {
            "faixa": label,
            "n": int(grouped.loc[label, "n"]),
            "mediaAcertos": round(float(grouped.loc[label, "mediaAcertos"]), 1),
            "minAcertos": round(float(grouped.loc[label, "minAcertos"]), 1),
            "maxAcertos": round(float(grouped.loc[label, "maxAcertos"]), 1),
            "stdAcertos": round(float(grouped.loc[label, "stdAcertos"]), 1),
            "mediaNota": round(float(grouped.loc[label, "mediaNota"]), 1),
        }
        for label in labels
    ]


def main() -> None:
    area_frames = {area_code: load_area_frame(area_code) for area_code in AREA_META}

    overall_base = area_frames["LC"][
        [
            "NU_SEQUENCIAL",
            "NU_NOTA_CN",
            "NU_NOTA_CH",
            "NU_NOTA_LC",
            "NU_NOTA_MT",
            "NU_NOTA_REDACAO",
            "NU_NOTA_MEDIA_4",
            "NU_NOTA_MEDIA_5",
        ]
    ].copy()
    for area_code, frame in area_frames.items():
        overall_base = overall_base.merge(
            frame[["NU_SEQUENCIAL", "total_acertos"]].rename(
                columns={"total_acertos": f"acertos_{area_code.lower()}"}
            ),
            on="NU_SEQUENCIAL",
            how="left",
        )

    accuracy_columns = [f"acertos_{area_code.lower()}" for area_code in AREA_META]
    overall_base[accuracy_columns] = overall_base[accuracy_columns].fillna(0)
    overall_base["total_acertos_180"] = overall_base[accuracy_columns].sum(axis=1)
    top_students = overall_base[pd.to_numeric(overall_base["NU_NOTA_MEDIA_5"], errors="coerce") >= 800].copy()

    top_student_ranges = []
    for label, column in [
        ("Linguagens", "NU_NOTA_LC"),
        ("Ciências Humanas", "NU_NOTA_CH"),
        ("Ciências da Natureza", "NU_NOTA_CN"),
        ("Matemática", "NU_NOTA_MT"),
        ("Redação", "NU_NOTA_REDACAO"),
    ]:
        series = pd.to_numeric(top_students[column], errors="coerce").dropna()
        top_student_ranges.append(
            {
                "label": label,
                "minScore": round(float(series.min()), 1) if not series.empty else 0.0,
                "maxScore": round(float(series.max()), 1) if not series.empty else 0.0,
            }
        )

    areas_payload: dict[str, object] = {}
    for area_code, meta in AREA_META.items():
        frame = area_frames[area_code]
        areas_payload[meta["slug"]] = {
            "label": meta["label"],
            "questionCount": meta["questionCount"],
            "sampleSize": int(len(frame)),
            "averageScore": round(float(frame["NU_NOTA_AREA"].mean()), 1),
            "averageAccuracy": round(
                float((frame["total_acertos"].mean() / meta["questionCount"]) * 100),
                1,
            ),
            "scoreDistribution": bucketize_distribution(
                frame["NU_NOTA_AREA"], start=300, stop=1000, step=50
            ),
            "accuracyVsScore": bucketize_accuracy_vs_score(
                frame,
                score_col="NU_NOTA_AREA",
                accuracy_col="total_acertos",
                start=300,
                stop=1000,
                step=50,
            ),
        }

    payload = {
        "metadata": {
            "year": 2024,
            "sourceDir": str(INPUT_DIR),
        },
        "sampleSize": int(len(overall_base)),
        "generalScoreDistribution": bucketize_distribution(
            overall_base["NU_NOTA_MEDIA_5"], start=200, stop=1000, step=50
        ),
        "essayDistribution": bucketize_distribution(
            overall_base["NU_NOTA_REDACAO"], start=0, stop=1000, step=100
        ),
        "topStudents": {
            "threshold": 800,
            "sampleSize": int(len(top_students)),
            "ranges": top_student_ranges,
        },
        "overallAccuracyVsScore": bucketize_accuracy_vs_score(
            overall_base,
            score_col="NU_NOTA_MEDIA_5",
            accuracy_col="total_acertos_180",
            start=200,
            stop=1000,
            step=50,
        ),
        "areas": areas_payload,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
