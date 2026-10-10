"""Unit tests for the Gemini service fallback and emergency detection."""

from app.schemas import ChatMessage, MessageRole
from app.services import gemini, janaushadhi


def test_emergency_detection_english():
    assert gemini._is_emergency("I have severe chest pain now")
    assert gemini._is_emergency("he fainted and is unconscious")


def test_emergency_detection_hindi_split_phrase():
    assert gemini._is_emergency("मुझे छाती में तेज़ दर्द हो रहा है")


def test_non_emergency():
    assert not gemini._is_emergency("I have a mild headache")


def test_generate_reply_emergency_returns_112():
    reply, _ = gemini.generate_reply("severe chest pain", [], "en")
    assert "112" in reply


def test_generate_reply_finds_medicine():
    reply, sources = gemini.generate_reply("tell me about paracetamol", [], "en")
    assert "Paracetamol" in reply
    assert sources and sources[0].type == "medicine"


def test_generate_reply_with_history():
    history = [ChatMessage(role=MessageRole.user, content="hi")]
    reply, _ = gemini.generate_reply("tell me about metformin", history, "en")
    assert "Metformin" in reply


def test_catalogue_context_builds():
    ctx = janaushadhi.build_catalogue_context()
    assert "Paracetamol" in ctx or "Metformin" in ctx


def test_search_by_category():
    results = janaushadhi.search_medicines(category="Diabetes")
    assert all(m.category == "Diabetes" for m in results)
    assert len(results) >= 2