"""Market medicine price comparison & fluctuation tracker router."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas import FluctuationResponse, MarketMedicineListResponse
from app.services import price_tracker

router = APIRouter(prefix="/market", tags=["market-prices"])


@router.get("/medicines", response_model=MarketMedicineListResponse, summary="List market medicines")
def list_medicines() -> MarketMedicineListResponse:
    return price_tracker.list_market_medicines()


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