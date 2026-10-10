# Vridh-Mitra (वृद्ध-मित्र) | Frontend

Mobile-first, senior-friendly Next.js (App Router) + Tailwind CSS + TypeScript
frontend for the Jan-Aushadhi Healthcare Copilot.

## Features

- **Home** — emergency 112 call button, quick actions, rotating daily health tip.
- **AI Chat** — talk to Vridh-Mitra; voice **input** (SpeechRecognition) and voice
  **output** (SpeechSynthesis, slower rate for senior ears), suggested questions.
- **Medicines** — search & filter Jan-Aushadhi generics; tap to expand price,
  savings, indications and precautions.
- **Reminders** — add / pause / delete medication reminders with multiple time slots.
- **Tips** — bilingual daily health tips.
- **About** — Jan-Aushadhi scheme info, helpline, emergency numbers.
- **Bilingual EN/हिं** toggle (persisted to localStorage) and large, high-contrast,
  accessible UI (≥52px tap targets, reduced-motion support).

API calls are proxied through a Next.js rewrite at `/api/*` → the FastAPI backend,
so no backend URL is exposed to the browser.

## Setup

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
# ensure the backend runs on http://127.0.0.1:8000 (or set BACKEND_URL)
```

`npm run build && npm run start` for production.

## Configuration

| Env var       | Default                    | Description                          |
|---------------|----------------------------|--------------------------------------|
| `BACKEND_URL` | `http://127.0.0.1:8000`    | Backend origin for the `/api/*` rewrite |

## Structure

```
frontend/
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── chat/ medicines/ reminders/ tips/ about/
├── components/   # Header, BottomNav, LanguageToggle, Disclaimer, TipIcon
├── lib/         # api.ts, language.tsx, speech.ts
└── public/      # manifest.json, icon.svg
```

## Accessibility notes

- Base font 1.125rem with generous line height; large touch targets everywhere.
- `prefers-reduced-motion` disables animations.
- Voice I/O lowers the barrier for users less comfortable typing.
- Every assistant message carries a "not a substitute for a doctor" disclaimer.
