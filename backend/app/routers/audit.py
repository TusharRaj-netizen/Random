"""Cline assistant audit-workflow router (Feature 5)."""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas import AuditResult
from app.services import audit

router = APIRouter(prefix="/cline", tags=["cline-assistant"])


@router.get("/workflows", summary="List available audit workflows")
def workflows() -> dict:
    return {"workflows": audit.list_workflows()}


@router.post("/run/{workflow}", response_model=AuditResult, summary="Run an audit workflow")
def run_workflow(workflow: str) -> AuditResult:
    return audit.run_workflow(workflow)