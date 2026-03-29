#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import shutil
from collections import deque
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

try:
    import fitz
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "PyMuPDF não está instalado. Rode `python3 -m pip install pymupdf` antes."
    ) from exc

try:
    from PIL import Image
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "Pillow não está instalado. Rode `python3 -m pip install pillow` antes."
    ) from exc


DEFAULT_QUESTION_START = 136
DEFAULT_QUESTION_END = 180
DEFAULT_YEAR = 2024
DEFAULT_AREA_LABEL = "Matemática"
DEFAULT_AREA_SLUG = "math"
OPTION_LABELS = ("A", "B", "C", "D", "E")
CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b-\x1f\x7f]")
QUESTION_HEADER_RE = re.compile(r"^QUESTÃO\s+(\d{1,3})$", re.IGNORECASE)
BOOKLET_NUMBER_RE = re.compile(r"CD\s*0*(\d{1,2})", re.IGNORECASE)
QUESTION_RANGE_RE = re.compile(r"^Questões de \d{1,3} a \d{1,3}", re.IGNORECASE)
SENTENCE_END_RE = re.compile(r"[.!?…:]$")
TEXT_WRAP_GAP = 18
IMAGE_PADDING_X = 16
IMAGE_PADDING_Y = 24
IMAGE_RENDER_SCALE = 2.4
STRUCTURED_PADDING_X = 10
STRUCTURED_PADDING_Y = 14
FORMULA_PADDING_X = 6
FORMULA_PADDING_TOP = 0
FORMULA_PADDING_BOTTOM = 0
OPTION_FORMULA_PADDING_BOTTOM = 16
ALPHABET_MAPPING_PADDING_Y = 4
TEXT_BLOCK_MASK_PADDING = 0
SUPPORTED_SUPERSCRIPT_CHARS = str.maketrans("0123456789+-=()", "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾")
SUPPORTED_SUBSCRIPT_CHARS = str.maketrans("0123456789+-=()", "₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎")


@dataclass
class TextBlock:
    page_index: int
    bbox: tuple[float, float, float, float]
    lines: list[dict[str, Any]]
    text: str


@dataclass
class ImageBlock:
    page_index: int
    bbox: tuple[float, float, float, float]


@dataclass
class OptionContent:
    option: str
    text_parts: list[str] = field(default_factory=list)
    assets: list[str] = field(default_factory=list)

    def append_text(self, value: str) -> None:
        normalized = normalize_text(value)
        if normalized:
            self.text_parts.append(normalized)

    def to_dict(self) -> dict[str, Any]:
        return {
            "option": self.option,
            "text": " ".join(self.text_parts).strip(),
            "assets": self.assets,
        }


@dataclass
class QuestionContent:
    exam_question_number: int
    id: int
    source_pages: set[int] = field(default_factory=set)
    items: list[TextBlock | ImageBlock] = field(default_factory=list)


def normalize_text(value: str) -> str:
    value = CONTROL_CHARS_RE.sub(" ", value.replace("\u00a0", " "))
    lines = []
    for line in value.splitlines():
        compact = " ".join(line.split())
        if compact:
            lines.append(compact)
    return "\n".join(lines).strip()


def normalize_span_text(value: str) -> str:
    return " ".join(
        CONTROL_CHARS_RE.sub(" ", value.replace("\u00a0", " ").replace("\t", " ")).split()
    ).strip()


def is_noise_text(text: str) -> bool:
    if not text:
        return True
    if text.startswith("*020325AZ"):
        return True
    if re.match(r"ENEM20\d{2}ENEM20\d{2}", text):
        return True
    if "CADERNO" in text and "ENEM" in text:
        return True
    if QUESTION_RANGE_RE.match(text):
        return True
    if (
        "LINGUAGENS, CÓDIGOS E SUAS TECNOLOGIAS" in text
        or "CIÊNCIAS HUMANAS E SUAS TECNOLOGIAS" in text
        or "CIÊNCIAS DA NATUREZA E SUAS TECNOLOGIAS" in text
        or "MATEMÁTICA E SUAS TECNOLOGIAS" in text
    ):
        return True
    if re.fullmatch(r"\d{1,2}", text):
        return True
    if re.fullmatch(r"(?:\d+\s*){1,4}", text.replace("\n", " ").strip()):
        return True
    return False


def is_noise_image(bbox: tuple[float, float, float, float], page_rect: fitz.Rect) -> bool:
    x0, y0, x1, y1 = bbox
    width = x1 - x0
    height = y1 - y0
    if width < 25 and height > page_rect.height * 0.8:
        return True
    if x0 < 15 and width < 25:
        return True
    if x1 > page_rect.width - 10 and width < 40 and height > page_rect.height * 0.8:
        return True
    return False


def block_text(block: dict[str, Any]) -> str:
    lines = []
    for line in block.get("lines", []):
        spans = reconstruct_line_spans(line.get("spans", []))
        normalized = normalize_text(spans)
        if normalized:
            lines.append(normalized)
    return "\n".join(merge_fraction_lines(lines)).strip()


def is_option_block(block: TextBlock) -> bool:
    line_spans = block_line_spans(block)
    if not line_spans:
        return False

    first_line = line_spans[0]
    first_label = normalize_span_text(first_line[0].get("text", ""))
    if first_label not in OPTION_LABELS:
        return False

    if is_alphabet_mapping_block(block):
        return False

    return True


