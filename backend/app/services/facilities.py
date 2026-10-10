"""Facilities service: nearby hospitals, pharmacies & Jan-Aushadhi Kendras.

Loads the facility dataset and computes great-circle distances with the
Haversine formula, returning results sorted by distance from the user.
"""

from __future__ import annotations

import json
import math
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from app.schemas import Facility, FacilityType, NearbyFacility, NearbyFacilitiesResponse

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "facilities.json"

# Default fallback location (Guwahati, Assam) when the device has no GPS.
DEFAULT_LAT = 26.1878
DEFAULT_LNG = 91.6916


@lru_cache
def _load_raw() -> List[dict]:
    with _DATA_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


@lru_cache
def load_facilities() -> List[Facility]:
    return [Facility(**record) for record in _load_raw()]


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two points in kilometres."""
    earth_radius_km = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(earth_radius_km * c, 2)


def _distance_label(km: float) -> str:
    if km < 1.0:
        return f"{int(km * 1000)} m away"
    return f"{km} km away"


def _maps_url(lat: float, lng: float) -> str:
    return f"https://www.google.com/maps/dir/?api=1&destination={lat},{lng}"


def _filter_match(facility: Facility, filter_val: str) -> bool:
    if filter_val == "all":
        return True
    if filter_val == "hospital":
        return facility.type == FacilityType.hospital
    if filter_val == "pharmacy":
        return facility.type in (FacilityType.pharmacy, FacilityType.chemist_24x7)
    if filter_val == "jan_aushadhi":
        return facility.type == FacilityType.jan_aushadhi
    return True


def nearby_facilities(
    lat: Optional[float],
    lng: Optional[float],
    filter_val: str = "all",
    limit: int = 30,
) -> NearbyFacilitiesResponse:
    """Return facilities sorted by distance from the user, filtered by type."""
    user_lat = DEFAULT_LAT if lat is None else float(lat)
    user_lng = DEFAULT_LNG if lng is None else float(lng)
    results: List[NearbyFacility] = []
    for facility in load_facilities():
        if not _filter_match(facility, filter_val):
            continue
        dist = haversine_km(user_lat, user_lng, facility.lat, facility.lng)
        results.append(
            NearbyFacility(
                **facility.model_dump(),
                distance_km=dist,
                distance_label=_distance_label(dist),
                maps_url=_maps_url(facility.lat, facility.lng),
            )
        )
    results.sort(key=lambda f: f.distance_km)
    return NearbyFacilitiesResponse(
        lat=user_lat,
        lng=user_lng,
        filter=filter_val,
        count=len(results),
        facilities=results[:limit],
    )


__all__ = [
    "load_facilities",
    "haversine_km",
    "nearby_facilities",
    "DEFAULT_LAT",
    "DEFAULT_LNG",
]