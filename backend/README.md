# Vridh-Mitra (वृद्ध-मित्र) | Backend

FastAPI backend powering the **Vridh-Mitra** Jan-Aushadhi healthcare copilot for
Indian senior citizens. It provides a Gemini-grounded AI chat assistant (with a
senior-safe rule-based fallback), a Jan-Aushadhi generic medicine catalogue,
medication reminders (in-memory store), and bilingual daily health tips.

## Features

- **AI Chat** (`/chat`) — Google Gemini with a strict senior-safety system prompt,
  grounded on the Jan-Aushadhi catalogue. Falls back to a deterministic, safe
  assistant when no API key is set. Detects emergencies (chest pain, stroke, …)
  in English & Hindi and immediately advises calling **112**.
- **Medicines** (`/medicines`) — search and detail endpoints over 24 common
  Jan-Aushadhi generics with prices, savings %, indications and precautions.
- **Reminders** (`/reminders`) — full CRUD for medication reminders with time
  slots, frequency and "take with food" flag, plus a `/due` endpoint.
- **Health Tips** (`/health/tips`) — bilingual (English/Hindi) daily tips.
- **Health check** (`/health`) and interactive docs at `/docs`.

## Setup

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # add your GEMINI_API_KEY (optional; fallback works without it)
uvicorn app.main:app --reload --port 8000
```

Open <http://localhost:8000/docs> for the interactive OpenAPI UI.

## Configuration

| Env var          | Default                          | Description                              |
|------------------|----------------------------------|------------------------------------------|
| `GEMINI_API_KEY` | _(empty → rule-based fallback)_  | Google Gemini API key                    |
| `GEMINI_MODEL`   | `gemini-2.0-flash`               | Gemini model id                          |
| `CORS_ORIGINS`   | `http://localhost:3000,...`      | Comma-separated allowed origins          |
| `HOST` / `PORT`  | `0.0.0.0` / `8000`               | Server bind address                      |
| `ENVIRONMENT`    | `development`                    | `production` disables auto-reload        |

## Tests

```bash
pip install pytest
pytest
```

All 23 tests cover the API, the chat/fallback logic and emergency detection.

## Project structure

```
backend/
├── app/
│   ├── main.py            # FastAPI app, CORS, lifespan, routers wiring
│   ├── config.py          # env-driven settings
│   ├── schemas.py         # Pydantic models
│   ├── routers/           # chat, medicines, reminders, health
│   ├── services/          # gemini (AI+fallback), janaushadhi, reminders, health_tips
│   └── data/              # medicines.json, health_tips.json
└── tests/
```