def is_alphabet_mapping_block(block: TextBlock) -> bool:
    lines = block_line_spans(block)
    if not lines:
        return False

    flattened = [
        normalize_span_text(span.get("text", ""))
        for spans in lines
        for span in spans
        if normalize_span_text(span.get("text", ""))
    ]
    if len(flattened) < 10:
        return False

    single_upper_tokens = [
        token for token in flattened if len(token) == 1 and token in "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    ]
    if len(single_upper_tokens) < 8:
        return False

    joined = " ".join(flattened)
    return "Letra do texto" in joined


def block_line_spans(block: TextBlock) -> list[list[dict[str, Any]]]:
    return [
        [span for span in line.get("spans", []) if normalize_span_text(span.get("text", ""))]
        for line in block.lines
        if any(normalize_span_text(span.get("text", "")) for span in line.get("spans", []))
    ]


def reconstruct_line_spans(spans: list[dict[str, Any]]) -> str:
    filtered = [span for span in spans if normalize_span_text(span.get("text", ""))]
    if not filtered:
        return ""

    ordered = sorted(filtered, key=lambda span: float(span["bbox"][0]))
    pieces: list[str] = []
    previous_span: dict[str, Any] | None = None

    for span in ordered:
        text = normalize_span_text(span.get("text", ""))
        raw_text = span.get("text", "")
        if not text:
            continue

        if previous_span is None:
            pieces.append(text)
            previous_span = span
            continue

        previous_raw_text = previous_span.get("text", "")
        current_x0 = float(span["bbox"][0])
        previous_x1 = float(previous_span["bbox"][2])
        current_y0 = float(span["bbox"][1])
        previous_y0 = float(previous_span["bbox"][1])
        current_size = float(span.get("size", 0) or 0)
        previous_size = float(previous_span.get("size", 0) or 0)

        if (
            current_size > 0
            and previous_size > 0
            and current_size <= previous_size - 2
            and current_x0 - previous_x1 <= 10
        ):
            translated = text
            if current_y0 < previous_y0 - 0.4:
                translated = text.translate(SUPPORTED_SUPERSCRIPT_CHARS)
            elif current_y0 > previous_y0 + 0.4:
                translated = text.translate(SUPPORTED_SUBSCRIPT_CHARS)
            pieces.append(translated)
            previous_span = span
            continue

        if should_insert_space_between(
            previous_span,
            span,
            pieces[-1],
            text,
            previous_raw_text,
            raw_text,
        ):
            pieces.append(" ")

        pieces.append(text)
        previous_span = span

    return "".join(pieces).strip()


def should_insert_space_between(
    previous_span: dict[str, Any],
    current_span: dict[str, Any],
    previous_text: str,
    current_text: str,
    previous_raw_text: str,
    current_raw_text: str,
) -> bool:
    if previous_raw_text.endswith((" ", "\t")) or current_raw_text.startswith((" ", "\t")):
        return True

    gap = float(current_span["bbox"][0]) - float(previous_span["bbox"][2])
    if gap <= 1.5:
        return False

    if previous_text.endswith(("(", "/", "√")):
        return False
    if previous_text.endswith("•"):
        return True
    if current_text.startswith((")", ",", ".", ";", ":", "/", "²", "³")):
        return False

    return True


def merge_fraction_lines(lines: list[str]) -> list[str]:
    merged: list[str] = []
    index = 0
    while index < len(lines):
        current = lines[index]
        if index + 1 < len(lines):
            candidate = join_fraction_pair(current, lines[index + 1])
            if candidate is not None:
                merged.append(candidate)
                index += 2
                continue

        merged.append(current)
        index += 1

    return merged


def join_fraction_pair(current: str, following: str) -> str | None:
    if QUESTION_HEADER_RE.match(current.strip()):
        return None

    current_match = re.match(r"^(.*?)(\d+)\s*$", current)
    following_match = re.match(r"^(\d+)(.*)$", following)
    if not current_match or not following_match:
        return None

    prefix, numerator = current_match.groups()
    denominator, suffix = following_match.groups()

    if len(denominator) > 2:
        return None

    prefix_words = prefix.strip().split()
    if prefix and len(prefix_words) > 8:
        return None

    return f"{prefix}{numerator}/{denominator}{suffix}".strip()


def is_bullet_span_text(value: str) -> bool:
    normalized = normalize_text(value)
    return normalized.startswith(("•", "-", "–", "—"))


def is_bullet_list_block(block: TextBlock) -> bool:
    lines = block_line_spans(block)
    if not lines:
        return False

    bullet_lines = 0
    for spans in lines:
        first_text = spans[0].get("text", "") if spans else ""
        if is_bullet_span_text(first_text):
            bullet_lines += 1

    return bullet_lines >= 1 and bullet_lines == len(lines)


def count_option_labels_in_block(block: TextBlock) -> int:
    count = 0
    for spans in block_line_spans(block):
        first_text = normalize_span_text(spans[0].get("text", "")) if spans else ""
        if first_text in OPTION_LABELS:
            count += 1
    return count


def distinct_column_starts(block: TextBlock) -> list[float]:
    columns: list[float] = []
    for spans in block_line_spans(block):
        if not spans:
            continue

        x0 = float(spans[0]["bbox"][0])
        if not any(abs(existing - x0) <= 18 for existing in columns):
            columns.append(x0)

    return sorted(columns)


def has_wide_span_gaps(spans: list[dict[str, Any]], min_gap: float = 18) -> bool:
    if len(spans) < 2:
        return False

    ordered = sorted(spans, key=lambda span: float(span["bbox"][0]))
    for previous, current in zip(ordered, ordered[1:]):
        previous_x1 = float(previous["bbox"][2])
        current_x0 = float(current["bbox"][0])
        if current_x0 - previous_x1 >= min_gap:
            return True

    return False


def block_contains_control_characters(block: TextBlock) -> bool:
    return any(CONTROL_CHARS_RE.search(span.get("text", "")) for spans in block_line_spans(block) for span in spans)


def block_has_math_layout(block: TextBlock) -> bool:
    if is_bullet_list_block(block):
        return False

    lines = block_line_spans(block)
    if not lines:
        return False

    small_offset_spans = 0
    for spans in lines:
        ordered = sorted(spans, key=lambda span: float(span["bbox"][0]))
        for previous, current in zip(ordered, ordered[1:]):
            previous_size = float(previous.get("size", 0) or 0)
            current_size = float(current.get("size", 0) or 0)
            if (
                previous_size > 0
                and current_size > 0
                and current_size <= previous_size - 2
                and float(current["bbox"][0]) - float(previous["bbox"][2]) <= 10
            ):
                small_offset_spans += 1

    width = block.bbox[2] - block.bbox[0]
    line_count = len(lines)
    single_char_spans = sum(
        1
        for spans in lines
        for span in spans
        if len(normalize_span_text(span.get("text", ""))) <= 2
    )
    total_spans = sum(len(spans) for spans in lines)

    if block_contains_control_characters(block):
        return True
    if small_offset_spans >= 1:
        return True
    if width < 150 and line_count >= 2 and single_char_spans >= max(3, total_spans - 1):
        return True

    return False


def block_has_small_attached_spans(block: TextBlock) -> bool:
    lines = block_line_spans(block)
    for spans in lines:
        ordered = sorted(spans, key=lambda span: float(span["bbox"][0]))
        for previous, current in zip(ordered, ordered[1:]):
            previous_size = float(previous.get("size", 0) or 0)
            current_size = float(current.get("size", 0) or 0)
            if (
                previous_size > 0
                and current_size > 0
                and current_size <= previous_size - 2
                and float(current["bbox"][0]) - float(previous["bbox"][2]) <= 10
            ):
                return True
    return False


def is_table_like_option_row(block: TextBlock) -> bool:
    lines = block_line_spans(block)
    if not lines:
        return False

    first_label = normalize_span_text(lines[0][0].get("text", ""))
    if first_label not in (*OPTION_LABELS, "F"):
        return False

    width = block.bbox[2] - block.bbox[0]
    if width > 220:
        return False

    if len(lines) > 2:
        return False

    combined_text = normalize_text(block.text)
    return bool(re.search(r"\b\d", combined_text))


def is_standalone_formula_block(block: TextBlock) -> bool:
    if not block_has_math_layout(block) and not is_formula_token_block(block):
        return False
    if is_option_block(block) or is_bullet_list_block(block):
        return False

    width = block.bbox[2] - block.bbox[0]
    line_count = len(block_line_spans(block))
    text_length = len(normalize_text(block.text))
    alpha_count = sum(ch.isalpha() for ch in normalize_text(block.text))
    if alpha_count > 24 and text_length > 40:
        return False

    return width < 180 or text_length < 28 or (line_count >= 3 and alpha_count <= 12)


def is_formula_token_block(block: TextBlock) -> bool:
    if is_option_block(block) or is_bullet_list_block(block):
        return False

    width = block.bbox[2] - block.bbox[0]
    text = normalize_text(block.text)
    alpha_count = sum(ch.isalpha() for ch in text)
    contains_math_signal = any(token in text for token in ("/", "=", "log", "π"))
    contains_digit = any(ch.isdigit() for ch in text)

    return (
        width < 100
        and len(text) <= 12
        and alpha_count <= 3
        and (contains_math_signal or contains_digit)
    )


def option_has_math_continuation(
    items: list[TextBlock | ImageBlock],
    start_index: int,
) -> bool:
    if start_index + 1 >= len(items):
        return False

    current = items[start_index]
    candidate = items[start_index + 1]
    if not isinstance(current, TextBlock) or not isinstance(candidate, TextBlock):
        return False
    if candidate.page_index != current.page_index:
        return False
    if is_option_block(candidate):
        return False
    if vertical_gap(current, candidate) > TEXT_WRAP_GAP:
        return False

    return is_standalone_formula_block(candidate) or is_formula_token_block(candidate)


def is_option_formula_asset_block(
    items: list[TextBlock | ImageBlock],
    index: int,
) -> bool:
    current = items[index]
    if not isinstance(current, TextBlock) or not is_option_block(current):
        return False
    if count_option_labels_in_block(current) > 1:
        return False

    text = normalize_text(current.text).lower()
    if option_has_math_continuation(items, index):
        return True
    if block_contains_control_characters(current):
        return True
    if len(block_line_spans(current)) >= 2 and block_has_math_layout(current):
        return True
    if block_has_small_attached_spans(current) and any(
        marker in text for marker in ["será", "igual a", "expressão", "área", "volume"]
    ):
        return True

    return False


def is_structured_figure_anchor(block: TextBlock) -> bool:
    if is_alphabet_mapping_block(block):
        return True
    if is_option_block(block):
        return False
    if is_bullet_list_block(block):
        return False
    if block_has_math_layout(block) or is_formula_token_block(block):
        return False

    lines = block_line_spans(block)
    if not lines:
        return False

    wide_gap_lines = sum(1 for spans in lines if has_wide_span_gaps(spans))
    if wide_gap_lines >= 1:
        return True

    columns = distinct_column_starts(block)
    if len(columns) >= 3:
        return True

    return len(columns) >= 2 and len(lines) >= 3


def is_compact_structured_block(block: TextBlock) -> bool:
    if is_option_block(block):
        return False
    if is_bullet_list_block(block):
        return False

    lines = [normalize_text("".join(span.get("text", "") for span in spans)) for spans in block_line_spans(block)]
    if not lines:
        return False

    if len(lines) > 4:
        return False

    if max(len(line) for line in lines) > 42:
        return False

    joined = " ".join(lines).strip()
    if not joined:
        return False

    return not SENTENCE_END_RE.search(joined)


def vertical_gap(previous: TextBlock, current: TextBlock) -> float:
    return current.bbox[1] - previous.bbox[3]


def should_merge_text_blocks(previous: TextBlock | None, current: TextBlock) -> bool:
    if previous is None:
        return False
    if previous.page_index != current.page_index:
        return False
    return vertical_gap(previous, current) <= TEXT_WRAP_GAP


def collect_adjacent_math_blocks(
    items: list[TextBlock | ImageBlock],
    start_index: int,
) -> tuple[list[TextBlock], int]:
    first = items[start_index]
    if not isinstance(first, TextBlock):
        return [], start_index

    blocks = [first]
    index = start_index + 1
    while index < len(items):
        candidate = items[index]
        if not isinstance(candidate, TextBlock):
            break
        if candidate.page_index != blocks[-1].page_index:
            break
        if is_option_block(candidate):
            break
        if not (
            is_standalone_formula_block(candidate) or is_formula_token_block(candidate)
        ):
            break
        if vertical_gap(blocks[-1], candidate) > TEXT_WRAP_GAP:
            break
        blocks.append(candidate)
        index += 1

    return blocks, index


def has_structured_anchor_ahead(items: list[TextBlock | ImageBlock], start_index: int) -> bool:
    current = items[start_index]
    if not isinstance(current, TextBlock):
        return False

    lookahead_index = start_index + 1
    compact_seen = 0
    while lookahead_index < len(items) and compact_seen < 3:
        candidate = items[lookahead_index]
        if not isinstance(candidate, TextBlock):
            return False
        if candidate.page_index != current.page_index:
            return False
        if is_option_block(candidate):
            return False
        if vertical_gap(current, candidate) > 20:
            return False
        if is_structured_figure_anchor(candidate):
            return True
        if not is_compact_structured_block(candidate):
            return False

        current = candidate
        compact_seen += 1
        lookahead_index += 1

    return False


def union_bboxes(blocks: list[TextBlock]) -> tuple[float, float, float, float]:
    return (
        min(block.bbox[0] for block in blocks),
        min(block.bbox[1] for block in blocks),
        max(block.bbox[2] for block in blocks),
        max(block.bbox[3] for block in blocks),
    )


def union_item_bboxes(items: list[TextBlock | ImageBlock]) -> tuple[float, float, float, float]:
    return (
        min(item.bbox[0] for item in items),
        min(item.bbox[1] for item in items),
        max(item.bbox[2] for item in items),
        max(item.bbox[3] for item in items),
    )


def parse_option_block(block: TextBlock) -> list[OptionContent]:
    options: list[OptionContent] = []
    current: OptionContent | None = None

    for line in block.lines:
        spans = [span for span in line.get("spans", []) if normalize_span_text(span.get("text", ""))]
        if not spans:
            continue

        first_label = normalize_span_text(spans[0].get("text", ""))
        if first_label in OPTION_LABELS:
            current = OptionContent(option=first_label)
            remainder = reconstruct_line_spans(spans[1:])
            if remainder:
                current.append_text(remainder)
            options.append(current)
            continue

        line_text = reconstruct_line_spans(spans)
        if current is None:
            return []
        if line_text:
            current.append_text(line_text)

    return options


def extract_image(
    document: fitz.Document,
    page_index: int,
    bbox: tuple[float, float, float, float],
    absolute_output_path: Path,
    *,
    padding_x: float = IMAGE_PADDING_X,
    padding_y: float = IMAGE_PADDING_Y,
    padding_left: float | None = None,
    padding_right: float | None = None,
    padding_top: float | None = None,
    padding_bottom: float | None = None,
    render_scale: float = IMAGE_RENDER_SCALE,
    trim_edge_artifacts: bool = False,
    dominant_band_padding: int | None = None,
) -> None:
    page = document[page_index]
    clip = build_clip_rect(
        page=page,
        bbox=bbox,
        padding_x=padding_x,
        padding_y=padding_y,
        padding_left=padding_left,
        padding_right=padding_right,
        padding_top=padding_top,
        padding_bottom=padding_bottom,
    )

    pixmap = page.get_pixmap(
        matrix=fitz.Matrix(render_scale, render_scale),
        clip=clip,
        alpha=False,
    )
    absolute_output_path.parent.mkdir(parents=True, exist_ok=True)
    pixmap.save(absolute_output_path)
    if trim_edge_artifacts:
        trim_image_edge_artifacts(
            absolute_output_path,
            dominant_band_padding=dominant_band_padding,
        )


def build_clip_rect(
    *,
    page: fitz.Page,
    bbox: tuple[float, float, float, float],
    padding_x: float,
    padding_y: float,
    padding_left: float | None = None,
    padding_right: float | None = None,
    padding_top: float | None = None,
    padding_bottom: float | None = None,
) -> fitz.Rect:
    page_rect = page.rect
    clip = fitz.Rect(bbox)
    left = padding_x if padding_left is None else padding_left
    right = padding_x if padding_right is None else padding_right
    top = padding_y if padding_top is None else padding_top
    bottom = padding_y if padding_bottom is None else padding_bottom
    clip.x0 = max(page_rect.x0, clip.x0 - left)
    clip.y0 = max(page_rect.y0, clip.y0 - top)
    clip.x1 = min(page_rect.x1, clip.x1 + right)
    clip.y1 = min(page_rect.y1, clip.y1 + bottom)
    return clip


def trim_image_edge_artifacts(
    image_path: Path,
    threshold: int = 245,
    padding: int = 2,
    dominant_band_padding: int | None = None,
) -> None:
    original = Image.open(image_path).convert("RGB")
    grayscale = original.convert("L")
    width, height = grayscale.size
    pixels = grayscale.load()
    visited: set[tuple[int, int]] = set()
    kept_bboxes: list[tuple[int, int, int, int]] = []

    for y in range(height):
        for x in range(width):
            if (x, y) in visited or pixels[x, y] >= threshold:
                continue

            queue = deque([(x, y)])
            visited.add((x, y))
            min_x = max_x = x
            min_y = max_y = y
            touches_edge = x == 0 or y == 0 or x == width - 1 or y == height - 1

            while queue:
                current_x, current_y = queue.popleft()
                min_x = min(min_x, current_x)
                max_x = max(max_x, current_x)
                min_y = min(min_y, current_y)
                max_y = max(max_y, current_y)

                for delta_x, delta_y in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    next_x = current_x + delta_x
                    next_y = current_y + delta_y
                    if not (0 <= next_x < width and 0 <= next_y < height):
                        continue
                    if (next_x, next_y) in visited or pixels[next_x, next_y] >= threshold:
                        continue
                    if (
                        next_x == 0
                        or next_y == 0
                        or next_x == width - 1
                        or next_y == height - 1
                    ):
                        touches_edge = True
                    visited.add((next_x, next_y))
                    queue.append((next_x, next_y))

            if not touches_edge:
                kept_bboxes.append((min_x, min_y, max_x, max_y))

    if not kept_bboxes:
        return

    crop_x0 = max(0, min(bbox[0] for bbox in kept_bboxes) - padding)
    crop_y0 = max(0, min(bbox[1] for bbox in kept_bboxes) - padding)
    crop_x1 = min(width, max(bbox[2] for bbox in kept_bboxes) + padding + 1)
    crop_y1 = min(height, max(bbox[3] for bbox in kept_bboxes) + padding + 1)

    cropped = original.crop((crop_x0, crop_y0, crop_x1, crop_y1))
    if dominant_band_padding is not None:
        cropped = crop_to_dominant_ink_band(
            cropped,
            axis="y",
            threshold=threshold,
            padding=dominant_band_padding,
        )
    cropped.save(image_path)


def crop_to_dominant_ink_band(
    image: Image.Image,
    *,
    axis: str,
    threshold: int,
    padding: int,
) -> Image.Image:
    grayscale = image.convert("L")
    width, height = grayscale.size
    pixels = grayscale.load()

    if axis == "y":
        counts = [
            sum(1 for x in range(width) if pixels[x, y] < threshold)
            for y in range(height)
        ]
    else:
        counts = [
            sum(1 for y in range(height) if pixels[x, y] < threshold)
            for x in range(width)
        ]

    max_count = max(counts, default=0)
    if max_count == 0:
        return image

    active_threshold = max(4, int(max_count * 0.18))
    bands: list[tuple[int, int]] = []
    start: int | None = None

    for index, count in enumerate(counts):
        if count >= active_threshold:
            if start is None:
                start = index
            continue
        if start is not None:
            bands.append((start, index - 1))
            start = None

    if start is not None:
        bands.append((start, len(counts) - 1))

    if not bands:
        return image

    best_start, best_end = max(
        bands,
        key=lambda band: sum(counts[band[0] : band[1] + 1]),
    )

    if axis == "y":
        return image.crop(
            (
                0,
                max(0, best_start - padding),
                width,
                min(height, best_end + padding + 1),
            )
        )

    return image.crop(
        (
            max(0, best_start - padding),
            0,
            min(width, best_end + padding + 1),
            height,
        )
    )


def extract_combined_text_blocks(
    document: fitz.Document,
    blocks: list[TextBlock],
    absolute_output_path: Path,
    *,
    padding_x: float = STRUCTURED_PADDING_X,
    padding_y: float = STRUCTURED_PADDING_Y,
    padding_left: float | None = None,
    padding_right: float | None = None,
    padding_top: float | None = None,
    padding_bottom: float | None = None,
    trim_edge_artifacts: bool = False,
    dominant_band_padding: int | None = None,
    page_text_blocks: list[TextBlock] | None = None,
) -> None:
    if not blocks:
        return
    page_index = blocks[0].page_index
    page = document[page_index]
    clip = build_clip_rect(
        page=page,
        bbox=union_bboxes(blocks),
        padding_x=padding_x,
        padding_y=padding_y,
        padding_left=padding_left,
        padding_right=padding_right,
        padding_top=padding_top,
        padding_bottom=padding_bottom,
    )

    pixmap = page.get_pixmap(
        matrix=fitz.Matrix(IMAGE_RENDER_SCALE, IMAGE_RENDER_SCALE),
        clip=clip,
        alpha=False,
    )
    absolute_output_path.parent.mkdir(parents=True, exist_ok=True)
    pixmap.save(absolute_output_path)
    mask_non_target_text_blocks(
        image_path=absolute_output_path,
        clip=clip,
        target_blocks=blocks,
        page_text_blocks=page_text_blocks or blocks,
        render_scale=IMAGE_RENDER_SCALE,
    )

    if trim_edge_artifacts:
        trim_image_edge_artifacts(
            absolute_output_path,
            dominant_band_padding=dominant_band_padding,
        )


def extract_composite_blocks(
    document: fitz.Document,
    items: list[TextBlock | ImageBlock],
    absolute_output_path: Path,
    *,
    padding_x: float = STRUCTURED_PADDING_X,
    padding_y: float = STRUCTURED_PADDING_Y,
    padding_left: float | None = None,
    padding_right: float | None = None,
    padding_top: float | None = None,
    padding_bottom: float | None = None,
    page_text_blocks: list[TextBlock] | None = None,
) -> None:
    if not items:
        return

    page_index = items[0].page_index
    page = document[page_index]
    clip = build_clip_rect(
        page=page,
        bbox=union_item_bboxes(items),
        padding_x=padding_x,
        padding_y=padding_y,
        padding_left=padding_left,
        padding_right=padding_right,
        padding_top=padding_top,
        padding_bottom=padding_bottom,
    )

    pixmap = page.get_pixmap(
        matrix=fitz.Matrix(IMAGE_RENDER_SCALE, IMAGE_RENDER_SCALE),
        clip=clip,
        alpha=False,
    )
    absolute_output_path.parent.mkdir(parents=True, exist_ok=True)
    pixmap.save(absolute_output_path)

    target_text_blocks = [item for item in items if isinstance(item, TextBlock)]
    if target_text_blocks:
        mask_non_target_text_blocks(
            image_path=absolute_output_path,
            clip=clip,
            target_blocks=target_text_blocks,
            page_text_blocks=page_text_blocks or target_text_blocks,
            render_scale=IMAGE_RENDER_SCALE,
        )


def mask_non_target_text_blocks(
    *,
    image_path: Path,
    clip: fitz.Rect,
    target_blocks: list[TextBlock],
    page_text_blocks: list[TextBlock],
    render_scale: float,
    padding_px: int = TEXT_BLOCK_MASK_PADDING,
) -> None:
    image = Image.open(image_path).convert("RGB")
    unwanted_blocks = [
        block
        for block in page_text_blocks
        if block not in target_blocks and fitz.Rect(block.bbox).intersects(clip)
    ]

    if not unwanted_blocks:
        return

    for block in unwanted_blocks:
        x0 = int(round((block.bbox[0] - clip.x0) * render_scale)) - padding_px
        y0 = int(round((block.bbox[1] - clip.y0) * render_scale)) - padding_px
        x1 = int(round((block.bbox[2] - clip.x0) * render_scale)) + padding_px
        y1 = int(round((block.bbox[3] - clip.y0) * render_scale)) + padding_px

        x0 = max(0, x0)
        y0 = max(0, y0)
        x1 = min(image.width, x1)
        y1 = min(image.height, y1)

        if x1 <= x0 or y1 <= y0:
            continue

        image.paste("white", (x0, y0, x1, y1))

    image.save(image_path)


def extract_text_block_asset(
    document: fitz.Document,
    question_number: int,
    blocks: list[TextBlock],
    assets_root: Path,
    year: int,
    area_slug: str,
    prefix: str,
    index: int,
    *,
    padding_x: float = STRUCTURED_PADDING_X,
    padding_y: float = STRUCTURED_PADDING_Y,
    padding_left: float | None = None,
    padding_right: float | None = None,
    padding_top: float | None = None,
    padding_bottom: float | None = None,
    trim_edge_artifacts: bool = False,
    dominant_band_padding: int | None = None,
    page_text_blocks: list[TextBlock] | None = None,
) -> str:
    relative_asset = (
        f"/generated/enem-{year}/{area_slug}/question-{question_number}/{prefix}-{index:02d}.png"
    )
    asset_output_path = (
        assets_root / f"question-{question_number}" / f"{prefix}-{index:02d}.png"
    )
    extract_combined_text_blocks(
        document=document,
        blocks=blocks,
        absolute_output_path=asset_output_path,
        padding_x=padding_x,
        padding_y=padding_y,
        padding_left=padding_left,
        padding_right=padding_right,
        padding_top=padding_top,
        padding_bottom=padding_bottom,
        trim_edge_artifacts=trim_edge_artifacts,
        dominant_band_padding=dominant_band_padding,
        page_text_blocks=page_text_blocks,
    )
    return relative_asset


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Extrai um intervalo de questões do ENEM com texto, alternativas e assets visuais."
    )
    parser.add_argument("--pdf", required=True, help="Caminho para o PDF da prova.")
    parser.add_argument(
        "--output",
        required=True,
        help="Arquivo JSON de saída com o conteúdo extraído.",
    )
    parser.add_argument(
        "--assets-dir",
        required=True,
        help="Diretório base de saída dos assets públicos.",
    )
    parser.add_argument(
        "--question-start",
        type=int,
        default=DEFAULT_QUESTION_START,
        help="Número inicial da faixa de questões.",
    )
    parser.add_argument(
        "--question-end",
        type=int,
        default=DEFAULT_QUESTION_END,
        help="Número final da faixa de questões.",
    )
    parser.add_argument(
        "--year",
        type=int,
        default=DEFAULT_YEAR,
        help="Ano da prova usado no JSON gerado.",
    )
    parser.add_argument(
        "--area-label",
        default=DEFAULT_AREA_LABEL,
        help="Nome da área exibido no payload final.",
    )
    parser.add_argument(
        "--area-slug",
        default=DEFAULT_AREA_SLUG,
        help="Slug da área usado nos caminhos públicos dos assets.",
    )
    return parser


