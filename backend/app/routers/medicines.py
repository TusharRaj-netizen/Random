"""Jan-Aushadhi medicines catalogue router."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.schemas import MedicineDetailResponse, MedicineSearchResponse
from app.services import janaushadhi

router = APIRouter(prefix="/medicines", tags=["medicines"])


@router.get("", response_model=MedicineSearchResponse, summary="Search Jan-Aushadhi medicines")
def search_medicines(
    query: str = Query("", max_length=200, description="Free-text search"),
    category: Optional[str] = Query(None, description="Filter by category"),
) -> MedicineSearchResponse:
    results = janaushadhi.search_medicines(query=query, category=category)
    return MedicineSearchResponse(query=query, count=len(results), medicines=results)


@router.get("/categories", summary="List medicine categories")
def list_categories() -> dict:
    return {"categories": janaushadhi.get_categories()}


@router.get("/{medicine_id}", response_model=MedicineDetailResponse, summary="Get medicine detail")
def get_medicine(medicine_id: str) -> MedicineDetailResponse:
    medicine = janaushadhi.get_medicine(medicine_id)
    if medicine is None:
        raise HTTPException(status_code=404, detail="Medicine not found")
    savings = medicine.branded_price_inr - medicine.jan_aushadhi_price_inr
    pct = round(savings / medicine.branded_price_inr * 100, 1)
    return MedicineDetailResponse(
        **medicine.model_dump(),
        savings_percent=pct,
        savings_description=f"Save ₹{savings:g} ({pct}%) vs branded",
    )