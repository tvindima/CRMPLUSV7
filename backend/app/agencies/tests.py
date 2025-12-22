import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_agency():
    response = client.post(
        "/agencies/",
        json={
            "name": "Agência Lisboa",
            "address": "Av. Liberdade, Lisboa",
            "phone": "215678910",
            "email": "lisboa@crmplus.com",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Agência Lisboa"
