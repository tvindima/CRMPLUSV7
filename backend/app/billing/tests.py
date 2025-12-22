import pytest
from fastapi.testclient import TestClient
from app.main import app
from datetime import date

client = TestClient(app)


def test_create_plan():
    response = client.post(
        "/billing/plans/",
        json={
            "name": "Plano Pro",
            "price": 49.99,
            "description": "Plano avançado CRM PLUS.",
            "currency": "EUR",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Plano Pro"


def test_create_record():
    response = client.post(
        "/billing/records/",
        json={
            "agency_id": 1,
            "plan_id": 1,
            "amount": 49.99,
            "currency": "EUR",
            "paid_on": None,
            "created_at": date.today().isoformat(),
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == 49.99
