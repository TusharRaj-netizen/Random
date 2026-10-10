"""Medication reminder router (in-memory store)."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException, Query

from app.schemas import Reminder, ReminderCreate, ReminderUpdate
from app.services import reminders as reminder_store

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get("", response_model=List[Reminder], summary="List medication reminders")
def list_reminders(active_only: bool = Query(False)) -> List[Reminder]:
    return reminder_store.list_reminders(active_only=active_only)


@router.post("", response_model=Reminder, status_code=201, summary="Create a reminder")
def create_reminder(payload: ReminderCreate) -> Reminder:
    return reminder_store.create_reminder(payload)


@router.get("/due", response_model=List[Reminder], summary="Reminders due right now")
def due_now() -> List[Reminder]:
    return reminder_store.due_now()


@router.get("/{reminder_id}", response_model=Reminder, summary="Get a single reminder")
def get_reminder(reminder_id: str) -> Reminder:
    reminder = reminder_store.get_reminder(reminder_id)
    if reminder is None:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return reminder


@router.patch("/{reminder_id}", response_model=Reminder, summary="Update a reminder")
def update_reminder(reminder_id: str, payload: ReminderUpdate) -> Reminder:
    updated = reminder_store.update_reminder(reminder_id, payload)
    if updated is None:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return updated


@router.delete("/{reminder_id}", status_code=204, summary="Delete a reminder")
def delete_reminder(reminder_id: str) -> None:
    if not reminder_store.delete_reminder(reminder_id):
        raise HTTPException(status_code=404, detail="Reminder not found")