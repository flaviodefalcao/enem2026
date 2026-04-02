#!/usr/bin/env python3

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

import numpy as np
import pandas as pd


VALID_OPTIONS = ["A", "B", "C", "D", "E"]


@dataclass(frozen=True)
class AreaSpec:
    code: str
    nota_col: str


AREA_SPECS: dict[str, AreaSpec] = {
    "LC": AreaSpec(code="LC", nota_col="NU_NOTA_LC"),
    "CH": AreaSpec(code="CH", nota_col="NU_NOTA_CH"),
    "CN": AreaSpec(code="CN", nota_col="NU_NOTA_CN"),
    "MT": AreaSpec(code="MT", nota_col="NU_NOTA_MT"),
}


@dataclass
class PipelineConfig:
    output_root: Path
    year_start: int = 2024
    year_end: int = 2024
    areas: tuple[str, ...] = ("LC", "CH", "CN", "MT")
    external_input_root: Optional[Path] = None
    prefer_existing_artifacts: bool = True
    backup_before_overwrite: bool = True
    save_csv_outputs: bool = True
    discrepancy_rank_threshold: int = 5

    def output_dir(self, year: int) -> Path:
        return self.output_root / f"output_enem_all_areas_{year}"


class EnemAllAreasEnhancedMultiYearPipeline:
    def __init__(self, config: PipelineConfig):
        self.config = config

    def _artifact_path(
        self,
        year: int,
        area: str,
        basename: str,
        root: Path | None = None,
        ext: str = "parquet",
    ) -> Path:
        if root is None:
            base = self.config.output_dir(year) / area
        else:
            base = root / f"output_enem_all_areas_{year}" / area
        base.mkdir(parents=True, exist_ok=True)
        return base / f"{basename}.{ext}"

    def _load_artifact(self, year: int, area: str, basename: str) -> pd.DataFrame:
        local = self._artifact_path(year, area, basename)
        if local.exists():
            print(f"[LOCAL] {year}/{area} {basename}")
            return pd.read_parquet(local)

        if self.config.external_input_root:
            external = self._artifact_path(year, area, basename, root=self.config.external_input_root)
            if external.exists():
                print(f"[EXTERNAL] {year}/{area} {basename}")
                return pd.read_parquet(external)

        raise FileNotFoundError(f"{basename} não encontrado para {year}/{area}")

    @staticmethod
    def _make_parquet_safe(df: pd.DataFrame) -> pd.DataFrame:
        out = df.copy()
        for col in out.columns:
            dtype_str = str(out[col].dtype)
            if dtype_str.startswith("interval") or dtype_str == "category":
                out[col] = out[col].astype(str)
        return out

    def _backup_path(self, path: Path) -> Path:
        return path.with_suffix(path.suffix + ".bak")

    def _safe_save_file_backup(self, path: Path) -> None:
        if self.config.backup_before_overwrite and path.exists():
            backup = self._backup_path(path)
            path.replace(backup)

    def _safe_save_df(self, df: pd.DataFrame, year: int, area: str, basename: str) -> None:
        parquet_path = self._artifact_path(year, area, basename)
        self._safe_save_file_backup(parquet_path)
        self._make_parquet_safe(df).to_parquet(parquet_path, index=False)

        if self.config.save_csv_outputs:
            csv_path = self._artifact_path(year, area, basename, ext="csv")
            self._safe_save_file_backup(csv_path)
            df.to_csv(csv_path, index=False)

    @staticmethod
    def _normalize_response(series: pd.Series) -> pd.Series:
        out = series.astype("string").str.strip().str.upper()
        return out.where(out.notna(), pd.NA)

    @staticmethod
    def _media_geral_5(gold_a: pd.DataFrame) -> pd.Series:
        score_cols = ["NU_NOTA_CN", "NU_NOTA_CH", "NU_NOTA_LC", "NU_NOTA_MT", "NU_NOTA_REDACAO"]
        numeric_scores = gold_a.reindex(columns=score_cols).apply(pd.to_numeric, errors="coerce")
        return numeric_scores.mean(axis=1, skipna=True)

    def _high_perf_area_mask(self, spec: AreaSpec, gold_a: pd.DataFrame) -> pd.Series:
        if spec.code == "LC":
            return pd.to_numeric(gold_a["NU_NOTA_LC"], errors="coerce").ge(700).fillna(False)
        if spec.code == "CH":
            return pd.to_numeric(gold_a["NU_NOTA_CH"], errors="coerce").ge(780).fillna(False)
        if spec.code == "CN":
            return pd.to_numeric(gold_a["NU_NOTA_CN"], errors="coerce").ge(800).fillna(False)
        if spec.code == "MT":
            return pd.to_numeric(gold_a["NU_NOTA_MT"], errors="coerce").ge(900).fillna(False)
        return pd.Series(False, index=gold_a.index)

    def _group_masks(self, spec: AreaSpec, gold_a: pd.DataFrame) -> dict[str, pd.Series]:
        media5 = self._media_geral_5(gold_a)
        nota_area = pd.to_numeric(gold_a[spec.nota_col], errors="coerce")
        return {
            "geral": pd.Series(True, index=gold_a.index),
            "media5_800plus": media5.ge(800).fillna(False),
            "media5_750plus": media5.ge(750).fillna(False),
            "media5_700plus": media5.ge(700).fillna(False),
            "media5_lt650": media5.lt(650).fillna(False),
            "nota_area_lt600": nota_area.lt(600).fillna(False),
            "nota_area_900plus": nota_area.ge(900).fillna(False),
            "area_high_perf_custom": self._high_perf_area_mask(spec, gold_a),
            "600-699": nota_area.ge(600).fillna(False) & nota_area.lt(700).fillna(False),
            "700-799": nota_area.ge(700).fillna(False) & nota_area.lt(800).fillna(False),
            "800-899": nota_area.ge(800).fillna(False) & nota_area.lt(900).fillna(False),
            "900+": nota_area.ge(900).fillna(False),
            "<600": nota_area.lt(600).fillna(False),
        }

    def build_distractors(
        self,
        year: int,
        spec: AreaSpec,
        gold_a: pd.DataFrame,
        dim: pd.DataFrame,
    ) -> tuple[pd.DataFrame, pd.DataFrame]:
        response_columns = set(gold_a.columns)
        group_masks = self._group_masks(spec, gold_a)

        distractor_rows: list[dict[str, Any]] = []
        summary_rows: list[dict[str, Any]] = []

        for row in dim.itertuples(index=False):
            question_num = int(row.questao_num)
            canonical = str(row.questao_canonica)
            gabarito_ref = str(row.gabarito_ref).strip().upper()

            if canonical not in response_columns:
                raise KeyError(f"Coluna {canonical} não encontrada no Gold A para {year}/{spec.code}")

            responses = self._normalize_response(gold_a[canonical])

            for group_name, mask in group_masks.items():
                group_responses = responses.loc[mask]
                n_total = int(mask.sum())
                counts = group_responses.value_counts(dropna=True)

                for resposta_cat, n in counts.items():
                    distractor_rows.append(
                        {
                            "resposta_cat": resposta_cat,
                            "n": int(n),
                            "pct": float(n / n_total) if n_total else 0.0,
                            "questao_num": question_num,
                            "questao_canonica": canonical,
                            "grupo": group_name,
                            "gabarito_ref": gabarito_ref,
                        }
                    )

                wrong_valid = counts.reindex([option for option in VALID_OPTIONS if option != gabarito_ref]).fillna(0)
                if wrong_valid.sum() > 0:
                    dominant_option = str(wrong_valid.idxmax())
                    dominant_count = int(wrong_valid.max())
                    share_of_errors = float(dominant_count / wrong_valid.sum())
                else:
                    dominant_option = ""
                    dominant_count = 0
                    share_of_errors = 0.0

                summary_rows.append(
                    {
                        "questao_num": question_num,
                        "questao_canonica": canonical,
                        "grupo": group_name,
                        "gabarito_ref": gabarito_ref,
                        "n_total": n_total,
                        "distrator_dominante": dominant_option,
                        "pct_distrator_dominante": float(dominant_count / n_total) if n_total else 0.0,
                        "share_erro_no_principal_distrator": share_of_errors,
                        "tem_distrator_muito_forte": bool(share_of_errors >= 0.5 and dominant_count > 0),
                    }
                )

        return pd.DataFrame(distractor_rows), pd.DataFrame(summary_rows)

    def build_gold_b(
        self,
        year: int,
        spec: AreaSpec,
        gold_a: pd.DataFrame,
        dim: pd.DataFrame,
        distractor_summary: pd.DataFrame,
    ) -> pd.DataFrame:
        group_masks = self._group_masks(spec, gold_a)
        media5 = self._media_geral_5(gold_a)
        nota_area = pd.to_numeric(gold_a[spec.nota_col], errors="coerce")

        numeric_a = pd.to_numeric(dim["NU_PARAM_A"], errors="coerce")
        numeric_b = pd.to_numeric(dim["NU_PARAM_B"], errors="coerce")
        dim = dim.copy()
        dim["NU_PARAM_A"] = numeric_a
        dim["NU_PARAM_B"] = numeric_b
        dim["NU_PARAM_C"] = pd.to_numeric(dim["NU_PARAM_C"], errors="coerce")

        rows: list[dict[str, Any]] = []

        for row in dim.itertuples(index=False):
            question_num = int(row.questao_num)
            canonical = str(row.questao_canonica)
            gabarito_ref = str(row.gabarito_ref).strip().upper()

            responses = self._normalize_response(gold_a[canonical])
            attempted_mask = responses.notna() & responses.ne(".")
            valid_options_mask = responses.isin(VALID_OPTIONS)
            correct_mask = responses.eq(gabarito_ref)

            n_alunos = int(attempted_mask.sum())
            taxa_acerto = float(correct_mask.loc[attempted_mask].mean()) if n_alunos else 0.0

            stat_row: dict[str, Any] = {
                "questao_num": question_num,
                "n_alunos": n_alunos,
                "taxa_acerto": taxa_acerto,
                "nota_media_area": float(nota_area.mean(skipna=True)),
                "nota_media_geral_5": float(media5.mean(skipna=True)),
                "questao_canonica": canonical,
                "CO_ITEM": int(row.CO_ITEM) if pd.notna(row.CO_ITEM) else pd.NA,
                "gabarito_ref": gabarito_ref,
                "CO_HABILIDADE": int(row.CO_HABILIDADE) if pd.notna(row.CO_HABILIDADE) else pd.NA,
                "NU_PARAM_A": float(row.NU_PARAM_A) if pd.notna(row.NU_PARAM_A) else np.nan,
                "NU_PARAM_B": float(row.NU_PARAM_B) if pd.notna(row.NU_PARAM_B) else np.nan,
                "NU_PARAM_C": float(row.NU_PARAM_C) if pd.notna(row.NU_PARAM_C) else np.nan,
            }

            for group_name in ("media5_800plus", "media5_750plus", "media5_700plus", "media5_lt650"):
                group_attempted = attempted_mask & group_masks[group_name]
                stat_row[f"taxa_acerto_{group_name}"] = (
                    float(correct_mask.loc[group_attempted].mean()) if int(group_attempted.sum()) else 0.0
                )
                stat_row[f"n_{group_name}"] = int(group_attempted.sum())

            for bucket_name in ("600-699", "700-799", "800-899", "900+", "<600"):
                group_attempted = attempted_mask & group_masks[bucket_name]
                stat_row[f"taxa_{bucket_name}"] = (
                    float(correct_mask.loc[group_attempted].mean()) if int(group_attempted.sum()) else 0.0
                )
                stat_row[f"n_{bucket_name}"] = int(group_attempted.sum())

            stat_row["delta_800plus_vs_geral"] = stat_row["taxa_acerto_media5_800plus"] - taxa_acerto
            stat_row["delta_800plus_vs_lt650"] = (
                stat_row["taxa_acerto_media5_800plus"] - stat_row["taxa_acerto_media5_lt650"]
            )
            stat_row["disc_empirica_900_vs_lt600"] = stat_row["taxa_900+"] - stat_row["taxa_<600"]

            if attempted_mask.sum() > 0:
                item_acc_numeric = pd.to_numeric(correct_mask.loc[attempted_mask], errors="coerce")
                total_numeric = pd.to_numeric(nota_area.loc[attempted_mask], errors="coerce")
                corr_base = pd.DataFrame(
                    {"item_acc": item_acc_numeric, "nota_area": total_numeric}
                ).dropna()
                stat_row["corr_item_vs_nota_area"] = (
                    float(corr_base["item_acc"].corr(corr_base["nota_area"]))
                    if len(corr_base) >= 2
                    else np.nan
                )
            else:
                stat_row["corr_item_vs_nota_area"] = np.nan

            summary_slice = distractor_summary[
                distractor_summary["questao_num"] == question_num
            ].copy()
            for group_name in (
                "geral",
                "media5_800plus",
                "media5_lt650",
                "nota_area_900plus",
                "nota_area_lt600",
                "area_high_perf_custom",
            ):
                match = summary_slice.loc[summary_slice["grupo"] == group_name]
                if match.empty:
                    stat_row[f"distrator_dominante_{group_name}"] = ""
                    stat_row[f"pct_distrator_dominante_{group_name}"] = 0.0
                    stat_row[f"share_erro_no_principal_distrator_{group_name}"] = 0.0
                    stat_row[f"tem_distrator_muito_forte_{group_name}"] = False
                    continue

                item = match.iloc[0]
                stat_row[f"distrator_dominante_{group_name}"] = item["distrator_dominante"]
                stat_row[f"pct_distrator_dominante_{group_name}"] = float(
                    item["pct_distrator_dominante"]
                )
                stat_row[f"share_erro_no_principal_distrator_{group_name}"] = float(
                    item["share_erro_no_principal_distrator"]
                )
                stat_row[f"tem_distrator_muito_forte_{group_name}"] = bool(
                    item["tem_distrator_muito_forte"]
                )

            rows.append(stat_row)

        gold_b = pd.DataFrame(rows)

        gold_b["rank_dificuldade_empirica"] = (
            gold_b["taxa_acerto"].rank(method="dense", ascending=True).astype(int)
        )
        gold_b["rank_dificuldade_b"] = (
            pd.to_numeric(gold_b["NU_PARAM_B"], errors="coerce")
            .rank(method="dense", ascending=False)
            .astype("Int64")
        )
        gold_b["rank_dificuldade_entre_800plus"] = (
            gold_b["taxa_acerto_media5_800plus"].rank(method="dense", ascending=True).astype(int)
        )
        gold_b["diff_rank_b_vs_empirico"] = (
            pd.to_numeric(gold_b["rank_dificuldade_b"], errors="coerce")
            - pd.to_numeric(gold_b["rank_dificuldade_empirica"], errors="coerce")
        ).abs()

        return gold_b

    def build_param_b_audit(
        self,
        year: int,
        spec: AreaSpec,
        gold_b: pd.DataFrame,
    ) -> pd.DataFrame:
        audit = gold_b.copy()
        audit["diff_rank_b_vs_empirico_audit"] = pd.to_numeric(
            audit["diff_rank_b_vs_empirico"], errors="coerce"
        )
        audit["flag_discrepancia_rank_grande"] = (
            audit["diff_rank_b_vs_empirico_audit"]
            .ge(self.config.discrepancy_rank_threshold)
            .fillna(False)
        )
        audit["classificacao_auditoria"] = np.where(
            audit["flag_discrepancia_rank_grande"],
            "revisar_discrepancia",
            "ok",
        )
        return audit.sort_values(
            ["flag_discrepancia_rank_grande", "diff_rank_b_vs_empirico_audit", "questao_num"],
            ascending=[False, False, True],
        ).reset_index(drop=True)

    def build_final_cards(
        self,
        year: int,
        spec: AreaSpec,
        gold_b: pd.DataFrame,
        audit: pd.DataFrame,
    ) -> pd.DataFrame:
        audit_cols = [
            "questao_num",
            "diff_rank_b_vs_empirico_audit",
            "flag_discrepancia_rank_grande",
            "classificacao_auditoria",
        ]
        merged = gold_b.merge(audit[audit_cols], on="questao_num", how="left")

        def build_summary(row: pd.Series) -> str:
            parts = [
                f"Questão {row['questao_canonica']}.",
                f"Taxa de acerto geral: {row['taxa_acerto'] * 100:.1f}%.",
                f"Taxa de acerto entre média geral 800+: {row['taxa_acerto_media5_800plus'] * 100:.1f}%.",
                f"Delta 800+ vs geral: {(row['delta_800plus_vs_geral'] * 100):+.1f}%.",
                f"B TRI: {row['NU_PARAM_B']:.3f}." if pd.notna(row["NU_PARAM_B"]) else "B TRI: n/d.",
                f"Rank empírico: {int(row['rank_dificuldade_empirica'])}.",
                f"Rank B: {int(row['rank_dificuldade_b'])}."
                if pd.notna(row["rank_dificuldade_b"])
                else "Rank B: n/d.",
                f"Distrator dominante geral: {row['distrator_dominante_geral'] or 'n/d'}.",
                f"Distrator dominante em 800+: {row['distrator_dominante_media5_800plus'] or 'n/d'}.",
            ]
            if bool(row.get("flag_discrepancia_rank_grande", False)):
                parts.append(
                    "Alerta: discrepância grande entre dificuldade empírica e param_B; revisar mapping/população/item."
                )
            return " ".join(parts)

        merged["summary_auto"] = merged.apply(build_summary, axis=1)
        return merged.sort_values("questao_num").reset_index(drop=True)

    def run_area_backfill_distractors(self, year: int, area: str) -> None:
        spec = AREA_SPECS[area]
        print(f"[BACKFILL] {year} {area}")

        gold_a = self._load_artifact(year, area, "06_gold_a_student_wide")
        dim = self._load_artifact(year, area, "07_dim_questions")

        distractors, distractor_summary = self.build_distractors(year, spec, gold_a, dim)
        gold_b = self.build_gold_b(year, spec, gold_a, dim, distractor_summary)
        audit = self.build_param_b_audit(year, spec, gold_b)
        final_cards = self.build_final_cards(year, spec, gold_b, audit)

        self._safe_save_df(distractors, year, area, "09_item_distractors")
        self._safe_save_df(distractor_summary, year, area, "09_item_distractors_summary")
        self._safe_save_df(gold_b, year, area, "10_gold_b_item_stats")
        self._safe_save_df(audit, year, area, "11_audit_param_b_vs_accuracy")
        self._safe_save_df(final_cards, year, area, "12_final_question_cards")

        print(f"[OK] {year} {area}")

    def run_backfill_distractors(self) -> None:
        for year in range(self.config.year_start, self.config.year_end + 1):
            for area in self.config.areas:
                self.run_area_backfill_distractors(year, area)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Backfill incremental de distratores e camadas finais do ENEM.")
    parser.add_argument("--output-root", type=Path, required=True)
    parser.add_argument("--external-input-root", type=Path, default=None)
    parser.add_argument("--year", type=int, default=2024)
    parser.add_argument("--area", type=str, default=None, choices=list(AREA_SPECS))
    parser.add_argument("--all-areas", action="store_true")
    parser.add_argument("--save-csv", action="store_true")
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    config = PipelineConfig(
        output_root=args.output_root,
        external_input_root=args.external_input_root,
        year_start=args.year,
        year_end=args.year,
        areas=tuple(AREA_SPECS) if args.all_areas or args.area is None else (args.area,),
        save_csv_outputs=args.save_csv,
    )

    pipeline = EnemAllAreasEnhancedMultiYearPipeline(config)

    if args.all_areas or args.area is None:
        pipeline.run_backfill_distractors()
    else:
        pipeline.run_area_backfill_distractors(args.year, args.area)


if __name__ == "__main__":
    main()
