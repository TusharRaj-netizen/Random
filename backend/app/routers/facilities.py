"""Facilities (hospitals, pharmacies, Jan-Aushadhi Kendras) router."""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas import NearbyFacilitiesResponse
from app.services import facilities

router = APIRouter(prefix="/facilities", tags=["facilities"])


@router.get("/nearby", response_model=NearbyFacilitiesResponse, summary="Nearby healthcare facilities")
def nearby(
    lat: float | None = Query(None, description="User latitude (falls back to Guwahati)"),
    lng: float | None = Query(None, description="User longitude (falls back to Guwahati)"),
    filter: str = Query("all", pattern="^(all|hospital|pharmacy|jan_aushadhi)$"),
) -> NearbyFacilitiesResponse:
    return facilities.nearby_facilities(lat=lat, lng=lng, filter_val=filter)