"""Tests for the new features: facilities, market prices, schemes, Cline audit."""

from fastapi.testclient import TestClient

from app.main import app
from app.services import facilities, price_tracker, schemes, audit

client = TestClient(app)


# --- Feature 1: Facilities -------------------------------------------------
def test_facilities_nearby_default_location():
    resp = client.get("/facilities/nearby")
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] > 0
    assert data["facilities"][0]["distance_label"]


def test_facilities_filter_jan_aushadhi():
    resp = client.get("/facilities/nearby", params={"filter": "jan_aushadhi"})
    assert resp.status_code == 200
    for f in resp.json()["facilities"]:
        assert f["type"] == "jan_aushadhi"


def test_facilities_sorted_by_distance():
    resp = client.get("/facilities/nearby", params={"lat": 26.1878, "lng": 91.6916})
    dists = [f["distance_km"] for f in resp.json()["facilities"]]
    assert dists == sorted(dists)


def test_facilities_have_maps_url():
    resp = client.get("/facilities/nearby")
    f = resp.json()["facilities"][0]
    assert "google.com/maps/dir" in f["maps_url"]


def test_haversine():
    assert facilities.haversine_km(26.1878, 91.6916, 26.1878, 91.6916) == 0.0
    d = facilities.haversine_km(26.1878, 91.6916, 26.1800, 91.7500)
    assert 5 < d < 8  # ~6.5 km


# --- Feature 3: Market prices -----------------------------------------------
def test_market_medicines_list():
    resp = client.get("/market/medicines")
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] >= 4
    assert any(m["brand_name"] == "Metformin 500" for m in data["medicines"])


def test_market_fluctuations():
    resp = client.get("/market/medicines/M03/fluctuations")
    assert resp.status_code == 200
    data = resp.json()
    assert data["medicine"]["brand_name"] == "Metformin 500"
    assert len(data["history"]) == 30  # 5 sources x 6 months
    assert data["nppa_ceiling_price"] > 0
    ja = [c for c in data["current_prices"] if c["is_jan_aushadhi"]]
    branded = [c for c in data["current_prices"] if not c["is_jan_aushadhi"] and "NPPA" not in c["source"]]
    assert ja and branded
    assert ja[0]["selling_price"] < max(b["selling_price"] for b in branded)


def test_market_fluctuations_not_found():
    resp = client.get("/market/medicines/NOPE/fluctuations")
    assert resp.status_code == 404


# --- Feature 4: Schemes -----------------------------------------------------
def test_schemes_list():
    resp = client.get("/schemes")
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] == 4
    assert any(s["name_hi"] for s in data["schemes"])


def test_scheme_detail():
    resp = client.get("/schemes/ayushman-pmjay")
    assert resp.status_code == 200
    assert "beneficiary.nha.gov.in" in resp.json()["official_link"]


def test_scheme_not_found():
    resp = client.get("/schemes/missing")
    assert resp.status_code == 404


# --- Feature 5: Cline audit -------------------------------------------------
def test_cline_workflows_list():
    resp = client.get("/cline/workflows")
    assert resp.status_code == 200
    keys = [w["key"] for w in resp.json()["workflows"]]
    assert "nppa_check" in keys


def test_cline_run_workflow():
    resp = client.post("/cline/run/prescription_audit")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "completed"
    assert len(data["details"]) > 0


def test_cline_unknown_workflow():
    resp = client.post("/cline/run/does_not_exist")
    assert resp.status_code == 200
    assert resp.json()["status"] == "error"