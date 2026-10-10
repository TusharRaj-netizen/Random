"""Health tips and general health info router."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.schemas import HealthTip, HealthTipsResponse
from app.services import health_tips

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/tips", response_model=HealthTipsResponse, summary="List health tips")
def list_tips(category: Optional[str] = Query(None)) -> HealthTipsResponse:
    tips = health_tips.tips_by_category(category)
    return HealthTipsResponse(count=len(tips), tips=tips)


@router.get("/tips/categories", summary="List tip categories")
def list_tip_categories() -> dict:
    return {"categories": health_tips.get_tip_categories()}


@router.get("/tips/{tip_id}", response_model=HealthTip, summary="Get a single tip")
def get_tip(tip_id: str) -> HealthTip:
    tip = health_tips.get_tip(tip_id)
    if tip is None:
        raise HTTPException(status_code=404, detail="Tip not found")
    return tip