"""FastAPI application entrypoint for Vridh-Mitra backend."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app import __version__
from app.config import settings
from app.routers import chat, health, medicines, reminders


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: pre-load catalogue and tips caches.
    from app.services import health_tips, janaushadhi

    janaushadhi.load_medicines()
    health_tips.load_tips()
    yield
    # Shutdown: nothing to clean for the in-memory store.


app = FastAPI(
    title="Vridh-Mitra (वृद्ध-मित्र) | Jan-Aushadhi Healthcare Copilot",
    description=(
        "A senior-friendly healthcare copilot API for Indian senior citizens. "
        "Provides an AI chat assistant, a Jan-Aushadhi generic medicine catalogue, "
        "medication reminders, and daily health tips."
    ),
    version=__version__,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")


@app.get("/health", tags=["meta"], summary="Service health check")
def health_check():
    from app.schemas import HealthCheck

    return HealthCheck(status="ok", version=__version__, gemini_available=settings.gemini_available)


app.include_router(chat.router)
app.include_router(medicines.router)
app.include_router(reminders.router)
app.include_router(health.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=not settings.is_production)