# Vridh-Mitra (वृद्ध-मित्र) | Jan-Aushadhi Healthcare Copilot

A **production-grade, mobile-first, senior-friendly** healthcare copilot web app
for Indian senior citizens (aged 60+). It helps them find affordable
**Jan-Aushadhi generic medicines**, understand what they are for, manage daily
**medicine reminders**, get **AI-powered health answers** (with voice in/out),
and read bilingual (English/Hindi) **daily health tips**.

> ⚠️ Vridh-Mitra is a support tool, **not a doctor**. It never diagnoses or
> prescribes. Always consult a physician. In an emergency, call **112**.

## Monorepo layout

```
/backend   FastAPI (Python) — AI chat, Jan-Aushadhi catalogue, reminders, tips
/frontend  Next.js App Router + Tailwind CSS + TypeScript — mobile-first PWA UI
```

See [`backend/README.md`](./backend/README.md) and
[`frontend/README.md`](./frontend/README.md) for per-project setup.

## Quick start (full stack)

```bash
# 1) Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # add GEMINI_API_KEY (optional; fallback works without it)
uvicorn app.main:app --reload --port 8000

# 2) Frontend (new terminal)
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

The Next.js dev server proxies `/api/*` to the FastAPI backend at
`http://127.0.0.1:8000` (override with `BACKEND_URL`).

## Highlights

- **Senior-first design** — large fonts (≥1.125rem), ≥52px tap targets,
  high-contrast palette, reduced-motion support, minimal jargon.
- **Bilingual EN / हिं** toggle, persisted to localStorage.
- **Voice I/O** — speak questions and listen to answers (Web Speech API,
  slower rate for senior ears).
- **Gemini-grounded assistant** with a strict senior-safety system prompt and a
  deterministic rule-based fallback when no API key is set; emergency
  detection (EN + Hindi) that immediately advises calling **112**.
- **24 common Jan-Aushadhi generics** with prices, branded-vs-generic savings,
  indications, and precautions.
- **Medication reminders** with multiple time slots, frequency, "take with
  food" flag, pause/delete.
- **OpenAPI docs** at `/docs` and a `/health` endpoint.

## Tests

```bash
cd backend && pytest          # 23 API + service tests
```

## Tech

- Backend: FastAPI · Pydantic v2 · google-genai · uvicorn · httpx
- Frontend: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · lucide-react
