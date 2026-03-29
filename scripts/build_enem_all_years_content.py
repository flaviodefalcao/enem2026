#!/usr/bin/env python3

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
EXTRACT_SCRIPT = ROOT / "scripts" / "extract_enem_math_2024.py"
GENERATED_ROOT = ROOT / "src" / "data" / "generated"
PUBLIC_ROOT = ROOT / "public" / "generated"
DEFAULT_YEARS = [2017, 2018, 2019, 2020, 2021, 2022, 2023]

AREA_JOBS = [
    {
        "slug": "linguagens",
        "label": "Linguagens",
        "question_start": 1,
        "question_end": 45,
        "pdf_pattern": "ENEM_{year}_P1_CAD_01_DIA_1_AZUL.pdf",
    },
    {
        "slug": "ciencias-humanas",
        "label": "Ciências Humanas",
        "question_start": 46,
        "question_end": 90,
        "pdf_pattern": "ENEM_{year}_P1_CAD_01_DIA_1_AZUL.pdf",
    },
    {
        "slug": "ciencias-natureza",
        "label": "Ciências da Natureza",
        "question_start": 91,
        "question_end": 135,
        "pdf_pattern": "ENEM_{year}_P1_CAD_05_DIA_2_AMARELO.pdf",
    },
    {
        "slug": "matematica",
        "label": "Matemática",
        "question_start": 136,
        "question_end": 180,
        "pdf_pattern": "ENEM_{year}_P1_CAD_05_DIA_2_AMARELO.pdf",
    },
]


def run_job(year: int, job: dict[str, object]) -> None:
    input_root = ROOT / f"output_enem_all_areas_{year}"
    pdf_path = input_root / str(job["pdf_pattern"]).format(year=year)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF não encontrado: {pdf_path}")

    output_path = GENERATED_ROOT / f"enem-{year}-{job['slug']}-content.json"
    assets_dir = PUBLIC_ROOT / f"enem-{year}" / str(job["slug"])

    cmd = [
        sys.executable,
        str(EXTRACT_SCRIPT),
        "--pdf",
        str(pdf_path),
        "--output",
        str(output_path),
        "--assets-dir",
        str(assets_dir),
        "--question-start",
        str(job["question_start"]),
        "--question-end",
        str(job["question_end"]),
        "--year",
        str(year),
        "--area-label",
        str(job["label"]),
        "--area-slug",
        str(job["slug"]),
    ]

    print(f"[{year}] extraindo {job['label']} -> {output_path.name}")
    subprocess.run(cmd, check=True)


def main() -> None:
    GENERATED_ROOT.mkdir(parents=True, exist_ok=True)
    for year in DEFAULT_YEARS:
        for job in AREA_JOBS:
            run_job(year, job)


if __name__ == "__main__":
    main()
