"""AI chat router backed by the Gemini service with rule-based fallback."""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas import ChatRequest, ChatResponse, ChatSource
from app.services import gemini

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse, summary="Send a message to Vridh-Mitra")
def chat(request: ChatRequest) -> ChatResponse:
    """Generate a senior-safe reply to the user's message."""
    reply, sources = gemini.generate_reply(
        message=request.message,
        history=request.history,
        language=request.language,
        user_profile=request.user_profile,
    )
    return ChatResponse(
        reply=reply,
        language=request.language,
        sources=sources if sources else [ChatSource(title="Vridh-Mitra Assistant", type="general")],
        disclaimer=gemini.DISCLAIMER_EN if request.language != "hi" else gemini.DISCLAIMER,
    )