"""Government healthcare schemes directory router."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas import GovScheme, SchemesResponse
from app.services import schemes

router = APIRouter(prefix="/schemes", tags=["schemes"])


@router.get("", response_model=SchemesResponse, summary="List government senior schemes")
def list_schemes() -> SchemesResponse:
    return schemes.list_schemes()


@router.get("/{scheme_id}", response_model=GovScheme, summary="Get a single scheme")
def get_scheme(scheme_id: str) -> GovScheme:
    scheme = schemes.get_scheme(scheme_id)
    if scheme is None:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme