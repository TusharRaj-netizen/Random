"""Generate and load the market-medicine price-comparison dataset.

The raw medicines are defined here; six months of price history (May–Oct) are
generated deterministically with small, source-specific realistic variations
around an MRP and an NPPA government ceiling price. Jan-Aushadhi prices are
kept far below branded retail to reflect real savings.
"""

from __future__ import annotations

import math
from functools import lru_cache
from pathlib import Path
from typing import Dict, List

from app.schemas import (
    CurrentPrice,
    FluctuationResponse,
    MarketMedicine,
    MarketMedicineListResponse,
    PricePoint,
)

# Seed medicines: brand, salt, manufacturer, form, MRP (per strip), NPPA ceiling.
_MEDICINE_SEEDS = [
    {
        "id": "M01",
        "brand_name": "Augmentin 625",
        "salt_composition": "Amoxicillin (500mg) + Clavulanic Acid (125mg)",
        "manufacturer": "GSK Pharmaceuticals",
        "dosage_form": "Tablet (6 tablets/strip)",
        "mrp": 472.0,
        "nppa_ceiling": 80.0,
    },
    {
        "id": "M02",
        "brand_name": "Telma 40",
        "salt_composition": "Telmisartan (40mg)",
        "manufacturer": "Glenmark Pharmaceuticals",
        "dosage_form": "Tablet (15 tablets/strip)",
        "mrp": 195.0,
        "nppa_ceiling": 12.5,
    },
    {
        "id": "M03",
        "brand_name": "Metformin 500",
        "salt_composition": "Metformin Hydrochloride (500mg)",
        "manufacturer": "USV Pvt Ltd (Glycomet) / Generic",
        "dosage_form": "Tablet (20 tablets/strip)",
        "mrp": 68.0,
        "nppa_ceiling": 3.4,
    },
    {
        "id": "M04",
        "brand_name": "Pantocid 40",
        "salt_composition": "Pantoprazole (40mg)",
        "manufacturer": "Sun Pharmaceutical Industries",
        "dosage_form": "Capsule (15 capsules/strip)",
        "mrp": 180.0,
        "nppa_ceiling": 9.0,
    },
]

# Sources and their typical discount off MRP (fraction). Jan Aushadhi is generic
# and far cheaper (a small fraction of MRP). NPPA is the government ceiling.
_SOURCES = [
    {"name": "Tata 1mg", "discount": 0.18},
    {"name": "Apollo Pharmacy", "discount": 0.15},
    {"name": "MedPlus", "discount": 0.12},
    {"name": "Jan Aushadhi PMBJP", "discount": 0.0, "is_ja": True, "ja_factor": 0.12},
    {"name": "NPPA Government Ceiling Price", "discount": 0.0, "is_nppa": True},
]

# 6 months of history (most recent last): May, Jun, Jul, Aug, Sep, Oct
_MONTHS = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]


def _selling_price(mrp: float, discount: float, month_idx: int, is_ja: bool, ja_factor: float) -> float:
    """Compute a realistic selling price for a source in a given month."""
    if is_ja:
        # Jan Aushadhi generic price: stable, a fraction of MRP.
        return round(mrp * ja_factor, 2)
    # Branded: discount with a small sinusoidal seasonal drift (+/-3%).
    drift = 1.0 + 0.03 * math.sin((month_idx / 5.0) * math.pi)
    return round(mrp * (1 - discount) * drift, 2)


@lru_cache
def _build_dataset() -> Dict:
    """Build the medicines + price history dataset (cached)."""
    medicines: List[Dict] = []
    price_history: List[Dict] = []
    for seed in _MEDICINE_SEEDS:
        medicines.append(
            {
                "id": seed["id"],
                "brand_name": seed["brand_name"],
                "salt_composition": seed["salt_composition"],
                "manufacturer": seed["manufacturer"],
                "dosage_form": seed["dosage_form"],
                "mrp": seed["mrp"],
                "nppa_ceiling": seed["nppa_ceiling"],
            }
        )
        for src in _SOURCES:
            is_ja = src.get("is_ja", False)
            ja_factor = src.get("ja_factor", 0.1)
            is_nppa = src.get("is_nppa", False)
            for mi, month in enumerate(_MONTHS):
                if is_nppa:
                    units = 15
                    selling = round(seed["nppa_ceiling"] * units, 2)
                    mrp_val = round(seed["nppa_ceiling"] * units, 2)
                else:
                    selling = _selling_price(seed["mrp"], src["discount"], mi, is_ja, ja_factor)
                    mrp_val = seed["mrp"]
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


def get_nppa_ceiling(medicine_id: str) -> float:
    data = _build_dataset()
    for m in data["medicines"]:
        if m["id"] == medicine_id:
            return float(m["nppa_ceiling"]) * 15.0  # ceiling per strip
    return 0.0


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
        rec = next(
            (p for p in history_raw if p["source"] == src_name and p["recorded_date"] == latest_month),
            None,
        )
        if not rec:
            continue
        is_ja = src.get("is_ja", False)
        price = rec["selling_price"]
        if price > highest and not src.get("is_nppa"):
            highest = price
        if is_ja:
            ja_price = price
        current.append(
            CurrentPrice(
                source=src_name,
                selling_price=price,
                mrp=rec["mrp"],
                is_jan_aushadhi=is_ja,
                savings_vs_highest=None,
            )
        )
    for cp in current:
        if highest > 0:
            cp.savings_vs_highest = round(highest - cp.selling_price, 2)
    monthly_savings = round((highest - ja_price) * 4, 2) if highest and ja_price else 0.0

    nppa_ceiling = get_nppa_ceiling(medicine_id)
    return FluctuationResponse(
        medicine=medicine,
        nppa_ceiling_price=nppa_ceiling,
        current_prices=current,
        history=history,
        jan_aushadhi_monthly_savings=monthly_savings,
    )


__all__ = [
    "load_market_medicines",
    "get_market_medicine",
    "list_market_medicines",
    "get_fluctuations",
    "get_nppa_ceiling",
]