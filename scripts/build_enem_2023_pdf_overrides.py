from __future__ import annotations

import json
import re
import subprocess
import tempfile
from pathlib import Path
from typing import TypedDict

import fitz


ROOT = Path("/Users/flaviodefalcao/Desktop/project_enem")
OUTPUT_PATH = ROOT / "src" / "data" / "generated" / "enem-2023-ocr-overrides.json"
SWIFT_OCR = ROOT / "scripts" / "ocr_image.swift"

PDFS = {
    "day1": ROOT / "output_enem_all_areas_2023" / "ENEM_2023_P1_CAD_01_DIA_1_AZUL.pdf",
    "day2": ROOT / "output_enem_all_areas_2023" / "ENEM_2023_P1_CAD_05_DIA_2_AMARELO.pdf",
}

SUSPECTS = {
    "linguagens": [
        {"id": 8, "exam": 8, "pdf": "day1", "fallback_pages": [6, 7]},
        {"id": 11, "exam": 11, "pdf": "day1", "fallback_pages": [7, 8]},
        {"id": 25, "exam": 25, "pdf": "day1", "fallback_pages": [13]},
        {"id": 29, "exam": 29, "pdf": "day1", "fallback_pages": [14]},
    ],
    "ciencias-humanas": [
        {"id": 1, "exam": 46, "pdf": "day1", "fallback_pages": [20]},
        {"id": 9, "exam": 54, "pdf": "day1", "fallback_pages": [21, 22]},
        {"id": 13, "exam": 58, "pdf": "day1", "fallback_pages": [23]},
        {"id": 24, "exam": 69, "pdf": "day1", "fallback_pages": [25, 26]},
        {"id": 42, "exam": 87, "pdf": "day1", "fallback_pages": [30]},
    ],
    "ciencias-natureza": [
        {"id": 7, "exam": 97, "pdf": "day2", "fallback_pages": [4]},
        {"id": 11, "exam": 101, "pdf": "day2", "fallback_pages": [5]},
        {"id": 30, "exam": 120, "pdf": "day2", "fallback_pages": [11]},
        {"id": 40, "exam": 130, "pdf": "day2", "fallback_pages": [14]},
    ],
    "matematica": [
        {"id": 12, "exam": 147, "pdf": "day2", "fallback_pages": [20, 21]},
        {"id": 18, "exam": 153, "pdf": "day2", "fallback_pages": [22, 23]},
        {"id": 24, "exam": 159, "pdf": "day2", "fallback_pages": [24]},
        {"id": 37, "exam": 172, "pdf": "day2", "fallback_pages": [28, 29]},
    ],
}

SOURCE_MARKER = re.compile(
    r"(Dispon[ií]vel em:|Fonte:|Acesso em:|Extra[ií]do de:|\(adaptado\)|apud\b)",
    re.IGNORECASE,
)
COMMAND_MARKER = re.compile(
    r"^(Nesse|Nessa|Nesses|Nessas|No texto|Na tira|Na charge|Na imagem|No gráfico|Na tabela|"
    r"Considerando|A partir|Com base|Em relação|Nesse contexto|Esse texto|Essa tirinha|"
    r"Essa imagem|Esses dados|Esse cartaz|O texto|A tirinha|A charge|O gráfico|A tabela|"
    r"A definição|O efeito|O princípio|A velocidade|Qual|Quais|Ao retratar|Na perspectiva|"
    r"As mudanças|O texto apresenta|O uso de|Perante|Conforme|A prática|Os elementos|Na obra)"
    ,
    re.IGNORECASE,
)
QUESTION_RE = lambda q: re.compile(rf"QUEST[ÃA]O\s+{q}(?!\d)")
NEXT_QUESTION_RE = re.compile(r"QUEST[ÃA]O\s+(\d+)(?!\d)")


class OptionOverride(TypedDict):
    option: str
    text: str


class QuestionOverride(TypedDict, total=False):
    statement: str
    options: list[OptionOverride]
    ocrText: str
    confidence: str


def clean_text(text: str) -> str:
    return (
        text.replace("\r", "")
        .replace("QUESTÃO", "QUESTÃO")
        .replace("Questões", "Questões")
        .replace("Disponível", "Disponível")
        .replace("Acesso em", "Acesso em")
        .replace("•", " ")
        .replace("–", "-")
        .replace("—", "-")
        .replace("\u00a0", " ")
    )


def normalize_lines(text: str) -> list[str]:
    return [re.sub(r"\s+", " ", line).strip() for line in clean_text(text).splitlines() if line.strip()]


def merge_option_letter_lines(lines: list[str]) -> list[str]:
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


def extract_option_token(line: str) -> str | None:
    tokens = line.split()
    if not tokens:
        return None
    token = re.sub(r"[.)]", "", tokens[0]).strip().upper()
    return token if token in {"A", "B", "C", "D", "E"} else None


def find_option_sequence_start(lines: list[str]) -> int | None:
    starters = [
        (index, token)
        for index, line in enumerate(lines)
        if (token := extract_option_token(line)) is not None
    ]
    for start in range(len(starters) - 4):
        window = starters[start : start + 5]
        if [token for _, token in window] == ["A", "B", "C", "D", "E"]:
            return window[0][0]
    return None


