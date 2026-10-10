"""Health tips service backed by a static bilingual dataset."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional

from app.schemas import HealthTip

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "health_tips.json"


@lru_cache
def load_tips() -> List[HealthTip]:
    """Load and cache the full list of health tips."""
    with _DATA_PATH.open("r", encoding="utf-8") as handle:
        return [HealthTip(**record) for record in json.load(handle)]


def get_tip_categories() -> List[str]:
    return sorted({tip.category for tip in load_tips()})


def tips_by_category(category: Optional[str] = None) -> List[HealthTip]:
    if not category:
        return load_tips()
    return [t for t in load_tips() if t.category.lower() == category.lower()]


def get_tip(tip_id: str) -> Optional[HealthTip]:
    for tip in load_tips():
        if tip.id == tip_id:
            return tip
    return None


__all__ = ["load_tips", "get_tip_categories", "tips_by_category", "get_tip"]