def infer_booklet_number(pdf_path: Path) -> int | None:
    match = BOOKLET_NUMBER_RE.search(pdf_path.stem)
    if not match:
        return None
    return int(match.group(1))


def collect_questions(
    document: fitz.Document,
    *,
    question_start: int,
    question_end: int,
) -> dict[int, QuestionContent]:
    questions: dict[int, QuestionContent] = {}
    current_question: QuestionContent | None = None

    for page_index in range(document.page_count):
        page = document[page_index]
        page_rect = page.rect
        data = page.get_text("dict")

        for raw_block in data.get("blocks", []):
            bbox = tuple(float(value) for value in raw_block["bbox"])
            block_type = raw_block["type"]

            if block_type == 0:
                text = block_text(raw_block)
                text_lines = text.splitlines()
                header_matches: list[tuple[int, re.Match[str]]] = []
                for index, line in enumerate(text_lines):
                    candidate = QUESTION_HEADER_RE.match(line.strip())
                    if candidate:
                        header_matches.append((index, candidate))

                if header_matches:
                    raw_lines = raw_block.get("lines", [])
                    for match_index, (header_index, match) in enumerate(header_matches):
                        question_number = int(match.group(1))
                        next_header_index = (
                            header_matches[match_index + 1][0]
                            if match_index + 1 < len(header_matches)
                            else len(text_lines)
                        )

                        if not (question_start <= question_number <= question_end):
                            continue

                        existing_question = questions.get(question_number)
                        if existing_question and existing_question.items:
                            current_question = None
                            continue

                        current_question = questions.setdefault(
                            question_number,
                            QuestionContent(
                                exam_question_number=question_number,
                                id=(question_number - question_start) + 1,
                            ),
                        )
                        current_question.source_pages.add(page_index + 1)
                        remaining_text = "\n".join(text_lines[header_index + 1 : next_header_index]).strip()
                        remaining_lines = raw_lines[header_index + 1 : next_header_index]
                        if remaining_text:
                            current_question.items.append(
                                TextBlock(
                                    page_index=page_index,
                                    bbox=bbox,
                                    lines=remaining_lines,
                                    text=remaining_text,
                                )
                            )
                    continue

                if is_noise_text(text):
                    continue

                if current_question is None:
                    continue

                current_question.source_pages.add(page_index + 1)
                current_question.items.append(
                    TextBlock(
                        page_index=page_index,
                        bbox=bbox,
                        lines=raw_block.get("lines", []),
                        text=text,
                    )
                )
                continue

            if current_question is None:
                continue

            if is_noise_image(bbox, page_rect):
                continue

            current_question.source_pages.add(page_index + 1)
            current_question.items.append(ImageBlock(page_index=page_index, bbox=bbox))

    return questions


