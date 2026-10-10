"""In-memory medication reminder store with thread-safe access.

Reminders persist for the lifetime of the server process. This keeps the
application dependency-free while remaining easy to swap for a real database
later (the public API surface is unchanged).
"""

from __future__ import annotations

import threading
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.schemas import Reminder, ReminderCreate, ReminderUpdate

_LOCK = threading.Lock()
_STORE: Dict[str, Reminder] = {}


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def list_reminders(active_only: bool = False) -> List[Reminder]:
    """Return all reminders, optionally filtered to active ones."""
    with _LOCK:
        items = list(_STORE.values())
    if active_only:
        items = [r for r in items if r.active]
    # Newest first for a natural UI ordering.
    items.sort(key=lambda r: r.created_at, reverse=True)
    return items


def get_reminder(reminder_id: str) -> Optional[Reminder]:
    with _LOCK:
        return _STORE.get(reminder_id)


def create_reminder(payload: ReminderCreate) -> Reminder:
    reminder = Reminder(
        id=str(uuid.uuid4()),
        created_at=_now(),
        **payload.model_dump(),
    )
    with _LOCK:
        _STORE[reminder.id] = reminder
    return reminder


def update_reminder(reminder_id: str, payload: ReminderUpdate) -> Optional[Reminder]:
    with _LOCK:
        existing = _STORE.get(reminder_id)
        if existing is None:
            return None
        updates = payload.model_dump(exclude_unset=True)
        updated = existing.model_copy(update=updates)
        _STORE[reminder_id] = updated
        return updated


def delete_reminder(reminder_id: str) -> bool:
    with _LOCK:
        return _STORE.pop(reminder_id, None) is not None


def clear_reminders() -> int:
    """Remove all reminders (used in tests). Returns the count removed."""
    with _LOCK:
        count = len(_STORE)
        _STORE.clear()
        return count


def due_now() -> List[Reminder]:
    """Return active reminders whose next time slot matches the current HH:MM.

    Uses the server's local time. The frontend can poll this endpoint to alert
    the user when a medicine is due.
    """
    now = _now()
    current_slot = now.strftime("%H:%M")
    due: List[Reminder] = []
    for reminder in list_reminders(active_only=True):
        if any(slot.strip() == current_slot for slot in reminder.time_slots):
            due.append(reminder)
    return due


__all__ = [
    "list_reminders",
    "get_reminder",
    "create_reminder",
    "update_reminder",
    "delete_reminder",
    "clear_reminders",
    "due_now",
]