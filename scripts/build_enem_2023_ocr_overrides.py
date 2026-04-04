from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path
from typing import TypedDict


ROOT = Path("/Users/flaviodefalcao/Desktop/project_enem")
AUDIT_PATH = ROOT / "docs" / "audit" / "enem-2023-question-formatting-audit.json"
ASSET_ROOT = ROOT / "public" / "generated" / "enem-2023"
SWIFT_OCR = ROOT / "scripts" / "ocr_image.swift"
OUTPUT_PATH = ROOT / "src" / "data" / "generated" / "enem-2023-ocr-overrides.json"


class OptionOverride(TypedDict):
    option: str
    text: str


class QuestionOverride(TypedDict, total=False):
    statement: str
    options: list[OptionOverride]
    ocrText: str
    confidence: str


AREAS = [
    "linguagens",
    "ciencias-humanas",
    "ciencias-natureza",
    "matematica",
]

COMMAND_LEAD = re.compile(
    r"^(Nesse|Nessa|Nesses|Nessas|No texto|Na tira|Na charge|Na imagem|No gráfico|Na tabela|"
    r"Considerando|A partir|Com base|Em relação|Nesse contexto|Esse texto|Essa tirinha|"
    r"Essa imagem|Esses dados|Esse cartaz|O texto|A tirinha|A charge|O gráfico|A tabela|"
    r"A definição|O efeito|O princípio|A velocidade|Qual|Quais|Ao retratar|Na perspectiva)"
    ,
    re.IGNORECASE,
)

SOURCE_LINE = re.compile(
    r"(Dispon[ií]vel em:|Fonte:|Acesso em:|Extra[ií]do de:|\(adaptado\)|apud\b|Revista\b|Editora\b|Unicamp\b)",
    re.IGNORECASE,
)

OPTION_BLOCK = re.compile(
    r"(?:^|\n)(A)(?:[.)]|\s)\s*([\s\S]*?)(?=(?:\nB(?:[.)]|\s)\s*)|$)"
    r"(?:^|\n)(B)(?:[.)]|\s)\s*([\s\S]*?)(?=(?:\nC(?:[.)]|\s)\s*)|$)"
    r"(?:^|\n)(C)(?:[.)]|\s)\s*([\s\S]*?)(?=(?:\nD(?:[.)]|\s)\s*)|$)"
    r"(?:^|\n)(D)(?:[.)]|\s)\s*([\s\S]*?)(?=(?:\nE(?:[.)]|\s)\s*)|$)"
    r"(?:^|\n)(E)(?:[.)]|\s)\s*([\s\S]*)$",
    re.IGNORECASE,
)


def load_audit() -> dict:
    return json.loads(AUDIT_PATH.read_text())


def run_ocr(image_path: Path) -> str:
    result = subprocess.run(
        ["swift", str(SWIFT_OCR), str(image_path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def clean_ocr_text(text: str) -> str:
    return (
        text.replace("\r", "")
        .replace(" | ", "\n")
        .replace("–", "-")
        .replace("—", "-")
        .replace("•", " ")
        .replace("\u00a0", " ")
        .replace("“", '"')
        .replace("”", '"')
        .replace("’", "'")
    )


def normalize_lines(text: str) -> list[str]:
    lines = [re.sub(r"\s+", " ", line).strip() for line in clean_ocr_text(text).splitlines()]
    return [line for line in lines if line]


def merge_split_option_lines(lines: list[str]) -> list[str]:
    merged: list[str] = []
    index = 0
    while index < len(lines):
        line = lines[index]
        if re.fullmatch(r"[A-E]", line) and index + 1 < len(lines):
            merged.append(f"{line} {lines[index + 1]}")
            index += 2
            continue
        merged.append(line)
        index += 1
    return merged


def split_statement_source_command(lines: list[str]) -> tuple[str, str | None, str | None]:
    source_indexes = [index for index, line in enumerate(lines) if SOURCE_LINE.search(line)]

    if source_indexes:
        start = source_indexes[0]
        end = source_indexes[-1]
        statement_lines = lines[:start]
        source_lines = lines[start : end + 1]
        command_lines = lines[end + 1 :]
        return (
            "\n".join(statement_lines).strip(),
            " ".join(source_lines).strip(),
            "\n".join(command_lines).strip() or None,
        )

    for index in range(len(lines) - 1, -1, -1):
        line = lines[index]
        if line.endswith("?") or COMMAND_LEAD.search(line):
            return (
                "\n".join(lines[:index]).strip(),
                None,
                "\n".join(lines[index:]).strip(),
            )

    return ("\n".join(lines).strip(), None, None)


def extract_options(lines: list[str]) -> list[OptionOverride]:
    text = "\n".join(lines)
    matches = re.findall(
        r"(?:^|\n)([A-E])(?:[.)]|\s)\s*([\s\S]*?)(?=(?:\n[A-E](?:[.)]|\s)\s*)|$)",
        text,
        re.IGNORECASE,
    )
    options: list[OptionOverride] = []
    for option, raw in matches:
        cleaned = re.sub(r"\s+", " ", raw).strip()
        cleaned = re.sub(r"^[A-E][.)]?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\b\d+\s*/\s*\d[º°]\s*DIA.*$", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\*[0-9A-Z*]+\*", "", cleaned)
        cleaned = cleaned.strip()
        if cleaned:
            options.append({"option": option.upper(), "text": cleaned})
    return options if len(options) == 5 else []


def build_override_from_ocr_text(text: str) -> QuestionOverride | None:
    lines = merge_split_option_lines(normalize_lines(text))
    option_start = next((index for index, line in enumerate(lines) if re.match(r"^[A-E](?:[.)]|\s)", line)), None)

    if option_start is None:
        return None

    header_lines = lines[:option_start]
    option_lines = lines[option_start:]
    options = extract_options(option_lines)
    if len(options) != 5:
        return None

    statement, source, command = split_statement_source_command(header_lines)
    parts = [part for part in [statement, f"Fonte: {source}" if source else None, command] if part]
    if not parts:
        return None

    return {
        "statement": "\n".join(parts).strip(),
        "options": options,
        "ocrText": "\n".join(lines).strip(),
        "confidence": "asset_ocr",
    }


def build_overrides() -> dict:
    audit = load_audit()["byArea"]
    overrides: dict[str, dict[str, dict[str, QuestionOverride]]] = {"2023": {}}

    for area in AREAS:
        overrides["2023"][area] = {}
        for item in audit.get(area, []):
            if item["summary"]["statementAssets"] <= 0:
                continue

            exam_number = item["examQuestionNumber"]
            asset_dir = ASSET_ROOT / area / f"question-{exam_number}"
            asset_paths = sorted(asset_dir.glob("statement-*.png"))
            if not asset_paths:
                continue

            ocr_parts = [run_ocr(asset_path) for asset_path in asset_paths]
            override = build_override_from_ocr_text("\n".join(part for part in ocr_parts if part.strip()))
            if override:
                overrides["2023"][area][str(item["id"])] = override

    return overrides


def main() -> None:
    overrides = build_overrides()
    OUTPUT_PATH.write_text(json.dumps(overrides, ensure_ascii=False, indent=2))
    total = sum(len(area_map) for area_map in overrides["2023"].values())
    print(f"OCR overrides written to {OUTPUT_PATH}")
    print(f"Recovered questions: {total}")


if __name__ == "__main__":
    main()
