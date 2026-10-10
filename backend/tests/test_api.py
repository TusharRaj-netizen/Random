"""End-to-end API tests using FastAPI's TestClient (no external network needed)."""

from fastapi.testclient import TestClient

from app.main import app
from app.services import reminders as reminder_store

client = TestClient(app)


def test_health_check():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_root_redirects_to_docs():
    resp = client.get("/", follow_redirects=False)
    assert resp.status_code in (302, 307)
    assert resp.headers["location"] == "/docs"


def test_medicine_search_returns_results():
    resp = client.get("/medicines", params={"query": "metformin"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] >= 1
    assert any("Metformin" in m["generic_name"] for m in data["medicines"])


def test_medicine_detail_with_savings():
    resp = client.get("/medicines/JA001")
    assert resp.status_code == 200
    data = resp.json()
    assert data["savings_percent"] > 0
    assert "Save" in data["savings_description"]


def test_medicine_not_found():
    resp = client.get("/medicines/DOES_NOT_EXIST")
    assert resp.status_code == 404


def test_medicine_categories():
    resp = client.get("/medicines/categories")
    assert resp.status_code == 200
    assert "Diabetes" in resp.json()["categories"]


def test_chat_medicine_reply_english():
    resp = client.post("/chat", json={"message": "tell me about metformin", "language": "en"})
    assert resp.status_code == 200
    data = resp.json()
    assert "Metformin" in data["reply"]
    assert data["disclaimer"]
    assert any(s["type"] == "medicine" for s in data["sources"])


def test_chat_hindi_reply():
    resp = client.post("/chat", json={"message": "दवा का दाम बताओ", "language": "hi"})
    assert resp.status_code == 200
    assert resp.json()["reply"]


def test_chat_emergency_english():
    resp = client.post("/chat", json={"message": "I have severe chest pain", "language": "en"})
    assert resp.status_code == 200
    assert "112" in resp.json()["reply"]


def test_chat_emergency_hindi():
    resp = client.post(
        "/chat", json={"message": "मुझे छाती में तेज़ दर्द हो रहा है", "language": "hi"}
    )
    assert resp.status_code == 200
    assert "112" in resp.json()["reply"]


def test_chat_validation_rejects_empty():
    resp = client.post("/chat", json={"message": "", "language": "en"})
    assert resp.status_code == 422


def test_health_tips_list():
    resp = client.get("/health/tips")
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] >= 1
    assert data["tips"][0]["title_hindi"]


def test_health_tip_not_found():
    resp = client.get("/health/tips/missing-tip")
    assert resp.status_code == 404


def test_reminder_crud():
    reminder_store.clear_reminders()
    create = client.post(
        "/reminders",
        json={
            "medicine_name": "Metformin",
            "dosage": "1 tablet",
            "time_slots": ["08:00", "20:00"],
            "frequency": "twice_daily",
            "with_food": True,
        },
    )
    assert create.status_code == 201
    rid = create.json()["id"]

    listed = client.get("/reminders")
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    patched = client.patch(f"/reminders/{rid}", json={"active": False})
    assert patched.status_code == 200
    assert patched.json()["active"] is False

    deleted = client.delete(f"/reminders/{rid}")
    assert deleted.status_code == 204

    get_after = client.get(f"/reminders/{rid}")
    assert get_after.status_code == 404


def test_reminder_validation_rejects_no_slots():
    resp = client.post(
        "/reminders",
        json={"medicine_name": "X", "dosage": "1", "time_slots": []},
    )
    assert resp.status_code == 422