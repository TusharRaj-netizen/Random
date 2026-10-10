"""Market medicine price-comparison & fluctuation tracker service.

Loads a comprehensive catalog of 40+ common Indian medicines from JSON.
Six months of price history (May–Oct) are generated deterministically with
source-specific realistic variations. Jan-Aushadhi prices are generic and far
below branded retail. Also provides search, basket cost calculation, and
transit fare estimation utilities.
"""

from __future__ import annotations

import json
import math
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional

from app.schemas import (
    BasketCalculationResponse,
    BasketItem,
    BasketResult,
    CurrentPrice,
    FluctuationResponse,
    MarketMedicine,
    MarketMedicineListResponse,
    MedicineInsight,
    MarketSearchResponse,
    PricePoint,
)

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "market_medicines.json"
_INSIGHTS_PATH = Path(__file__).resolve().parent.parent / "data" / "medicine_insights.json"

# Sources: discount off unit MRP for branded channels. Jan Aushadhi uses
# ja_per_unit from the catalog. NPPA is the government ceiling price.
_SOURCES = [
    {"name": "Tata 1mg", "discount": 0.18},
    {"name": "Apollo Pharmacy", "discount": 0.15},
    {"name": "MedPlus", "discount": 0.12},
    {"name": "Jan Aushadhi PMBJP", "discount": 0.0, "is_ja": True},
    {"name": "NPPA Government Ceiling Price", "discount": 0.0, "is_nppa": True},
]

FARE_RULES = {
    "bike": {"label": "Bike Taxi (Rapido / Uber Moto)", "base": 25.0, "per_km": 8.5},
    "auto": {"label": "Auto (Ola / Uber Auto)", "base": 30.0, "per_km": 14.0},
    "cab": {"label": "Cab (Uber Go / Ola Mini)", "base": 55.0, "per_km": 18.0},
}

_MONTHS = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]


@lru_cache
def _load_raw() -> List[Dict]:
    with _DATA_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


@lru_cache
def _load_insights_raw() -> List[Dict]:
    with _INSIGHTS_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _unit_price(seed: Dict, source: Dict, month_idx: int) -> float:
    """Compute a single unit's selling price for a source in a given month."""
    if source.get("is_ja"):
        return seed["ja_per_unit"]
    if source.get("is_nppa"):
        return seed["nppa_per_unit"]
    mrp = seed["unit_mrp"]
    drift = 1.0 + 0.03 * math.sin((month_idx / 5.0) * math.pi)
    return round(mrp * (1 - source["discount"]) * drift, 2)


@lru_cache
def _build_dataset() -> Dict:
    """Build medicines + 6-month price history dataset (cached)."""
    medicines: List[Dict] = []
    price_history: List[Dict] = []
    for seed in _load_raw():
        pack = seed["pack_size"]
        medicines.append(
            {
                "id": seed["id"],
                "brand_name": seed["brand_name"],
                "salt_composition": seed["salt_composition"],
                "manufacturer": seed["manufacturer"],
                "dosage_form": seed["dosage_form"],
                "pack_size": pack,
                "unit_mrp": seed["unit_mrp"],
            }
        )
        for src in _SOURCES:
            for mi, month in enumerate(_MONTHS):
                unit_price = _unit_price(seed, src, mi)
                if src.get("is_nppa"):
                    mrp_val = round(seed["nppa_per_unit"] * pack, 2)
                else:
                    mrp_val = round(seed["unit_mrp"] * pack, 2)
                selling = round(unit_price * pack, 2)
                price_history.append(
                    {
                        "medicine_id": seed["id"],
                        "recorded_date": month,
                        "source": src["name"],
                        "mrp": mrp_val,
                        "selling_price": selling,
                    }
                )
    return {"medicines": medicines, "price_history": price_history}


@lru_cache
def load_market_medicines() -> List[MarketMedicine]:
    data = _build_dataset()
    return [MarketMedicine(**m) for m in data["medicines"]]


def get_market_medicine(medicine_id: str) -> MarketMedicine | None:
    for m in load_market_medicines():
        if m.id == medicine_id:
            return m
    return None


def search_market_medicines(query: str = "", limit: int = 20) -> MarketSearchResponse:
    """Search market medicines by brand name or salt composition (autocomplete)."""
    meds = load_market_medicines()
    q = query.lower().strip()
    if not q:
        results = meds[:limit]
    else:
        scored = []
        for m in meds:
            score = 0
            fields = [m.brand_name.lower(), m.salt_composition.lower(), m.manufacturer.lower()]
            for f in fields:
                if q == f:
                    score += 100
                elif q in f:
                    score += 50
                else:
                    for token in q.split():
                        if len(token) >= 2 and token in f:
                            score += 5
            if score > 0:
                scored.append((m, score))
        scored.sort(key=lambda x: x[1], reverse=True)
        results = [m for m, _ in scored[:limit]]
    return MarketSearchResponse(query=query, count=len(results), medicines=results)


