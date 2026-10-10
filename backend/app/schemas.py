"""Pydantic request/response schemas for all API endpoints."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------
class MessageRole(str, Enum):
    user = "user"
    model = "model"


class ChatMessage(BaseModel):
    role: MessageRole
    content: str = Field(..., min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    history: List[ChatMessage] = Field(default_factory=list)
    language: str = Field("en", pattern="^(en|hi|hinglish)$")
    user_profile: Optional["UserProfile"] = None


class ChatSource(BaseModel):
    title: str
    type: str = "general"


class ChatResponse(BaseModel):
    reply: str
    language: str
    sources: List[ChatSource] = Field(default_factory=list)
    disclaimer: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Medicines (Jan-Aushadhi)
# ---------------------------------------------------------------------------
class Medicine(BaseModel):
    id: str
    name: str
    generic_name: str
    category: str
    indication: str
    jan_aushadhi_price_inr: float
    branded_price_inr: float
    dosage_form: str
    strength: str
    hindi_name: str
    precautions: str


class MedicineSearchRequest(BaseModel):
    query: str = Field("", max_length=200)
    category: Optional[str] = None


class MedicineSearchResponse(BaseModel):
    query: str
    count: int
    medicines: List[Medicine]


# ---------------------------------------------------------------------------
# Reminders
# ---------------------------------------------------------------------------
class ReminderFrequency(str, Enum):
    daily = "daily"
    twice_daily = "twice_daily"
    thrice_daily = "thrice_daily"
    weekly = "weekly"
    as_needed = "as_needed"


class ReminderBase(BaseModel):
    medicine_name: str = Field(..., min_length=1, max_length=200)
    dosage: str = Field(..., min_length=1, max_length=100)
    time_slots: List[str] = Field(..., min_length=1)
    frequency: ReminderFrequency = ReminderFrequency.daily
    notes: Optional[str] = Field("", max_length=500)
    with_food: bool = True


class ReminderCreate(ReminderBase):
    pass


class Reminder(ReminderBase):
    id: str
    created_at: datetime
    active: bool = True


class ReminderUpdate(BaseModel):
    medicine_name: Optional[str] = None
    dosage: Optional[str] = None
    time_slots: Optional[List[str]] = None
    frequency: Optional[ReminderFrequency] = None
    notes: Optional[str] = None
    with_food: Optional[bool] = None
    active: Optional[bool] = None


# ---------------------------------------------------------------------------
# Health tips
# ---------------------------------------------------------------------------
class HealthTip(BaseModel):
    id: str
    title: str
    title_hindi: str
    category: str
    body: str
    body_hindi: str
    icon: str


class HealthTipsResponse(BaseModel):
    count: int
    tips: List[HealthTip]


# ---------------------------------------------------------------------------
# User profile
# ---------------------------------------------------------------------------
class UserProfile(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = Field(None, ge=0, le=120)
    conditions: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)


class MedicineDetailResponse(Medicine):
    savings_percent: float
    savings_description: str


# ---------------------------------------------------------------------------
# Generic API envelope
# ---------------------------------------------------------------------------
class HealthCheck(BaseModel):
    status: str
    version: str
    gemini_available: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)


ChatRequest.model_rebuild()


# ---------------------------------------------------------------------------
# Feature 1: Facilities (hospitals, pharmacies, Jan-Aushadhi Kendras)
# ---------------------------------------------------------------------------
class FacilityType(str, Enum):
    hospital = "hospital"
    pharmacy = "pharmacy"
    jan_aushadhi = "jan_aushadhi"
    chemist_24x7 = "chemist_24x7"


class Facility(BaseModel):
    id: str
    name: str
    type: FacilityType
    lat: float
    lng: float
    address: str
    phone: Optional[str] = None
    open_hours: Optional[str] = None
    is_24x7: bool = False


class NearbyFacility(Facility):
    distance_km: float
    distance_label: str
    maps_url: str


class NearbyFacilitiesResponse(BaseModel):
    lat: float
    lng: float
    filter: str
    count: int
    facilities: List[NearbyFacility]


# ---------------------------------------------------------------------------
# Feature 3: Medicine market price comparison & fluctuation tracker
# ---------------------------------------------------------------------------
class MarketMedicine(BaseModel):
    id: str
    brand_name: str
    salt_composition: str
    manufacturer: str
    dosage_form: str


class PricePoint(BaseModel):
    medicine_id: str
    recorded_date: str
    source: str
    mrp: float
    selling_price: float


class CurrentPrice(BaseModel):
    source: str
    selling_price: float
    mrp: float
    is_jan_aushadhi: bool = False
    savings_vs_highest: Optional[float] = None


class FluctuationResponse(BaseModel):
    medicine: MarketMedicine
    nppa_ceiling_price: float
    current_prices: List[CurrentPrice]
    history: List[PricePoint]
    jan_aushadhi_monthly_savings: float


class MarketMedicineListResponse(BaseModel):
    count: int
    medicines: List[MarketMedicine]


# ---------------------------------------------------------------------------
# Feature 4: Government healthcare schemes for seniors
# ---------------------------------------------------------------------------
class GovScheme(BaseModel):
    id: str
    name_en: str
    name_hi: str
    category: str
    benefit_summary_en: str
    benefit_summary_hi: str
    eligibility_en: str
    eligibility_hi: str
    official_link: str
    icon: str


class SchemesResponse(BaseModel):
    count: int
    schemes: List[GovScheme]


# ---------------------------------------------------------------------------
# Feature 5: Cline assistant audit workflows
# ---------------------------------------------------------------------------
class AuditResult(BaseModel):
    workflow: str
    status: str
    summary: str
    details: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


__all__ = [
    "MessageRole",
    "ChatMessage",
    "ChatRequest",
    "ChatResponse",
    "ChatSource",
    "Medicine",
    "MedicineSearchRequest",
    "MedicineSearchResponse",
    "ReminderFrequency",
    "ReminderBase",
    "ReminderCreate",
    "Reminder",
    "ReminderUpdate",
    "HealthTip",
    "HealthTipsResponse",
    "UserProfile",
    "MedicineDetailResponse",
    "HealthCheck",
    "FacilityType",
    "Facility",
    "NearbyFacility",
    "NearbyFacilitiesResponse",
    "MarketMedicine",
    "PricePoint",
    "CurrentPrice",
    "FluctuationResponse",
    "MarketMedicineListResponse",
    "GovScheme",
    "SchemesResponse",
    "AuditResult",
]