def collect_page_text_blocks(document: fitz.Document, page_index: int) -> list[TextBlock]:
    page = document[page_index]
    data = page.get_text("dict")
    page_blocks: list[TextBlock] = []

    for raw_block in data.get("blocks", []):
        if raw_block.get("type") != 0:
            continue

        text = block_text(raw_block)
        if not text:
            continue

        page_blocks.append(
            TextBlock(
                page_index=page_index,
                bbox=tuple(float(value) for value in raw_block["bbox"]),
                lines=raw_block.get("lines", []),
                text=text,
            )
        )

    return page_blocks


def materialize_question(
    document: fitz.Document,
    question: QuestionContent,
    assets_root: Path,
    *,
    area_label: str,
    area_slug: str,
    year: int,
) -> dict[str, Any]:
    statement_parts: list[str] = []
    statement_assets: list[str] = []
    options: dict[str, OptionContent] = {}
    current_option: OptionContent | None = None
    previous_statement_block: TextBlock | None = None
    statement_image_index = 0
    option_image_index: dict[str, int] = {label: 0 for label in OPTION_LABELS}
    page_text_blocks_cache: dict[int, list[TextBlock]] = {}

    def page_text_blocks(page_index: int) -> list[TextBlock]:
        cached = page_text_blocks_cache.get(page_index)
        if cached is not None:
            return cached

        blocks = collect_page_text_blocks(document, page_index)
        page_text_blocks_cache[page_index] = blocks
        return blocks

    def safe_bottom_padding(blocks: list[TextBlock], desired_padding: float) -> float:
        if not blocks:
            return desired_padding

        page_index = blocks[0].page_index
        block_bottom = max(block.bbox[3] for block in blocks)
        next_starts = [
            candidate.bbox[1]
            for candidate in page_text_blocks(page_index)
            if candidate.bbox[1] > block_bottom + 0.5
        ]

        if not next_starts:
            return desired_padding

        next_start = min(next_starts)
        return max(0.0, min(desired_padding, next_start - block_bottom - 1.0))

    def attached_figure_images(start_index: int, anchor_blocks: list[TextBlock]) -> tuple[list[ImageBlock], int]:
        if not anchor_blocks:
            return [], start_index

        images: list[ImageBlock] = []
        index = start_index
        anchor_bottom = max(block.bbox[3] for block in anchor_blocks)
        anchor_page = anchor_blocks[0].page_index

        while index < len(question.items):
            candidate = question.items[index]
            if isinstance(candidate, TextBlock):
                if candidate.page_index != anchor_page:
                    break
                if candidate.bbox[1] - anchor_bottom > 18:
                    break
                break

            if candidate.page_index != anchor_page:
                break
            if candidate.bbox[1] - anchor_bottom > 24:
                break

            images.append(candidate)
            index += 1

        return images, index

    index = 0
    while index < len(question.items):
        item = question.items[index]

        if isinstance(item, TextBlock):
            if (
                is_compact_structured_block(item)
                and has_structured_anchor_ahead(question.items, index)
            ) or is_structured_figure_anchor(item):
                figure_blocks: list[TextBlock] = []
                anchor_seen = False
                while index < len(question.items):
                    candidate = question.items[index]
                    if not isinstance(candidate, TextBlock):
                        break
                    if candidate.page_index != item.page_index:
                        break
                    if is_option_block(candidate) and not (
                        anchor_seen and is_table_like_option_row(candidate)
                    ):
                        break

                    if is_structured_figure_anchor(candidate):
                        figure_blocks.append(candidate)
                        anchor_seen = True
                        index += 1
                        continue

                    if anchor_seen and is_table_like_option_row(candidate):
                        figure_blocks.append(candidate)
                        index += 1
                        continue

                    if (
                        is_compact_structured_block(candidate)
                        and (
                            not figure_blocks
                            or vertical_gap(figure_blocks[-1], candidate) <= 20
                        )
                    ):
                        figure_blocks.append(candidate)
                        index += 1
                        continue

                    if anchor_seen:
                        break

                    break

                if figure_blocks and anchor_seen:
                    relative_asset = ""
                    if current_option is None:
                        statement_image_index += 1
                        relative_asset = (
                            f"/generated/enem-{year}/{area_slug}/question-{question.exam_question_number}/"
                            f"statement-{statement_image_index:02d}.png"
                        )
                        asset_output_path = (
                            assets_root
                            / f"question-{question.exam_question_number}"
                            / f"statement-{statement_image_index:02d}.png"
                        )
                    else:
                        option_image_index[current_option.option] += 1
                        relative_asset = (
                            f"/generated/enem-{year}/{area_slug}/question-{question.exam_question_number}/"
                            f"option-{current_option.option.lower()}-{option_image_index[current_option.option]:02d}.png"
                        )
                        asset_output_path = (
                            assets_root
                            / f"question-{question.exam_question_number}"
                            / f"option-{current_option.option.lower()}-{option_image_index[current_option.option]:02d}.png"
                        )
                    attached_images, next_index = attached_figure_images(index, figure_blocks)
                    if attached_images:
                        extract_composite_blocks(
                            document=document,
                            items=[*figure_blocks, *attached_images],
                            absolute_output_path=asset_output_path,
                            padding_y=(
                                ALPHABET_MAPPING_PADDING_Y
                                if any(is_alphabet_mapping_block(block) for block in figure_blocks)
                                else STRUCTURED_PADDING_Y
                            ),
                            page_text_blocks=page_text_blocks(figure_blocks[0].page_index),
                        )
                        index = next_index
                    else:
                        extract_combined_text_blocks(
                            document=document,
                            blocks=figure_blocks,
                            absolute_output_path=asset_output_path,
                            padding_y=(
                                ALPHABET_MAPPING_PADDING_Y
                                if any(is_alphabet_mapping_block(block) for block in figure_blocks)
                                else STRUCTURED_PADDING_Y
                            ),
                            page_text_blocks=page_text_blocks(figure_blocks[0].page_index),
                        )

                    if current_option is None:
                        statement_assets.append(relative_asset)
                        previous_statement_block = None
                    else:
                        current_option.assets.append(relative_asset)
                    continue

            if is_option_block(item):
                if is_option_formula_asset_block(question.items, index):
                    first_label = normalize_span_text(
                        item.lines[0].get("spans", [{}])[0].get("text", "")
                    )
                    if first_label in OPTION_LABELS:
                        math_blocks, next_index = collect_adjacent_math_blocks(
                            question.items,
                            index,
                        )
                        current_option = options.setdefault(
                            first_label,
                            OptionContent(option=first_label),
                        )
                        option_image_index[current_option.option] += 1
                        relative_asset = extract_text_block_asset(
                            document=document,
                            question_number=question.exam_question_number,
                            blocks=math_blocks,
                            assets_root=assets_root,
                            year=year,
                            area_slug=area_slug,
                            prefix=f"option-{current_option.option.lower()}",
                            index=option_image_index[current_option.option],
                            padding_x=FORMULA_PADDING_X,
                            padding_top=FORMULA_PADDING_TOP,
                            padding_bottom=safe_bottom_padding(
                                math_blocks,
                                OPTION_FORMULA_PADDING_BOTTOM,
                            ),
                        )
                        current_option.assets.append(relative_asset)
                        index = next_index
                        continue

                parsed_options = parse_option_block(item)
                if not parsed_options:
                    target = current_option if current_option else None
                    if target is None:
                        if should_merge_text_blocks(previous_statement_block, item):
                            statement_parts[-1] = f"{statement_parts[-1]}\n{item.text}"
                        else:
                            statement_parts.append(item.text)
                        previous_statement_block = item
                    else:
                        target.append_text(item.text)
                    index += 1
                    continue

                for parsed in parsed_options:
                    current_option = options.setdefault(
                        parsed.option, OptionContent(option=parsed.option)
                    )
                    for text_part in parsed.text_parts:
                        current_option.append_text(text_part)
                previous_statement_block = None
                index += 1
                continue

            if current_option is None and is_standalone_formula_block(item):
                math_blocks, next_index = collect_adjacent_math_blocks(
                    question.items,
                    index,
                )
                statement_image_index += 1
                relative_asset = extract_text_block_asset(
                    document=document,
                    question_number=question.exam_question_number,
                    blocks=math_blocks,
                    assets_root=assets_root,
                    year=year,
                    area_slug=area_slug,
                    prefix="statement",
                    index=statement_image_index,
                    padding_x=FORMULA_PADDING_X,
                    padding_top=FORMULA_PADDING_TOP,
                    padding_bottom=FORMULA_PADDING_BOTTOM,
                    page_text_blocks=page_text_blocks(math_blocks[0].page_index),
                )
                statement_assets.append(relative_asset)
                previous_statement_block = None
                index = next_index
                continue

            if current_option is None:
                if should_merge_text_blocks(previous_statement_block, item):
                    statement_parts[-1] = f"{statement_parts[-1]}\n{item.text}"
                else:
                    statement_parts.append(item.text)
                previous_statement_block = item
            else:
                if item.text.strip() in {".", ",", ";", ":"} and current_option.assets:
                    index += 1
                    continue
                current_option.append_text(item.text)
            index += 1
            continue

        if current_option is None:
            statement_image_index += 1
            relative_asset = (
                f"/generated/enem-{year}/{area_slug}/question-{question.exam_question_number}/"
                f"statement-{statement_image_index:02d}.png"
            )
            asset_output_path = (
                assets_root
                / f"question-{question.exam_question_number}"
                / f"statement-{statement_image_index:02d}.png"
            )
            extract_image(
                document,
                item.page_index,
                item.bbox,
                asset_output_path,
            )
            statement_assets.append(relative_asset)
            previous_statement_block = None
            index += 1
            continue

        option_image_index[current_option.option] += 1
        relative_asset = (
            f"/generated/enem-{year}/{area_slug}/question-{question.exam_question_number}/"
            f"option-{current_option.option.lower()}-{option_image_index[current_option.option]:02d}.png"
        )
        asset_output_path = (
            assets_root
            / f"question-{question.exam_question_number}"
            / f"option-{current_option.option.lower()}-{option_image_index[current_option.option]:02d}.png"
        )
        extract_image(
            document,
            item.page_index,
            item.bbox,
            asset_output_path,
        )
        current_option.assets.append(relative_asset)
        previous_statement_block = None
        index += 1

    normalized_options = []
    for label in OPTION_LABELS:
        option = options.get(label, OptionContent(option=label))
        normalized_options.append(option.to_dict())

    statement = "\n\n".join(part for part in statement_parts if part.strip()).strip()
    raw_text = statement
    option_text = "\n".join(
        f"{option['option']}. {option['text']}".strip() for option in normalized_options
    ).strip()
    if option_text:
        raw_text = f"{raw_text}\n\n{option_text}".strip()

    return {
        "id": question.id,
        "examQuestionNumber": question.exam_question_number,
        "year": year,
        "area": area_label,
        "title": f"Questão {question.exam_question_number} — ENEM {year} — {area_label}",
        "sourcePages": sorted(question.source_pages),
        "statement": statement,
        "statementAssets": statement_assets,
        "imageUrl": statement_assets[0] if statement_assets else "/placeholder.png",
        "options": normalized_options,
        "rawText": raw_text,
    }


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    pdf_path = Path(args.pdf).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve()
    assets_root = Path(args.assets_dir).expanduser().resolve()
    question_start = args.question_start
    question_end = args.question_end
    year = args.year
    area_label = args.area_label.strip()
    area_slug = args.area_slug.strip().lower()

    if question_start > question_end:
        raise SystemExit("--question-start não pode ser maior que --question-end.")
    if not area_slug:
        raise SystemExit("--area-slug não pode ser vazio.")

    if not pdf_path.exists():
        raise SystemExit(f"PDF não encontrado: {pdf_path}")

    if assets_root.exists():
        shutil.rmtree(assets_root)
    assets_root.mkdir(parents=True, exist_ok=True)

    document = fitz.open(pdf_path)
    questions = collect_questions(
        document,
        question_start=question_start,
        question_end=question_end,
    )

    missing = [
        number
        for number in range(question_start, question_end + 1)
        if number not in questions
    ]
    if missing:
        raise SystemExit(f"Questões não encontradas no PDF: {missing}")

    materialized = [
        materialize_question(
            document,
            questions[number],
            assets_root,
            area_label=area_label,
            area_slug=area_slug,
            year=year,
        )
        for number in range(question_start, question_end + 1)
    ]

    booklet_number = infer_booklet_number(pdf_path)
    payload = {
        "metadata": {
            "sourcePdf": str(pdf_path),
            "bookletNumber": booklet_number,
            "questionRange": [question_start, question_end],
            "year": year,
            "areaLabel": area_label,
            "areaSlug": area_slug,
        },
        "questions": materialized,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(
        f"Extraídas {len(materialized)} questões para {output_path} "
        f"com assets em {assets_root}"
    )


if __name__ == "__main__":
    main()
