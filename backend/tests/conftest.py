"""Pytest configuration: ensure deterministic tests by disabling the live
Gemini API. Tests exercise the rule-based fallback and the API surface, so we
force ``gemini_available`` to ``False`` regardless of any real key in ``.env``.

``load_dotenv`` (with the default ``override=False``) keeps an env var that is
already present, so setting ``GEMINI_API_KEY=""`` here (before the app config is
imported) makes the settings treat Gemini as unavailable.
"""

from __future__ import annotations

import os

# Force the fallback assistant for deterministic, network-free tests.
os.environ["GEMINI_API_KEY"] = ""

# Clear any cached settings singleton so the empty key takes effect.
try:
    from app import config as _config

    _config.get_settings.cache_clear()
    _config.settings = _config.get_settings()
except Exception:  # pragma: no cover - config not yet imported
    pass