def split_statement_source_command(lines: list[str]) -> tuple[str, str | None, str | None]:
    source_indexes = [i for i, line in enumerate(lines) if SOURCE_MARKER.search(line)]
    if source_indexes:
        start = source_indexes[0]
        end = source_indexes[-1]
        statement = "\n".join(lines[:start]).strip()
        source = " ".join(lines[start : end + 1]).strip()
        command = "\n".join(lines[end + 1 :]).strip() or None
        return statement, source, command

    for i, line in enumerate(lines):
        if COMMAND_MARKER.search(line):
            return "\n".join(lines[:i]).strip(), None, "\n".join(lines[i:]).strip()

    return "\n".join(lines).strip(), None, None


def extract_options(lines: list[str]) -> list[OptionOverride]:
    start_index = find_option_sequence_start(lines)
    if start_index is None:
        return []

    lines = lines[start_index:]
    options: list[OptionOverride] = []
    index = 0
    while index < len(lines):
        line = lines[index]
        token = extract_option_token(line)
        if token is None:
            index += 1
            continue

        remainder = line.split(maxsplit=1)
        content = remainder[1] if len(remainder) > 1 else ""
        content = re.sub(rf"^{token}[.)]?\s*", "", content, flags=re.IGNORECASE)
        option = token
        parts = [content.strip()]
        index += 1
        while index < len(lines) and extract_option_token(lines[index]) is None:
            parts.append(lines[index].strip())
            index += 1

        cleaned = re.sub(r"\s+", " ", " ".join(parts)).strip()
        cleaned = re.sub(r"\b\d+\s*-\s*[A-Z]{2}\s*•.*$", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\b\d+\s*/\s*\d[º°]\s*DIA.*$", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\*\d+[A-Z0-9*]+\*", "", cleaned)
        cleaned = cleaned.strip()
        if cleaned:
            options.append({"option": option.upper(), "text": cleaned})

    canonical = [option["option"] for option in options]
    return options if canonical == ["A", "B", "C", "D", "E"] else []


def build_override_from_block(block: str, confidence: str) -> QuestionOverride | None:
    lines = merge_option_letter_lines(normalize_lines(block))
    lines = [line for line in lines if not re.match(r"^QUEST[ÃA]O\s+\d+$", line)]
    start = find_option_sequence_start(lines)
    if start is None:
        return None

    head = lines[:start]
    options = extract_options(lines[start:])
    if len(options) != 5:
        return None

    statement, source, command = split_statement_source_command(head)
    parts = [part for part in [statement, f"Fonte: {source}" if source else None, command] if part]
    if not parts:
        return None

    return {
        "statement": "\n".join(parts).strip(),
        "options": options,
        "ocrText": "\n".join(lines).strip(),
        "confidence": confidence,
    }


def page_text(document: fitz.Document, page_number: int) -> str:
    return document.load_page(page_number - 1).get_text("text")


def find_question_pages(document: fitz.Document, exam_number: int, fallback_pages: list[int]) -> list[int]:
    matches: list[int] = []
    pattern = QUESTION_RE(exam_number)
    for page_number in range(1, document.page_count + 1):
        if pattern.search(page_text(document, page_number)):
            matches.append(page_number)
    return matches or fallback_pages


def extract_pdf_block(document: fitz.Document, exam_number: int, pages: list[int]) -> str:
    combined = "\n".join(page_text(document, page_number) for page_number in pages)
    start = QUESTION_RE(exam_number).search(combined)
    if not start:
      return combined
    segment = combined[start.start() :]
    next_match = None
    for match in NEXT_QUESTION_RE.finditer(segment):
        found = int(match.group(1))
        if found != exam_number:
            next_match = match
            break
    if next_match:
        segment = segment[: next_match.start()]
    return segment


def ocr_pdf_pages(document: fitz.Document, pages: list[int]) -> str:
    with tempfile.TemporaryDirectory() as tmp_dir:
        texts: list[str] = []
        for page_number in pages:
            page = document.load_page(page_number - 1)
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            image_path = Path(tmp_dir) / f"page-{page_number}.png"
            pix.save(image_path)
            result = subprocess.run(
                ["swift", str(SWIFT_OCR), str(image_path)],
                check=True,
                capture_output=True,
                text=True,
            )
            texts.append(result.stdout)
        return "\n".join(texts)


def build_overrides() -> dict:
    overrides: dict[str, dict[str, dict[str, QuestionOverride]]] = {"2023": {}}

    for area, items in SUSPECTS.items():
        overrides["2023"][area] = {}
        for item in items:
            document = fitz.open(PDFS[item["pdf"]])
            pages = find_question_pages(document, item["exam"], item["fallback_pages"])
            candidate_pages = sorted(set(pages + [page + 1 for page in pages if page < document.page_count]))

            pdf_block = extract_pdf_block(document, item["exam"], candidate_pages)
            override = build_override_from_block(pdf_block, "pdf_text")

            if override is None:
                ocr_text = ocr_pdf_pages(document, candidate_pages)
                q_match = QUESTION_RE(item["exam"]).search(clean_text(ocr_text))
                ocr_block = clean_text(ocr_text)[q_match.start() :] if q_match else ocr_text
                override = build_override_from_block(ocr_block, "pdf_ocr")

            if override is not None:
                overrides["2023"][area][str(item["id"])] = override

    return overrides


def main() -> None:
    overrides = build_overrides()
    OUTPUT_PATH.write_text(json.dumps(overrides, ensure_ascii=False, indent=2))
    total = sum(len(items) for items in overrides["2023"].values())
    print(f"Wrote {OUTPUT_PATH}")
    print(f"Recovered from PDF/OCR: {total}")


if __name__ == "__main__":
    main()