def list_market_medicines() -> MarketMedicineListResponse:
    meds = load_market_medicines()
    return MarketMedicineListResponse(count=len(meds), medicines=meds)


def get_fluctuations(medicine_id: str) -> FluctuationResponse | None:
    """Return current price comparison + 6-month history for a medicine."""
    medicine = get_market_medicine(medicine_id)
    if medicine is None:
        return None
    data = _build_dataset()
    history_raw = [p for p in data["price_history"] if p["medicine_id"] == medicine_id]
    history = [PricePoint(**p) for p in history_raw]
    latest_month = _MONTHS[-1]
    current: List[CurrentPrice] = []
    highest = 0.0
    ja_price = 0.0
    for src in _SOURCES:
        src_name = src["name"]
        rec = next((p for p in history_raw if p["source"] == src_name and p["recorded_date"] == latest_month), None)
        if not rec:
            continue
        is_ja = src.get("is_ja", False)
        price = rec["selling_price"]
        if price > highest and not src.get("is_nppa"):
            highest = price
        if is_ja:
            ja_price = price
        current.append(CurrentPrice(source=src_name, selling_price=price, mrp=rec["mrp"], is_jan_aushadhi=is_ja, savings_vs_highest=None))
    for cp in current:
        if highest > 0:
            cp.savings_vs_highest = round(highest - cp.selling_price, 2)
    monthly_savings = round((highest - ja_price) * 4, 2) if highest and ja_price else 0.0
    seed = next((s for s in _load_raw() if s["id"] == medicine_id), None)
    nppa_ceiling = round(seed["nppa_per_unit"] * seed["pack_size"], 2) if seed else 0.0
    return FluctuationResponse(medicine=medicine, nppa_ceiling_price=nppa_ceiling, current_prices=current, history=history, jan_aushadhi_monthly_savings=monthly_savings)


# ---------------------------------------------------------------------------
# Feature 3: Basket / recurring order planner
# ---------------------------------------------------------------------------
def calculate_basket(items: List[BasketItem], duration_days: int) -> BasketCalculationResponse:
    """Calculate total basket cost across all platforms for given items & duration."""
    results: List[BasketResult] = []
    for item in items:
        seed = next((s for s in _load_raw() if s["id"] == item.medicine_id), None)
        if seed is None:
            continue
        total_units = item.daily_dosage * duration_days
        pack = seed["pack_size"]
        strips_needed = math.ceil(total_units / pack)
        actual_units = strips_needed * pack
        prices: Dict[str, float] = {}
        for src in _SOURCES:
            unit_price = _unit_price(seed, src, len(_MONTHS) - 1)
            prices[src["name"]] = round(unit_price * actual_units, 2)
        highest = max(v for k, v in prices.items() if "NPPA" not in k)
        ja_total = prices.get("Jan Aushadhi PMBJP", 0.0)
        savings = round(highest - ja_total, 2) if highest and ja_total else 0.0
        results.append(BasketResult(medicine_id=item.medicine_id, brand_name=seed["brand_name"], daily_dosage=item.daily_dosage, duration_days=duration_days, total_units=actual_units, strips_needed=strips_needed, prices_per_source=prices, highest_price=round(highest, 2), jan_aushadhi_total=round(ja_total, 2), savings=round(savings, 2)))
    source_totals: Dict[str, float] = {}
    for src in _SOURCES:
        name = src["name"]
        source_totals[name] = round(sum(r.prices_per_source.get(name, 0) for r in results), 2)
    aggregate_savings = round(source_totals.get("MedPlus", 0) - source_totals.get("Jan Aushadhi PMBJP", 0), 2) if source_totals else 0.0
    return BasketCalculationResponse(items=results, duration_days=duration_days, source_totals=source_totals, total_savings=aggregate_savings)


# ---------------------------------------------------------------------------
# Feature 4: Transit fare estimation
# ---------------------------------------------------------------------------
def estimate_fares(distance_km: float) -> List[Dict]:
    """Return fare estimates for bike, auto, and cab for a given distance."""
    fares = []
    for key, rule in FARE_RULES.items():
        total = round(rule["base"] + rule["per_km"] * distance_km, 2)
        fares.append({"type": key, "label": rule["label"], "base_fare": rule["base"], "per_km_rate": rule["per_km"], "estimated_fare": total})
    return fares


# ---------------------------------------------------------------------------
# Feature 6: Medicine insights (tips & patient experiences)
# ---------------------------------------------------------------------------
def get_medicine_insight(medicine_id: str) -> Optional[MedicineInsight]:
    """Return lifestyle tips and patient experiences for a medicine."""
    for record in _load_insights_raw():
        if record["medicine_id"] == medicine_id:
            return MedicineInsight(**record)
    return None


__all__ = [
    "load_market_medicines",
    "get_market_medicine",
    "search_market_medicines",
    "list_market_medicines",
    "get_fluctuations",
    "calculate_basket",
    "estimate_fares",
    "get_medicine_insight",
]