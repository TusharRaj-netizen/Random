"""Market medicine price comparison, search, basket & insights router."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException, Query

from app.schemas import (
    BasketCalculationResponse,
    BasketItem,
    FareEstimateResponse,
    FluctuationResponse,
    MarketMedicineListResponse,
    MedicineInsight,
    MedicineSearchResponse,
)
from app.services import price_tracker

router = APIRouter(prefix="/market", tags=["market-prices"])


@router.get("/medicines", response_model=MarketMedicineListResponse, summary="List all market medicines")
def list_medicines() -> MarketMedicineListResponse:
    return price_tracker.list_market_medicines()


@router.get("/search", response_model=MedicineSearchResponse, summary="Search medicines (autocomplete)")
def search_medicines(
    q: str = Query("", description="Search query for brand name, salt or manufacturer"),
    limit: int = Query(20, ge=1, le=50),
) -> MedicineSearchResponse:
    return price_tracker.search_market_medicines(query=q, limit=limit)


@router.get(
    "/medicines/{medicine_id}/fluctuations",
    response_model=FluctuationResponse,
    summary="Price comparison & 6-month fluctuations for a medicine",
)
def fluctuations(medicine_id: str) -> FluctuationResponse:
    result = price_tracker.get_fluctuations(medicine_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Market medicine not found")
    return result


@router.get(
    "/medicines/{medicine_id}/insights",
    response_model=MedicineInsight,
    summary="Lifestyle tips & patient experiences for a medicine",
)
def medicine_insights(medicine_id: str) -> MedicineInsight:
    result = price_tracker.get_medicine_insight(medicine_id)
    if result is None:
        raise HTTPException(status_code=404, detail="No insights available for this medicine")
    return result


@router.post("/basket", response_model=BasketCalculationResponse, summary="Calculate recurring order basket cost")
def calculate_basket(items: List[BasketItem], duration_days: int = Query(30, ge=1, le=365)) -> BasketCalculationResponse:
    if not items:
        raise HTTPException(status_code=422, detail="At least one basket item is required")
    return price_tracker.calculate_basket(items=items, duration_days=duration_days)


@router.get("/fares", response_model=FareEstimateResponse, summary="Transit fare estimates for a distance")
def fare_estimates(distance_km: float = Query(..., ge=0, le=500)) -> FareEstimateResponse:
    from app.schemas import FareEstimate

    fares = [FareEstimate(**f) for f in price_tracker.estimate_fares(distance_km)]
    return FareEstimateResponse(distance_km=distance_km, fares=fares)