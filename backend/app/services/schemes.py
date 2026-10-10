"""Government healthcare schemes directory service."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from app.schemas import GovScheme, SchemesResponse

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "schemes.json"


@lru_cache
def load_schemes() -> List[GovScheme]:
    with _DATA_PATH.open("r", encoding="utf-8") as handle:
        return [GovScheme(**record) for record in json.load(handle)]


def list_schemes() -> SchemesResponse:
    schemes = load_schemes()
    return SchemesResponse(count=len(schemes), schemes=schemes)


def get_scheme(scheme_id: str) -> Optional[GovScheme]:
    for scheme in load_schemes():
        if scheme.id == scheme_id:
            return scheme
    return None


__all__ = ["load_schemes", "list_schemes", "get_scheme"]