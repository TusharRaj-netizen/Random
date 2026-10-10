"""Jan-Aushadhi generic medicine catalogue service.

Loads the medicine dataset once and provides search/detail helpers used by
the medicines router and the AI chat grounding context.
"""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional

from app.schemas import Medicine

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "medicines.json"

# Common words that should not influence medicine matching.
_STOPWORDS = {
    "the", "a", "an", "and", "or", "of", "for", "to", "is", "in", "on", "with",
    "tell", "me", "about", "what", "how", "i", "my", "please", "give", "show",
    "find", "want", "need", "know", "does", "do", "can", "you", "this", "that",
    "help", "information", "details", "ki", "ka", "ke", "hai", "ho", "rah",
}


@lru_cache
def _load_raw() -> List[Dict[str, object]]:
    """Load and cache the raw medicine records from disk."""
    with _DATA_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


@lru_cache
def load_medicines() -> List[Medicine]:
    """Return the full list of validated :class:`Medicine` objects."""
    return [Medicine(**record) for record in _load_raw()]


def get_categories() -> List[str]:
    """Return a sorted list of unique medicine categories."""
    return sorted({m.category for m in load_medicines()})


def _score(medicine: Medicine, query: str) -> int:
    """Return a simple relevance score for a medicine against a query."""
    if not query:
        return 0
    q = query.lower().strip()
    fields = [
        medicine.name.lower(),
        medicine.generic_name.lower(),
        medicine.hindi_name,
        medicine.indication.lower(),
        medicine.category.lower(),
    ]
    score = 0
    for field in fields:
        if q == field:
            score += 100
        elif q in field:
            score += 50
    # Word-boundary token matching avoids short tokens (e.g. "me" in "metformin")
    # skewing results. Hindi tokens are matched as substrings because Devanagari
    # word boundaries are handled by split().
    for token in q.split():
        if len(token) < 3 or token in _STOPWORDS:
            continue
        for field in fields:
            if re.search(r"\b" + re.escape(token) + r"\b", field):
                score += 10
            elif token in field and not field.isascii():
                score += 6
    return score


def search_medicines(
    query: str = "", category: Optional[str] = None, limit: int = 50
) -> List[Medicine]:
    """Search medicines by free-text query and optional category filter."""
    query = (query or "").strip()
    results = load_medicines()
    if category:
        results = [m for m in results if m.category.lower() == category.lower()]
    if query:
        scored = [(m, _score(m, query)) for m in results]
        scored = [item for item in scored if item[1] > 0]
        scored.sort(key=lambda item: item[1], reverse=True)
        results = [item[0] for item in scored]
    return results[:limit]


def get_medicine(medicine_id: str) -> Optional[Medicine]:
    """Return a single medicine by id, or ``None`` if not found."""
    for medicine in load_medicines():
        if medicine.id.lower() == medicine_id.lower():
            return medicine
    return None


def build_catalogue_context(max_items: int = 12) -> str:
    """Build a compact text snapshot of the catalogue for AI grounding."""
    lines: List[str] = []
    for medicine in load_medicines()[:max_items]:
        lines.append(
            f"- {medicine.generic_name} ({medicine.hindi_name}): "
            f"{medicine.indication}. Jan Aushadhi price Rs.{medicine.jan_aushadhi_price_inr:g} "
            f"vs branded Rs.{medicine.branded_price_inr:g}. Precautions: {medicine.precautions}"
        )
    return "\n".join(lines)


__all__ = [
    "load_medicines",
    "get_categories",
    "search_medicines",
    "get_medicine",
    "build_catalogue_context",
]