#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import pandas as pd


def clean_value(value):
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    if hasattr(value, "item"):
        try:
            value = value.item()
        except Exception:
            pass
    if isinstance(value, float) and math.isnan(value):
        return None
    return value


def records(df: pd.DataFrame):
    out = []
    for row in df.to_dict(orient="records"):
        out.append({key: clean_value(value) for key, value in row.items()})
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input-dir",
        default="strategic_metrics_raw",
        help="Directory containing strategic metrics parquet/csv files",
    )
    parser.add_argument(
        "--output",
        default="src/data/generated/strategic-metrics-real.json",
        help="Output JSON path",
    )
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output = Path(args.output)

    question_df = pd.read_parquet(input_dir / "strategic_question_metrics.parquet")
    content_df = pd.read_parquet(input_dir / "strategic_content_metrics.parquet")
    summary_df = pd.read_parquet(input_dir / "strategic_general_summary.parquet")

    payload = {
        "metadata": {
            "sourceDir": str(input_dir),
            "questionCount": int(len(question_df)),
            "contentCount": int(len(content_df)),
            "summaryCount": int(len(summary_df)),
            "years": sorted({int(value) for value in question_df["year"].dropna().unique().tolist()}),
        },
        "questions": records(question_df),
        "contents": records(content_df),
        "summaries": records(summary_df),
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
